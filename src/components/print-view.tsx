"use client"

import { useRouter } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { ArrowLeft, Printer } from "lucide-react"
import { DocEditor } from "@/components/doc-editor"
import { Button } from "@/components/ui/button"

export type PrintCover = {
  title: string
  studentName: string
  kelas: string | null
  nis: string | null
  fieldLabel: string | null
  teacherName: string | null
  school: string
  year: number
}

export function PrintView({
  cover,
  chapters,
}: {
  cover?: PrintCover
  chapters: { key: string; content: JSONContent | null }[]
}) {
  const router = useRouter()
  const info = cover
    ? ([
        ["Kelas", cover.kelas],
        ["NIS", cover.nis],
        ["Bidang", cover.fieldLabel],
        ["Pembimbing", cover.teacherName],
      ] as const).filter(([, v]) => v)
    : []

  return (
    <div className="min-h-screen bg-muted/60 print:bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft /> Kembali
        </Button>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Klik Cetak, lalu pilih tujuan <span className="font-medium text-foreground">Simpan sebagai PDF</span>.
        </p>
        <Button onClick={() => window.print()}>
          <Printer /> Cetak / Simpan PDF
        </Button>
      </div>

      <div className="space-y-6 px-2 py-6 print:space-y-0 print:p-0 sm:px-6">
        {cover && (
          <div className="paper-doc mx-auto flex flex-col items-center text-center">
            <p className="mt-24 text-2xl font-bold">LAPORAN RISET</p>
            <p className="mt-8 text-xl font-bold uppercase">{cover.title}</p>
            <p className="mt-16">Disusun oleh:</p>
            <p className="mt-2 text-xl font-bold">{cover.studentName}</p>
            <div className="mt-2 space-y-1">
              {info.map(([k, v]) => (
                <p key={k}>
                  {k}: {v}
                </p>
              ))}
            </div>
            <p className="mt-32 text-xl font-bold uppercase">{cover.school}</p>
            <p className="text-xl font-bold">{cover.year}</p>
          </div>
        )}
        {chapters.map((c) => (
          <div key={c.key} className="print-break">
            <DocEditor bare initialContent={c.content} editable={false} />
          </div>
        ))}
      </div>
    </div>
  )
}
