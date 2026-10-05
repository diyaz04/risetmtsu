import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, FileQuestion, Users } from "lucide-react"
import { ProgressBar } from "@/components/progress-bar"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { FIELDS, FIELD_LABEL, FIELD_TONE } from "@/lib/labels"
import { summarize } from "@/lib/progress"
import { cn } from "@/lib/utils"

export default async function AdminDashboard() {
  const [students, teachers] = await Promise.all([
    db.studentProfile.findMany({
      select: {
        field: true,
        teacherId: true,
        research: {
          select: {
            chapters: { select: { number: true, status: true } },
            titles: { select: { status: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
      relationLoadStrategy: "join",
    }),
    db.teacherProfile.findMany({ select: { field: true } }),
  ])

  const rows = students.map((s) => ({
    field: s.field,
    ...summarize({ claimed: !!s.teacherId, chapters: s.research?.chapters ?? [], titles: s.research?.titles ?? [] }),
  }))

  const unclaimed = rows.filter((r) => r.state === "UNCLAIMED").length
  const done = rows.filter((r) => r.state === "DONE").length
  const waiting = rows.filter((r) => r.needsReview).length

  const stats = [
    { label: "Total siswa", value: rows.length, icon: Users },
    { label: "Belum diklaim guru", value: unclaimed, icon: FileQuestion },
    { label: "Menunggu review guru", value: waiting, icon: Clock },
    { label: "Riset selesai", value: done, icon: CheckCircle2 },
  ]

  const perField = FIELDS.map((f) => {
    const list = rows.filter((r) => r.field === f)
    return {
      field: f,
      total: list.length,
      teachers: teachers.filter((t) => t.field === f).length,
      done: list.filter((r) => r.state === "DONE").length,
      waiting: list.filter((r) => r.needsReview).length,
      noTitle: list.filter((r) => r.state === "NO_TITLE" || r.state === "TITLE_REVISION").length,
      avg: list.length ? Math.round(list.reduce((n, r) => n + r.percent, 0) / list.length) : 0,
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">Ringkasan seluruh riset MTs KH A Wahab Muhsin</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <s.icon className="size-4" /> {s.label}
              </CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Per Kategori Riset</h2>
          <Link href="/admin/riset" className="text-sm text-primary hover:underline">
            Lihat semua riset
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {perField.map((p) => (
            <Link key={p.field} href={`/admin/riset?bidang=${p.field}`} className="group">
              <Card className={cn("h-full border-t-4 transition-shadow group-hover:shadow-md", FIELD_TONE[p.field].accent)}>
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", FIELD_TONE[p.field].badge)}>
                      {FIELD_LABEL[p.field]}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl">{p.total}</CardTitle>
                    <CardDescription>siswa · {p.teachers} guru</CardDescription>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Rata-rata progres</span>
                      <span className="font-medium text-foreground">{p.avg}%</span>
                    </div>
                    <ProgressBar value={p.avg} />
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-emerald-50 p-2">
                      <dd className="text-base font-semibold text-emerald-700">{p.done}</dd>
                      <dt className="text-muted-foreground">Selesai</dt>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2">
                      <dd className="text-base font-semibold text-amber-700">{p.waiting}</dd>
                      <dt className="text-muted-foreground">Perlu review</dt>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <dd className="text-base font-semibold">{p.noTitle}</dd>
                      <dt className="text-muted-foreground">Belum judul</dt>
                    </div>
                  </dl>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
        {unclaimed > 0 && (
          <Link
            href="/admin/riset?bidang=BELUM"
            className="flex items-center justify-between rounded-xl border border-dashed p-4 text-sm hover:bg-accent/40"
          >
            <span>
              <span className="font-medium">{unclaimed} siswa</span> belum diklaim guru riset mana pun
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        )}
      </section>
    </div>
  )
}
