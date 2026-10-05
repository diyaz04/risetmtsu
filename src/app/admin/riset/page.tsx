import Link from "next/link"
import { Search } from "lucide-react"
import type { Prisma, ResearchField } from "@prisma/client"
import { ProgressBar } from "@/components/progress-bar"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { FIELDS, FIELD_LABEL, FIELD_TONE } from "@/lib/labels"
import { summarize } from "@/lib/progress"
import { cn } from "@/lib/utils"

type Tab = "SEMUA" | ResearchField | "BELUM"

const TABS: { key: Tab; label: string }[] = [
  { key: "SEMUA", label: "Semua" },
  ...FIELDS.map((f) => ({ key: f as Tab, label: FIELD_LABEL[f].replace("Riset ", "") })),
  { key: "BELUM", label: "Belum diklaim" },
]

export default async function AdminRisetPage({
  searchParams,
}: {
  searchParams: Promise<{ bidang?: string; q?: string }>
}) {
  const sp = await searchParams
  const tab: Tab = TABS.some((t) => t.key === sp.bidang) ? (sp.bidang as Tab) : "SEMUA"
  const q = sp.q?.trim() ?? ""

  const where: Prisma.StudentProfileWhereInput = {
    ...(tab === "BELUM" ? { teacherId: null } : tab !== "SEMUA" ? { field: tab } : {}),
    ...(q ? { user: { name: { contains: q, mode: "insensitive" } } } : {}),
  }

  const [students, counts, unclaimed] = await Promise.all([
    db.studentProfile.findMany({
      where,
      select: {
        id: true,
        kelas: true,
        field: true,
        teacherId: true,
        user: { select: { name: true } },
        teacher: { select: { user: { select: { name: true } } } },
        research: {
          select: {
            title: true,
            chapters: { select: { number: true, status: true } },
            titles: { select: { status: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
      relationLoadStrategy: "join",
    }),
    db.studentProfile.groupBy({ by: ["field"], _count: { _all: true }, where: { field: { not: null } } }),
    db.studentProfile.count({ where: { teacherId: null } }),
  ])

  const countOf = (t: Tab) =>
    t === "SEMUA"
      ? counts.reduce((n, c) => n + c._count._all, 0) + unclaimed
      : t === "BELUM"
        ? unclaimed
        : (counts.find((c) => c.field === t)?._count._all ?? 0)

  const href = (t: Tab) => {
    const p = new URLSearchParams()
    if (t !== "SEMUA") p.set("bidang", t)
    if (q) p.set("q", q)
    const s = p.toString()
    return s ? `/admin/riset?${s}` : "/admin/riset"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Semua Riset</h1>
        <p className="text-sm text-muted-foreground">Pantau progres riset seluruh siswa, per kategori.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                tab === t.key
                  ? "border-transparent bg-gradient-brand font-medium text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {t.label}
              <span className={cn("text-xs", tab === t.key ? "text-white/80" : "text-muted-foreground")}>{countOf(t.key)}</span>
            </Link>
          ))}
        </div>
        <form className="flex gap-2" action="/admin/riset">
          {tab !== "SEMUA" && <input type="hidden" name="bidang" value={tab} />}
          <Input name="q" defaultValue={q} placeholder="Cari nama siswa..." className="md:w-64" />
          <Button type="submit" variant="outline" size="icon" aria-label="Cari">
            <Search />
          </Button>
        </form>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead className="hidden sm:table-cell">Bidang</TableHead>
              <TableHead className="hidden lg:table-cell">Pembimbing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden w-40 md:table-cell">Progres</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Tidak ada siswa{q ? ` dengan nama "${q}"` : " di kategori ini"}.
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => {
              const sum = summarize({
                claimed: !!s.teacherId,
                chapters: s.research?.chapters ?? [],
                titles: s.research?.titles ?? [],
              })
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/riset/${s.id}`} className="hover:text-primary hover:underline">
                      {s.user.name}
                    </Link>
                    <p className="text-xs font-normal text-muted-foreground">
                      {s.kelas ? `Kelas ${s.kelas}` : "Kelas -"}
                      <span className="sm:hidden">{s.field ? ` · ${FIELD_LABEL[s.field]}` : ""}</span>
                    </p>
                    {s.research?.title && (
                      <p className="line-clamp-1 text-xs font-normal text-muted-foreground">{s.research.title}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 md:hidden">
                      <ProgressBar value={sum.percent} className="max-w-28" />
                      <span className="text-xs text-muted-foreground">{sum.percent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {s.field ? (
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", FIELD_TONE[s.field].badge)}>
                        {FIELD_LABEL[s.field]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{s.teacher?.user.name ?? "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={sum.tone} label={sum.label} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <ProgressBar value={sum.percent} />
                      <p className="text-xs text-muted-foreground">
                        {sum.percent}% · {sum.approvedChapters}/5 bab
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
