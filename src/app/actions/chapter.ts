"use server"

import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"

const MAX_BYTES = 2_000_000 // ~2 MB per bab

type Doc = { type?: string; text?: string; content?: Doc[] }

function textLength(node: Doc): number {
  return (node.text?.length ?? 0) + (node.content?.reduce((n, c) => n + textLength(c), 0) ?? 0)
}

async function ownChapter(chapterId: string) {
  const user = await requireRole("STUDENT")
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { research: { include: { student: true } } },
  })
  if (!chapter || chapter.research.student.userId !== user.id) return null
  return chapter
}

// Dokumen dikirim sebagai string JSON: objek Tiptap/ProseMirror memakai prototype null,
// yang tidak bisa diserialisasi Next.js ke server action.
function validate(raw: string): { error: string } | { doc: Doc } {
  if (typeof raw !== "string" || raw.length > MAX_BYTES) return { error: "Dokumen terlalu besar" }
  let doc: Doc
  try {
    doc = JSON.parse(raw)
  } catch {
    return { error: "Isi dokumen tidak valid" }
  }
  if (!doc || doc.type !== "doc") return { error: "Isi dokumen tidak valid" }
  return { doc }
}

/** Auto-save / tombol Simpan. Hanya untuk bab berstatus Draft atau Revisi. */
export async function saveChapter(chapterId: string, content: string): Promise<{ ok: true } | { error: string }> {
  const chapter = await ownChapter(chapterId)
  if (!chapter) return { error: "Bab tidak ditemukan" }
  if (chapter.status !== "DRAFT" && chapter.status !== "REVISION") return { error: "Bab ini tidak bisa diedit" }
  const v = validate(content)
  if ("error" in v) return v

  await db.chapter.update({ where: { id: chapterId }, data: { content: v.doc as Prisma.InputJsonValue } })
  return { ok: true }
}

/** Simpan lalu kirim ke guru. Membuat snapshot versi untuk riwayat. */
export async function submitChapter(chapterId: string, content: string): Promise<{ ok: true } | { error: string }> {
  const chapter = await ownChapter(chapterId)
  if (!chapter) return { error: "Bab tidak ditemukan" }
  if (chapter.status !== "DRAFT" && chapter.status !== "REVISION") return { error: "Bab ini tidak bisa dikirim" }
  const v = validate(content)
  if ("error" in v) return v
  if (textLength(v.doc) < 50) return { error: "Isi bab terlalu pendek untuk dikirim" }

  const json = v.doc as Prisma.InputJsonValue
  await db.$transaction([
    db.chapter.update({
      where: { id: chapterId },
      data: { content: json, status: "SUBMITTED", submittedAt: new Date() },
    }),
    db.chapterVersion.create({ data: { chapterId, content: json } }),
  ])

  revalidatePath("/siswa", "layout")
  revalidatePath("/guru", "layout")
  return { ok: true }
}
