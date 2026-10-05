"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { CHAPTER_TITLES } from "@/lib/labels"
import type { FormState } from "@/app/actions/title"

const schema = z.object({
  chapterId: z.string().min(1),
  decision: z.enum(["APPROVED", "REVISION"]),
  note: z.string().trim().max(5000).optional(),
})

export async function reviewChapter(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("TEACHER")
  if (!user.teacher) return { error: "Akun guru belum punya bidang riset" }

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Data tidak valid" }
  const { chapterId, decision, note } = parsed.data
  if (decision === "REVISION" && !note) return { error: "Catatan wajib diisi untuk permintaan revisi" }

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { research: { include: { student: true } } },
  })
  if (!chapter || chapter.research.student.teacherId !== user.teacher.id) return { error: "Bab tidak ditemukan" }
  if (chapter.status !== "SUBMITTED") return { error: "Bab ini tidak sedang menunggu review" }

  await db.$transaction(async (tx) => {
    await tx.chapter.update({ where: { id: chapterId }, data: { status: decision } })
    if (note) await tx.comment.create({ data: { chapterId, authorId: user.id, body: note } })
    // bab berikutnya terbuka setelah bab ini di-ACC
    if (decision === "APPROVED" && chapter.number < CHAPTER_TITLES.length) {
      await tx.chapter.updateMany({
        where: { researchId: chapter.researchId, number: chapter.number + 1, status: "LOCKED" },
        data: { status: "DRAFT" },
      })
    }
  })

  revalidatePath("/guru", "layout")
  revalidatePath("/siswa", "layout")
  return { ok: true }
}

/** Catatan tambahan tanpa mengubah status (mis. saat bab masih menunggu atau sudah disetujui). */
export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("TEACHER")
  if (!user.teacher) return { error: "Akun guru belum punya bidang riset" }

  const chapterId = String(formData.get("chapterId") ?? "")
  const body = String(formData.get("body") ?? "").trim()
  if (!body) return { error: "Catatan tidak boleh kosong" }
  if (body.length > 5000) return { error: "Catatan terlalu panjang" }

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { research: { include: { student: true } } },
  })
  if (!chapter || chapter.research.student.teacherId !== user.teacher.id) return { error: "Bab tidak ditemukan" }

  await db.comment.create({ data: { chapterId, authorId: user.id, body } })
  revalidatePath("/guru", "layout")
  revalidatePath("/siswa", "layout")
  return { ok: true }
}
