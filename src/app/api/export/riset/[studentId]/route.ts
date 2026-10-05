import { buildResearchDocx } from "@/lib/docx-export"
import { loadResearchForExport, safeFileName } from "@/lib/export-access"

export const runtime = "nodejs"
export const maxDuration = 60

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export async function GET(_req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const res = await loadResearchForExport(studentId)
  if ("denied" in res) return new Response(res.denied === 401 ? "Silakan login" : "Tidak ditemukan", { status: res.denied })

  if (res.chapters.length === 0) return new Response("Belum ada bab yang bisa diunduh", { status: 404 })

  const buffer = await buildResearchDocx(
    { ...res.meta, school: "MTs KH A Wahab Muhsin", year: new Date().getFullYear() },
    res.chapters.map((c) => ({ content: c.content })),
  )
  const name = safeFileName("Riset", res.meta.studentName) + ".docx"
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": DOCX,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  })
}
