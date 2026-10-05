import Link from "next/link"
import { ExportButtons } from "@/components/export-buttons"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ChapterList, Stepper, TitleHistory } from "@/components/research-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { ReviewForm } from "./review-form"

export default async function GuruSiswaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole("TEACHER")

  const student = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      research: {
        include: { chapters: { orderBy: { number: "asc" } }, titles: { orderBy: { createdAt: "desc" } } },
      },
    },
    relationLoadStrategy: "join",
  })
  // guru hanya boleh melihat siswa yang dia klaim
  if (!student || !user.teacher || student.teacherId !== user.teacher.id) notFound()

  const titles = student.research?.titles ?? []
  const chapters = student.research?.chapters ?? []
  const pending = titles.find((t) => t.status === "PENDING")
  const approved = titles.find((t) => t.status === "APPROVED")

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href="/guru" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Siswa Saya
        </Link>
        <h1 className="text-2xl font-semibold">{student.user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {student.kelas ? `Kelas ${student.kelas}` : "Kelas -"}
          {student.nis ? ` · NIS ${student.nis}` : ""}
        </p>
      </div>

      <Stepper titleApproved={!!approved} chapters={chapters} />

      {pending && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle>Review pengajuan judul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{pending.title}</p>
              {pending.description && <p className="mt-1 text-sm text-muted-foreground">{pending.description}</p>}
            </div>
            <ReviewForm submissionId={pending.id} />
          </CardContent>
        </Card>
      )}

      {approved && (
        <section className="space-y-4">
          <div className="rounded-xl border bg-emerald-50/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Judul riset</p>
            <p className="mt-1 text-lg font-semibold">{approved.title}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Bab Riset</h2>
            {chapters.some((c) => c.content) && <ExportButtons studentId={student.id} />}
          </div>
          <ChapterList chapters={chapters} hrefFor={(n) => `/guru/siswa/${id}/bab/${n}`} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Riwayat Pengajuan Judul</h2>
        <TitleHistory submissions={titles} />
      </section>
    </div>
  )
}
