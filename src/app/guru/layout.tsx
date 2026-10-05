import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"

const FIELD_LABEL = { AGAMA: "Riset Agama", HUMANIORA: "Riset Humaniora", SAINS: "Riset Sains" } as const

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("TEACHER")
  const label = user.teacher ? `Guru ${FIELD_LABEL[user.teacher.field]}` : "Guru Riset"
  return (
    <AppShell
      roleLabel={label}
      userName={user.name}
      nav={[
        { href: "/guru", label: "Siswa Saya" },
        { href: "/guru/pool", label: "Pool Siswa" },
      ]}
    >
      {children}
    </AppShell>
  )
}
