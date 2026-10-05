import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, FileQuestion, Users } from "lucide-react"
import { ProgressBar } from "@/components/progress-bar"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { compareKelas, kelasHref } from "@/lib/kelas"
import { FIELD_LABEL } from "@/lib/labels"
import { summarize } from "@/lib/progress"

export default async function GuruDashboard() {
  const user = await requireRole("TEACHER")
  const students = user.teacher
    ? await db.studentProfile.findMany({
        where: { teacherId: user.teacher.id },
        select: {
          id: true,
          kelas: true,
          user: { select: { name: true } },
          research: {
            select: {
              chapters: { select: { id: true, number: true, status: true } },
              titles: { select: { status: true }, orderBy: { createdAt: "desc" } },
            },
          },
        },
        relationLoadStrategy: "join",
        orderBy: { user: { name: "asc" } },
      })
    : []

  const rows = students.map((s) => ({
    ...s,
    sum: summarize({ claimed: true, chapters: s.research?.chapters ?? [], titles: s.research?.titles ?? [] }),
  }))

  // tugas review: judul dan bab yang menunggu guru
  const todo = rows.flatMap((s) => [
    ...(s.research?.titles.some((t) => t.status === "PENDING")
      ? [{ key: `t-${s.id}`, href: `/guru/siswa/${s.id}`, text: `${s.user.name}: pengajuan judul` }]
      : []),
    ...(s.research?.chapters ?? [])
      .filter((c) => c.status === "SUBMITTED")
      .map((c) => ({ key: `c-${c.id}`, href: `/guru/siswa/${s.id}/bab/${c.number}`, text: `${s.user.name}: Bab ${c.number}` })),
  ])

  const classes = [...new Set(rows.map((r) => r.kelas))].sort(compareKelas).map((kelas) => {
    const list = rows.filter((r) => r.kelas === kelas)
    return {
      kelas,
      total: list.length,
      avg: Math.round(list.reduce((n, r) => n + r.sum.percent, 0) / list.length),
      waiting: list.filter((r) => r.sum.needsReview).length,
      noTitle: list.filter((r) => r.sum.state === "NO_TITLE" || r.sum.state === "TITLE_REVISION").length,
      done: list.filter((r) => r.sum.state === "DONE").length,
    }
  })

  const stats = [
    { label: "Siswa dibimbing", value: rows.length, icon: Users },
    { label: "Menunggu review", value: rows.filter((r) => r.sum.needsReview).length, icon: Clock },
    {
      label: "Belum ada judul",
      value: rows.filter((r) => r.sum.state === "NO_TITLE" || r.sum.state === "TITLE_REVISION").length,
      icon: FileQuestion,
    },
    { label: "Riset selesai", value: rows.filter((r) => r.sum.state === "DONE").length, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {user.teacher ? FIELD_LABEL[user.teacher.field] : "Guru Riset"} · {rows.length} siswa dibimbing
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada siswa</CardTitle>
            <CardDescription>
              Klaim siswa dari{" "}
              <Link href="/guru/pool" className="text-primary underline">
                Pool Siswa
              </Link>{" "}
              untuk mulai membimbing.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
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

          {todo.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">{todo.length} item menunggu review kamu:</p>
              <ul className="mt-1 list-disc pl-5">
                {todo.map((t) => (
                  <li key={t.key}>
                    <Link href={t.href} className="underline">
                      {t.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-semibold">Per Kelas</h2>
              <Link href="/guru/siswa" className="text-sm text-primary hover:underline">
                Lihat semua siswa
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <Link key={c.kelas ?? "_"} href={kelasHref(c.kelas)} className="group">
                  <Card className="h-full border-t-4 border-t-emerald-500 transition-shadow group-hover:shadow-md">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{c.kelas ?? "Tanpa kelas"}</CardTitle>
                          <CardDescription>{c.total} siswa</CardDescription>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Rata-rata progres</span>
                          <span className="font-medium text-foreground">{c.avg}%</span>
                        </div>
                        <ProgressBar value={c.avg} />
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-amber-50 p-2">
                          <dd className="text-base font-semibold text-amber-700">{c.waiting}</dd>
                          <dt className="text-muted-foreground">Perlu review</dt>
                        </div>
                        <div className="rounded-lg bg-muted p-2">
                          <dd className="text-base font-semibold">{c.noTitle}</dd>
                          <dt className="text-muted-foreground">Belum judul</dt>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2">
                          <dd className="text-base font-semibold text-emerald-700">{c.done}</dd>
                          <dt className="text-muted-foreground">Selesai</dt>
                        </div>
                      </dl>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
