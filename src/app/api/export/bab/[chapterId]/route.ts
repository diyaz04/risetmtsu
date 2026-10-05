import { buildChapterDocx } from "@/lib/docx-export"
import { loadChapterForExport, safeFileName } from "@/lib/export-access"
import { CHAPTER_TITLES } from "@/lib/labels"

export const runtime = "nodejs"
export const maxDuration = 60

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export async function GET(_req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params
  const res = await loadChapterForExport(chapterId)
  if ("denied" in res) return new Response(res.denied === 401 ? "Silakan login" : "Tidak ditemukan", { status: res.denied })

  const { chapter, meta } = res
  if (!chapter.content) return new Response("Bab ini belum ada isinya", { status: 404 })

  const buffer = await buildChapterDocx(chapter.content, `Bab ${chapter.number} ${CHAPTER_TITLES[chapter.number - 1]}`)
  const name = safeFileName(`Bab-${chapter.number}`, CHAPTER_TITLES[chapter.number - 1], meta.studentName) + ".docx"
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": DOCX,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  })
}
