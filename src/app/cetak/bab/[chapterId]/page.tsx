import { notFound, redirect } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { PrintView } from "@/components/print-view"
import { loadChapterForExport } from "@/lib/export-access"

export const metadata = { title: "Cetak Bab" }

export default async function CetakBabPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params
  const res = await loadChapterForExport(chapterId)
  if ("denied" in res) {
    if (res.denied === 401) redirect("/login")
    notFound()
  }
  if (!res.chapter.content) notFound()

  return <PrintView chapters={[{ key: res.chapter.id, content: res.chapter.content as JSONContent }]} />
}
