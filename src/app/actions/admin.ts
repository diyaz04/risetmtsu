"use server"

import { randomUUID } from "node:crypto"
import ExcelJS from "exceljs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { generatePassword, hashPassword } from "@/lib/password"
import { STUDENT_DOMAIN, uniqueStudentUsername } from "@/lib/username"

export type Credential = { name: string; username: string; password: string }
export type CreateResult = {
  credentials: Credential[]
  skipped: { line: string; reason: string }[]
  error?: string
}

// password opsional: kosong -> dibuat acak. Dipakai sebagai password awal (wajib diganti saat login pertama).
type StudentInput = { name: string; nis?: string; kelas?: string; password?: string }

/**
 * Di produksi, error yang dilempar dari server action disamarkan Next.js (hanya "digest").
 * Tangkap di sini agar pesan sebenarnya tampil di form dan tercatat di log server.
 */
async function guard(label: string, fn: () => Promise<CreateResult>): Promise<CreateResult> {
  try {
    return await fn()
  } catch (e) {
    console.error(`[${label}]`, e)
    const msg = e instanceof Error ? e.message : String(e)
    const last = msg.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "kesalahan tidak diketahui"
    return { credentials: [], skipped: [], error: `Gagal menyimpan: ${last.slice(0, 300)}` }
  }
}

const MIN_PASSWORD = 6
const MAX_IMPORT = 500

async function takenStudentUsernames() {
  const rows = await db.user.findMany({
    where: { username: { endsWith: `@${STUDENT_DOMAIN}` } },
    select: { username: true },
  })
  return new Set(rows.map((r) => r.username))
}

async function createStudents(inputs: StudentInput[]): Promise<CreateResult> {
  const credentials: Credential[] = []
  const skipped: CreateResult["skipped"] = []

  const [taken, existingNis] = await Promise.all([
    takenStudentUsernames(),
    db.studentProfile.findMany({
      where: { nis: { in: inputs.map((i) => i.nis?.trim()).filter((n): n is string => !!n) } },
      select: { nis: true },
    }),
  ])
  const usedNis = new Set(existingNis.map((s) => s.nis))

  const users: Prisma.UserCreateManyInput[] = []
  const profiles: Prisma.StudentProfileCreateManyInput[] = []

  for (const input of inputs) {
    const name = input.name.trim().replace(/\s+/g, " ")
    if (!name) continue
    if (name.length < 3) {
      skipped.push({ line: name, reason: "Nama minimal 3 huruf" })
      continue
    }
    const nis = input.nis?.trim() || null
    if (nis && usedNis.has(nis)) {
      skipped.push({ line: name, reason: `NIS ${nis} sudah terdaftar` })
      continue
    }
    const given = input.password?.trim()
    if (given && given.length < MIN_PASSWORD) {
      skipped.push({ line: name, reason: `Password minimal ${MIN_PASSWORD} karakter` })
      continue
    }

    const username = uniqueStudentUsername(name, taken)
    const password = given || generatePassword()
    const id = randomUUID()
    taken.add(username)
    if (nis) usedNis.add(nis)

    users.push({ id, name, username, passwordHash: await hashPassword(password), role: "STUDENT" })
    profiles.push({ userId: id, nis, kelas: input.kelas?.trim() || null })
    credentials.push({ name, username, password })
  }

  if (users.length > 0) {
    try {
      // dua query sekaligus dalam satu transaksi, bukan satu per siswa
      await db.$transaction([db.user.createMany({ data: users }), db.studentProfile.createMany({ data: profiles })])
    } catch {
      return { credentials: [], skipped: [], error: "Gagal menyimpan data siswa. Coba lagi." }
    }
  }
  revalidatePath("/admin", "layout")
  return { credentials, skipped }
}

const studentSchema = z.object({
  name: z.string().trim().min(3, "Nama lengkap minimal 3 huruf"),
  nis: z.string().trim().optional(),
  kelas: z.string().trim().optional(),
  password: z.string().trim().optional(),
})

