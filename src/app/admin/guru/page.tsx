import { UserPlus } from "lucide-react"
import { addTeacher } from "@/app/actions/admin"
import { CreateDialog } from "@/components/create-dialog"
import { UserRowActions } from "@/components/user-row-actions"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { FIELDS, FIELD_LABEL } from "@/lib/labels"

export default async function AdminGuruPage() {
  const teachers = await db.teacherProfile.findMany({
    include: { user: true, _count: { select: { students: true } } },
    relationLoadStrategy: "join",
    orderBy: { user: { name: "asc" } },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Guru Riset</h1>
          <p className="text-sm text-muted-foreground">{teachers.length} guru terdaftar</p>
        </div>
        <CreateDialog
          triggerLabel="Tambah Guru"
          triggerIcon={<UserPlus />}
          title="Tambah guru riset"
          action={addTeacher}
          submitLabel="Simpan"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username (email)</Label>
            <Input id="username" name="username" type="email" placeholder="budi@riset.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field">Bidang riset</Label>
            <select
              id="field"
              name="field"
              required
              defaultValue=""
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-base outline-none sm:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Pilih bidang...
              </option>
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABEL[f]}
                </option>
              ))}
            </select>
          </div>
        </CreateDialog>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="hidden md:table-cell">Username</TableHead>
              <TableHead>Bidang</TableHead>
              <TableHead className="hidden sm:table-cell">Siswa dibimbing</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Belum ada guru. Klik &quot;Tambah Guru&quot;.
                </TableCell>
              </TableRow>
            )}
            {teachers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  {t.user.name}
                  <p className="break-all text-xs font-normal text-muted-foreground md:hidden">
                    {t.user.username} · {t._count.students} siswa
                  </p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{t.user.username}</TableCell>
                <TableCell>
                  <Badge>{FIELD_LABEL[t.field]}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{t._count.students}</TableCell>
                <TableCell>
                  <UserRowActions userId={t.userId} name={t.user.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
