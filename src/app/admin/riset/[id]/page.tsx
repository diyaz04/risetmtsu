import Link from "next/link"
import { ExportButtons } from "@/components/export-buttons"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ProgressBar } from "@/components/progress-bar"
import { ChapterList, Stepper, TitleHistory } from "@/components/research-progress"
import { StatusBadge } from "@/components/status-badge"
import { db } from "@/lib/db"
import { FIELD_LABEL, FIELD_TONE } from "@/lib/labels"
import { summarize } from "@/lib/progress"
import { cn } from "@/lib/utils"

export default async function AdminRisetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const student = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      teacher: { include: { user: true } },
      research: {
        include: { chapters: { orderBy: { number: "asc" } }, titles: { orderBy: { createdAt: "desc" } } },
      },
    },
    relationLoadStrategy: "join",
  })
  if (!student) notFound()

  const titles = student.research?.titles ?? []
  const chapters = student.research?.chapters ?? []
  const approved = titles.find((t) => t.status === "APPROVED")
  const sum = summarize({ claimed: !!student.teacherId, chapters, titles })

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/admin/riset" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Semua Riset
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{student.user.name}</h1>
          <StatusBadge status={sum.tone} label={sum.label} />
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <div>
            Kelas <span className="text-foreground">{student.kelas ?? "-"}</span>
          </div>
          <div>
            NIS <span className="text-foreground">{student.nis ?? "-"}</span>
          </div>
          <div>
            Pembimbing <span className="text-foreground">{student.teacher?.user.name ?? "-"}</span>
          </div>
          {student.field && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", FIELD_TONE[student.field].badge)}>
              {FIELD_LABEL[student.field]}
            </span>
          )}
        </dl>
      </div>

      {!student.teacherId ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Siswa ini belum diklaim guru riset, jadi belum ada riset yang berjalan.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            <Stepper titleApproved={!!approved} chapters={chapters} />
            <div className="flex items-center gap-3">
              <ProgressBar value={sum.percent} className="max-w-xs" />
              <span className="text-sm text-muted-foreground">
                {sum.percent}% · {sum.approvedChapters}/5 bab disetujui
              </span>
            </div>
          </div>

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
              <ChapterList chapters={chapters} hrefFor={(n) => `/admin/riset/${id}/bab/${n}`} />
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Riwayat Pengajuan Judul</h2>
            <TitleHistory submissions={titles} />
          </section>
        </>
      )}
    </div>
  )
}
