import { Download, FileSpreadsheet, UserPlus } from "lucide-react"
import { addStudent, importStudents } from "@/app/actions/admin"
import { CreateDialog } from "@/components/create-dialog"
import { UserRowActions } from "@/components/user-row-actions"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { FIELD_LABEL } from "@/lib/labels"

// impor banyak siswa menghitung hash password satu per satu; beri waktu lebih di hosting serverless
export const maxDuration = 60

export default async function AdminSiswaPage() {
  const students = await db.studentProfile.findMany({
    include: { user: true, teacher: { include: { user: true } } },
    relationLoadStrategy: "join",
    orderBy: { user: { name: "asc" } },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Siswa</h1>
          <p className="text-sm text-muted-foreground">{students.length} siswa terdaftar</p>
        </div>
        <div className="flex gap-2">
          <CreateDialog
            variant="outline"
            triggerLabel="Impor Banyak"
            triggerIcon={<FileSpreadsheet />}
            title="Impor siswa"
            description="Unggah file Excel sesuai template. Kolom: Nama Lengkap, NIS, Kelas, Password Awal."
            action={importStudents}
            submitLabel="Impor"
          >
            <a
              href="/admin/siswa/template"
              download
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Download className="size-4" /> Unduh template Excel
            </a>
            <div className="space-y-2">
              <Label htmlFor="file">File Excel (.xlsx) atau CSV</Label>
              <Input id="file" name="file" type="file" accept=".xlsx,.csv" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rows">Atau tempel data (nama, NIS, kelas, password)</Label>
              <Textarea
                id="rows"
                name="rows"
                rows={5}
                placeholder={"Ahmad Fauzi, 12345, 7A, siswa123\nSiti Aisyah, 12346, 7A"}
                className="font-mono text-xs"
              />
            </div>
          </CreateDialog>
          <CreateDialog
            triggerLabel="Tambah Siswa"
            triggerIcon={<UserPlus />}
            title="Tambah siswa"
            description="Username dibuat otomatis dari nama lengkap + @riset.com."
            action={addStudent}
            submitLabel="Simpan"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nama lengkap</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS (opsional)</Label>
                <Input id="nis" name="nis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas (opsional)</Label>
                <Input id="kelas" name="kelas" placeholder="7A" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password awal (opsional)</Label>
              <Input id="password" name="password" placeholder="Kosongkan untuk password acak" />
              <p className="text-xs text-muted-foreground">Minimal 6 karakter. Siswa wajib menggantinya saat login pertama.</p>
            </div>
          </CreateDialog>
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Bidang</TableHead>
              <TableHead>Pembimbing</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Belum ada siswa. Klik &quot;Tambah Siswa&quot; atau &quot;Impor Banyak&quot;.
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.user.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.user.username}</TableCell>
                <TableCell>{s.kelas ?? "-"}</TableCell>
                <TableCell>
                  {s.field ? <Badge>{FIELD_LABEL[s.field]}</Badge> : <Badge variant="outline">Belum diklaim</Badge>}
                </TableCell>
                <TableCell>{s.teacher?.user.name ?? "-"}</TableCell>
                <TableCell>
                  <UserRowActions userId={s.userId} name={s.user.name} studentId={s.id} claimed={!!s.teacherId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
