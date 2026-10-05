import Link from "next/link"
import { Search } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { ProgressBar } from "@/components/progress-bar"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { NO_KELAS, compareKelas, kelasLabel } from "@/lib/kelas"
import { summarize } from "@/lib/progress"
import { cn } from "@/lib/utils"

export default async function GuruSiswaList({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; q?: string }>
}) {
  const user = await requireRole("TEACHER")
  const sp = await searchParams
  const q = sp.q?.trim() ?? ""
  const teacherId = user.teacher?.id ?? "-"

  // "_" = tanpa kelas; kosong = semua kelas
  const kelasFilter = sp.kelas === undefined ? undefined : sp.kelas === NO_KELAS ? null : sp.kelas
  const where: Prisma.StudentProfileWhereInput = {
    teacherId,
    ...(kelasFilter !== undefined ? { kelas: kelasFilter } : {}),
    ...(q ? { user: { name: { contains: q, mode: "insensitive" } } } : {}),
  }

  const [students, perKelas] = await Promise.all([
    db.studentProfile.findMany({
      where,
      select: {
        id: true,
        kelas: true,
        user: { select: { name: true } },
        research: {
          select: {
            title: true,
            chapters: { select: { number: true, status: true } },
            titles: { select: { status: true, title: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
      relationLoadStrategy: "join",
    }),
    db.studentProfile.groupBy({ by: ["kelas"], where: { teacherId }, _count: { _all: true } }),
  ])

  const tabs = perKelas
    .map((p) => ({ kelas: p.kelas, count: p._count._all }))
    .sort((a, b) => compareKelas(a.kelas, b.kelas))
  const total = tabs.reduce((n, t) => n + t.count, 0)

  const href = (kelas: string | null | undefined) => {
    const p = new URLSearchParams()
    if (kelas !== undefined) p.set("kelas", kelas ?? NO_KELAS)
    if (q) p.set("q", q)
    const s = p.toString()
    return s ? `/guru/siswa?${s}` : "/guru/siswa"
  }
  const activeAll = kelasFilter === undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Siswa Saya</h1>
        <p className="text-sm text-muted-foreground">
          {kelasFilter === undefined ? `${total} siswa dibimbing` : `${kelasLabel(kelasFilter)} · ${students.length} siswa`}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
          {[{ kelas: undefined, count: total, label: "Semua" }, ...tabs.map((t) => ({ ...t, label: t.kelas ?? "Tanpa kelas" }))].map((t) => {
            const active = t.kelas === undefined ? activeAll : kelasFilter === t.kelas
            return (
              <Link
                key={t.label}
                href={href(t.kelas)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "border-transparent bg-gradient-brand font-medium text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {t.label}
                <span className={cn("text-xs", active ? "text-white/80" : "text-muted-foreground")}>{t.count}</span>
              </Link>
            )
          })}
        </div>
        <form className="flex gap-2" action="/guru/siswa">
          {kelasFilter !== undefined && <input type="hidden" name="kelas" value={kelasFilter ?? NO_KELAS} />}
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
              <TableHead>Nama</TableHead>
              <TableHead className="hidden sm:table-cell">Kelas</TableHead>
              <TableHead className="hidden md:table-cell">Judul</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden w-36 md:table-cell">Progres</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {total === 0 ? (
                    <>
                      Belum ada siswa. Klaim dari{" "}
                      <Link href="/guru/pool" className="text-primary underline">
                        Pool Siswa
                      </Link>
                      .
                    </>
                  ) : (
                    "Tidak ada siswa yang cocok."
                  )}
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => {
              const sum = summarize({ claimed: true, chapters: s.research?.chapters ?? [], titles: s.research?.titles ?? [] })
              const title = s.research?.title ?? s.research?.titles[0]?.title
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link href={`/guru/siswa/${s.id}`} className="hover:text-primary hover:underline">
                      {s.user.name}
                    </Link>
                    <p className="text-xs font-normal text-muted-foreground sm:hidden">{s.kelas ?? "Tanpa kelas"}</p>
                    <p className="line-clamp-2 text-xs font-normal text-muted-foreground md:hidden">
                      {title ?? "Belum ada judul"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{s.kelas ?? "-"}</TableCell>
                  <TableCell className="hidden max-w-xs md:table-cell">
                    {title ? (
                      <span className={cn("line-clamp-2", !s.research?.title && "italic text-muted-foreground")}>{title}</span>
                    ) : (
                      <span className="text-muted-foreground">Belum ada judul</span>
                    )}
                  </TableCell>
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
