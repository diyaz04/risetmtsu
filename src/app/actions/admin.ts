"use server"

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

type StudentInput = { name: string; nis?: string; kelas?: string }

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
  const taken = await takenStudentUsernames()

  for (const input of inputs) {
    const name = input.name.trim().replace(/\s+/g, " ")
    if (!name) continue
    const nis = input.nis?.trim() || null
    const username = uniqueStudentUsername(name, taken)
    const password = generatePassword()
    try {
      await db.user.create({
        data: {
          name,
          username,
          passwordHash: await hashPassword(password),
          role: "STUDENT",
          student: { create: { nis, kelas: input.kelas?.trim() || null } },
        },
      })
      taken.add(username)
      credentials.push({ name, username, password })
    } catch (e) {
      const dupNis = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
      skipped.push({ line: name, reason: dupNis ? `NIS ${nis} sudah terdaftar` : "Gagal menyimpan" })
    }
  }
  revalidatePath("/admin", "layout")
  return { credentials, skipped }
}

const studentSchema = z.object({
  name: z.string().trim().min(3, "Nama lengkap minimal 3 huruf"),
  nis: z.string().trim().optional(),
  kelas: z.string().trim().optional(),
})

export async function addStudent(_prev: CreateResult | null, formData: FormData): Promise<CreateResult> {
  await requireRole("ADMIN")
  const parsed = studentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { credentials: [], skipped: [], error: parsed.error.issues[0].message }
  return createStudents([parsed.data])
}

/** Setiap baris: nama, nis, kelas (dipisah koma, titik koma, atau tab). Kolom nis & kelas opsional. */
export async function importStudents(_prev: CreateResult | null, formData: FormData): Promise<CreateResult> {
  await requireRole("ADMIN")
  const text = String(formData.get("rows") ?? "")
  const inputs = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", nis, kelas] = line.split(/[,;\t]/).map((c) => c.trim())
      return { name, nis, kelas }
    })
    // lewati baris header
    .filter((r, i) => !(i === 0 && /^nama/i.test(r.name)))
  if (inputs.length === 0) return { credentials: [], skipped: [], error: "Tidak ada data siswa" }
  if (inputs.length > 500) return { credentials: [], skipped: [], error: "Maksimal 500 siswa sekali impor" }
  return createStudents(inputs)
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
