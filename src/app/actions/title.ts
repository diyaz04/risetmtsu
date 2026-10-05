"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { CHAPTER_TITLES } from "@/lib/labels"

export type FormState = { error?: string; ok?: boolean }

const titleSchema = z.object({
  title: z.string().trim().min(10, "Judul minimal 10 karakter").max(200, "Judul maksimal 200 karakter"),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
})

export async function submitTitle(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("STUDENT")
  const profile = user.student
  if (!profile?.teacherId) return { error: "Kamu belum diklaim guru riset" }

  const parsed = titleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const research = await db.research.upsert({
    where: { studentId: profile.id },
    update: {},
    create: { studentId: profile.id },
  })

  const open = await db.titleSubmission.findFirst({
    where: { researchId: research.id, status: { in: ["PENDING", "APPROVED"] } },
  })
  if (open) {
    return { error: open.status === "APPROVED" ? "Judul kamu sudah disetujui" : "Judul sebelumnya masih menunggu review" }
  }

  await db.titleSubmission.create({
    data: { researchId: research.id, title: parsed.data.title, description: parsed.data.description || null },
  })
  revalidatePath("/siswa")
  revalidatePath("/guru", "layout")
  return { ok: true }
}

const reviewSchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["APPROVED", "REVISION", "REJECTED"]),
  note: z.string().trim().max(2000).optional(),
})

export async function reviewTitle(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("TEACHER")
  if (!user.teacher) return { error: "Akun guru belum punya bidang riset" }

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Data tidak valid" }
  const { submissionId, decision, note } = parsed.data
  if (decision !== "APPROVED" && !note) return { error: "Catatan wajib diisi untuk revisi atau penolakan" }

  const submission = await db.titleSubmission.findUnique({
    where: { id: submissionId },
    include: { research: { include: { student: true } } },
  })
  if (!submission || submission.research.student.teacherId !== user.teacher.id) {
    return { error: "Pengajuan tidak ditemukan" }
  }
  if (submission.status !== "PENDING") return { error: "Pengajuan ini sudah direview" }

  await db.$transaction(async (tx) => {
    await tx.titleSubmission.update({
      where: { id: submissionId },
      data: { status: decision, teacherNote: note || null, reviewedAt: new Date() },
    })
    if (decision === "APPROVED") {
      await tx.research.update({ where: { id: submission.researchId }, data: { title: submission.title } })
      await tx.chapter.createMany({
        data: CHAPTER_TITLES.map((_, i) => ({
          researchId: submission.researchId,
          number: i + 1,
          status: i === 0 ? ("DRAFT" as const) : ("LOCKED" as const),
        })),
        skipDuplicates: true,
      })
    }
  })

  revalidatePath("/guru", "layout")
  revalidatePath("/siswa")
  return { ok: true }
}
