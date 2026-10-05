import Link from "next/link"
import { KeyRound, LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Logo } from "@/components/logo"
import { NavLinks, type NavItem } from "@/components/nav-links"
import { Button } from "@/components/ui/button"

export type { NavItem }

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
      {/* di HP header ikut tergulung; toolbar editor yang menempel di atas */}
      <header className="z-10 border-b bg-white/90 backdrop-blur sm:sticky sm:top-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6">
          <Link href={nav[0]?.href ?? "/"} className="flex items-center gap-2 font-semibold" aria-label="Dashboard">
            <Logo size={36} priority />
            <span className="hidden sm:inline">Riset MTs</span>
          </Link>
          <NavLinks items={nav} className="hidden flex-1 sm:flex" />
          <div className="min-w-0 flex-1 text-right text-xs leading-tight sm:flex-none">
            <p className="truncate font-medium">{userName}</p>
            <p className="truncate text-muted-foreground">{roleLabel}</p>
          </div>
          <Link href="/ganti-password" className="shrink-0">
            <Button variant="outline" size="icon" type="button" aria-label="Ganti password" title="Ganti password">
              <KeyRound />
            </Button>
          </Link>
          <form action={logout} className="shrink-0">
            <Button variant="outline" size="icon" type="submit" aria-label="Keluar" title="Keluar">
              <LogOut />
            </Button>
          </form>
        </div>
        {nav.length > 1 && (
          <NavLinks items={nav} className="overflow-x-auto border-t px-3 py-1.5 sm:hidden" />
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-8">{children}</main>
    </div>
  )
}