export async function addStudent(_prev: CreateResult | null, formData: FormData): Promise<CreateResult> {
  await requireRole("ADMIN")
  const parsed = studentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { credentials: [], skipped: [], error: parsed.error.issues[0].message }
  const res = await guard("addStudent", () => createStudents([parsed.data]))
  // satu siswa saja: tampilkan alasan penolakan sebagai error form
  if (res.credentials.length === 0 && res.skipped.length > 0 && !res.error) {
    return { credentials: [], skipped: [], error: res.skipped[0].reason }
  }
  return res
}

/** Baris tabel mentah dari file .xlsx / .csv: kolom A nama, B NIS, C kelas, D password (opsional). */
async function readRows(file: File): Promise<string[][]> {
  if (/\.csv$/i.test(file.name)) {
    return (await file.text())
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => l.split(/[,;\t]/).map((c) => c.trim()))
  }
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(await file.arrayBuffer())
  const sheet = wb.worksheets[0]
  if (!sheet) return []
  const rows: string[][] = []
  sheet.eachRow((row) => rows.push([1, 2, 3, 4].map((i) => row.getCell(i).text.trim())))
  return rows
}

export async function importStudents(_prev: CreateResult | null, formData: FormData): Promise<CreateResult> {
  await requireRole("ADMIN")
  const fail = (error: string): CreateResult => ({ credentials: [], skipped: [], error })

  let rows: string[][]
  const file = formData.get("file")
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000) return fail("File terlalu besar (maksimal 2 MB)")
    if (!/\.(xlsx|csv)$/i.test(file.name)) return fail("Format file harus .xlsx atau .csv")
    try {
      rows = await readRows(file)
    } catch {
      return fail("File tidak bisa dibaca. Pakai template yang disediakan.")
    }
  } else {
    // tempel teks (mis. salin dari Excel)
    rows = String(formData.get("rows") ?? "")
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => l.split(/[,;\t]/).map((c) => c.trim()))
  }

  const inputs = rows
    .filter((r, i) => !(i === 0 && /^nama/i.test(r[0] ?? ""))) // lewati baris header
    .map(([name = "", nis, kelas, password]) => ({ name, nis, kelas, password }))
    .filter((r) => r.name)
  if (inputs.length === 0) return fail("Tidak ada data siswa")
  if (inputs.length > MAX_IMPORT) return fail(`Maksimal ${MAX_IMPORT} siswa sekali impor`)
  return guard("importStudents", () => createStudents(inputs))
}

const teacherSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 huruf"),
  username: z.string().trim().toLowerCase().email("Username harus berbentuk email, mis. budi@riset.com"),
  field: z.enum(["AGAMA", "HUMANIORA", "SAINS"], { message: "Pilih bidang riset" }),
})

export async function addTeacher(_prev: CreateResult | null, formData: FormData): Promise<CreateResult> {
  await requireRole("ADMIN")
  const parsed = teacherSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { credentials: [], skipped: [], error: parsed.error.issues[0].message }
  const { name, username, field } = parsed.data

  return guard("addTeacher", async () => {
    if (await db.user.findUnique({ where: { username } })) {
      return { credentials: [], skipped: [], error: "Username sudah dipakai" }
    }
    const password = generatePassword()
    await db.user.create({
      data: {
        name,
        username,
        passwordHash: await hashPassword(password),
        role: "TEACHER",
        teacher: { create: { field } },
      },
    })
    revalidatePath("/admin", "layout")
    return { credentials: [{ name, username, password }], skipped: [] }
  })
}

export async function resetPassword(userId: string): Promise<Credential | { error: string }> {
  await requireRole("ADMIN")
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role === "ADMIN") return { error: "Pengguna tidak ditemukan" }
  const password = generatePassword()
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), mustChangePassword: true } })
  return { name: user.name, username: user.username, password }
}

export async function deleteUser(userId: string) {
  await requireRole("ADMIN")
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role === "ADMIN") return { error: "Pengguna tidak bisa dihapus" }
  await db.user.delete({ where: { id: userId } })
  revalidatePath("/admin", "layout")
  return { ok: true }
}

/** Lepas klaim: siswa kembali ke pool. Progres riset tetap tersimpan. */
export async function releaseStudent(studentId: string) {
  await requireRole("ADMIN")
  await db.studentProfile.update({
    where: { id: studentId },
    data: { teacherId: null, field: null, claimedAt: null },
  })
  revalidatePath("/admin", "layout")
  revalidatePath("/guru", "layout")
  return { ok: true }
}
