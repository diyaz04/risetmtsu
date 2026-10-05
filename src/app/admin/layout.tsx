import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN")
  return (
    <AppShell
      roleLabel="Admin Utama"
      userName={user.name}
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/riset", label: "Riset" },
        { href: "/admin/siswa", label: "Siswa" },
        { href: "/admin/guru", label: "Guru" },
      ]}
    >
      {children}
    </AppShell>
  )
}
