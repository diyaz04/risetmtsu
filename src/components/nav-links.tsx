"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export type NavItem = { href: string; label: string }

export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname()
  // item pertama adalah beranda role (mis. /guru): aktif hanya jika persis sama, agar tidak ikut menyala di sub-halaman lain
  const isActive = (href: string, i: number) =>
    i === 0 ? pathname === href || (items.length === 1 && pathname.startsWith(href)) : pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((n, i) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={isActive(n.href, i) ? "page" : undefined}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground",
            isActive(n.href, i) ? "bg-accent font-medium text-emerald-700" : "text-muted-foreground",
          )}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  )
}
