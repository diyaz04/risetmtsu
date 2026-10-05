import Link from "next/link"
import { GraduationCap, KeyRound, LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export type NavItem = { href: string; label: string }

export function AppShell({
  roleLabel,
  userName,
  nav,
  children,
}: {
  roleLabel: string
  userName: string
  nav: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-brand text-white">
              <GraduationCap className="size-4" />
            </span>
            <span className="hidden sm:inline">Riset MTs</span>
          </div>
          <nav className="flex flex-1 items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="text-right text-xs leading-tight">
            <p className="font-medium">{userName}</p>
            <p className="text-muted-foreground">{roleLabel}</p>
          </div>
          <Link href="/ganti-password">
            <Button variant="outline" size="icon" type="button" aria-label="Ganti password" title="Ganti password">
              <KeyRound />
            </Button>
          </Link>
          <form action={logout}>
            <Button variant="outline" size="icon" type="submit" aria-label="Keluar">
              <LogOut />
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
