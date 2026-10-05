import { notFound, redirect } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { PrintView } from "@/components/print-view"
import { loadResearchForExport } from "@/lib/export-access"

export const metadata = { title: "Cetak Riset" }

export default async function CetakRisetPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const res = await loadResearchForExport(studentId)
  if ("denied" in res) {
    if (res.denied === 401) redirect("/login")
    notFound()
  }
  if (res.chapters.length === 0) notFound()

  return (
    <PrintView
      cover={{ ...res.meta, school: "MTs KH A Wahab Muhsin", year: new Date().getFullYear() }}
      chapters={res.chapters.map((c) => ({ key: c.id, content: c.content as JSONContent }))}
    />
  )
}
