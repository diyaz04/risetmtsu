import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

export default async function AdminDashboard() {
  const [siswa, belumDiklaim, guru] = await Promise.all([
    db.studentProfile.count(),
    db.studentProfile.count({ where: { teacherId: null } }),
    db.teacherProfile.count(),
  ])
  const stats = [
    { label: "Total siswa", value: siswa },
    { label: "Belum diklaim guru", value: belumDiklaim },
    { label: "Guru riset", value: guru },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
