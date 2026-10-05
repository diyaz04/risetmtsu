import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"

export default async function GuruHome() {
  const user = await requireRole("TEACHER")
  const students = user.teacher
    ? await db.studentProfile.findMany({
        where: { teacherId: user.teacher.id },
        include: { user: true, research: { include: { chapters: true, titles: true } } },
        relationLoadStrategy: "join",
        orderBy: { user: { name: "asc" } },
      })
    : []

  // daftar tugas review: judul dan bab yang menunggu guru
  const todo = students.flatMap((s) => [
    ...(s.research?.titles.some((t) => t.status === "PENDING")
      ? [{ key: `t-${s.id}`, href: `/guru/siswa/${s.id}`, text: `${s.user.name}: pengajuan judul` }]
      : []),
    ...(s.research?.chapters ?? [])
      .filter((c) => c.status === "SUBMITTED")
      .map((c) => ({
        key: `c-${c.id}`,
        href: `/guru/siswa/${s.id}/bab/${c.number}`,
        text: `${s.user.name}: Bab ${c.number}`,
      })),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Siswa Saya</h1>
        <p className="text-sm text-muted-foreground">{students.length} siswa dibimbing</p>
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
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="hidden sm:table-cell">Kelas</TableHead>
              <TableHead className="hidden md:table-cell">Judul</TableHead>
              <TableHead className="hidden sm:table-cell">Bab di-ACC</TableHead>
              <TableHead>Perlu tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Belum ada siswa. Klaim siswa dari{" "}
                  <Link href="/guru/pool" className="text-primary underline">
                    Pool Siswa
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => {
              const chapters = s.research?.chapters ?? []
              const approved = chapters.filter((c) => c.status === "APPROVED").length
              const pendingSubmission = s.research?.titles.find((t) => t.status === "PENDING")
              const pendingTitle = !!pendingSubmission
              const pendingChapters = chapters.filter((c) => c.status === "SUBMITTED").length
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link href={`/guru/siswa/${s.id}`} className="hover:text-primary hover:underline">
                      {s.user.name}
                    </Link>
                    <p className="text-xs font-normal text-muted-foreground sm:hidden">
                      {s.kelas ? `Kelas ${s.kelas} · ` : ""}
                      {approved}/5 bab
                    </p>
                    <p className="line-clamp-2 text-xs font-normal text-muted-foreground md:hidden">
                      {s.research?.title ?? pendingSubmission?.title ?? "Belum ada judul"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{s.kelas ?? "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {s.research?.title ??
                      (pendingSubmission ? (
                        <span className="italic text-muted-foreground">{pendingSubmission.title}</span>
                      ) : (
                        <Badge variant="outline">Belum ada judul</Badge>
                      ))}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{approved} / 5</TableCell>
                  <TableCell>
                    {pendingTitle && <Badge className="bg-amber-100 text-amber-700">Judul menunggu</Badge>}
                    {pendingChapters > 0 && <Badge className="bg-amber-100 text-amber-700">{pendingChapters} bab menunggu</Badge>}
                    {!pendingTitle && pendingChapters === 0 && <span className="text-muted-foreground">-</span>}
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
