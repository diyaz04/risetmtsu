import { ChapterList, Stepper, TitleHistory } from "@/components/research-progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { FIELD_LABEL } from "@/lib/labels"
import { TitleForm } from "./title-form"

export default async function SiswaHome() {
  const user = await requireRole("STUDENT")
  const profile = user.student

  if (!profile?.field) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Menunggu guru riset</CardTitle>
          <CardDescription>
            Kamu belum diklaim oleh guru riset. Setelah diklaim, halaman riset kamu akan terbuka di sini.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const [teacher, research] = await Promise.all([
    db.teacherProfile.findUnique({ where: { id: profile.teacherId! }, include: { user: true }, relationLoadStrategy: "join", }),
    db.research.findUnique({
      where: { studentId: profile.id },
      include: { chapters: { orderBy: { number: "asc" } }, titles: { orderBy: { createdAt: "desc" } } },
      relationLoadStrategy: "join",
    }),
  ])
  const titles = research?.titles ?? []
  const chapters = research?.chapters ?? []
  const latest = titles[0]
  const approved = titles.find((t) => t.status === "APPROVED")
  const canSubmit = !approved && latest?.status !== "PENDING"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{FIELD_LABEL[profile.field]}</h1>
        <p className="text-sm text-muted-foreground">Pembimbing: {teacher?.user.name}</p>
      </div>

      <Stepper titleApproved={!!approved} chapters={chapters} />

      {chapters.length === 5 && chapters.every((c) => c.status === "APPROVED") && (
        <p className="rounded-xl bg-gradient-brand p-4 text-sm font-medium text-white">
          Selamat! Seluruh bab risetmu sudah disetujui guru.
        </p>
      )}

      {approved ? (
        <section className="space-y-4">
          <div className="rounded-xl border bg-emerald-50/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Judul riset</p>
            <p className="mt-1 text-lg font-semibold">{approved.title}</p>
          </div>
          <h2 className="text-lg font-semibold">Bab Riset</h2>
          <ChapterList chapters={chapters} hrefFor={(n) => `/siswa/bab/${n}`} />
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Pengajuan Judul</h2>
          {latest?.status === "PENDING" && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Judul kamu sedang direview guru. Kamu akan bisa mengerjakan Bab 1 setelah judul disetujui.
            </p>
          )}
          {canSubmit && (
            <Card>
              <CardContent className="pt-4">
                <TitleForm isResubmit={titles.length > 0} />
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {titles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Riwayat Pengajuan</h2>
          <TitleHistory submissions={titles} />
        </section>
      )}
    </div>
  )
}
