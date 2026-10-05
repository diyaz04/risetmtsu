import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"

export default async function SiswaLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("STUDENT")
  return (
    <AppShell roleLabel="Siswa" userName={user.name} nav={[{ href: "/siswa", label: "Riset Saya" }]}>
      {children}
    </AppShell>
  )
}
