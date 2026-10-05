import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { db } from "@/lib/db"
import { readSession } from "@/lib/session"

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/guru",
  STUDENT: "/siswa",
}

/** User terkini dari DB (bukan hanya isi cookie), di-cache per request. */
export const getCurrentUser = cache(async () => {
  const session = await readSession()
  if (!session) return null
  return db.user.findUnique({
    where: { id: session.uid },
    include: { teacher: true, student: true },
    relationLoadStrategy: "join",
  })
})

export async function requireRole(role: Role) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== role) redirect(ROLE_HOME[user.role])
  // akun baru / hasil reset wajib mengganti password dulu
  if (user.mustChangePassword) redirect("/ganti-password")
  return user
}
