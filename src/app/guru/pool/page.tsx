import { ClaimButton } from "./claim-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { FIELD_LABEL } from "@/lib/labels"

export default async function PoolPage() {
  const user = await requireRole("TEACHER")
  const students = await db.studentProfile.findMany({
    where: { teacherId: null },
    include: { user: true },
    relationLoadStrategy: "join",
    orderBy: { user: { name: "asc" } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pool Siswa</h1>
        <p className="text-sm text-muted-foreground">
          {students.length} siswa belum diklaim.
          {user.teacher && <> Siswa yang kamu klaim otomatis masuk {FIELD_LABEL[user.teacher.field]}.</>}
        </p>
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Tidak ada siswa di pool.
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.user.name}</TableCell>
                <TableCell>{s.nis ?? "-"}</TableCell>
                <TableCell>{s.kelas ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <ClaimButton studentId={s.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
