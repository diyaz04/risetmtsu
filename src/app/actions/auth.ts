"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db"
import { ROLE_HOME, getCurrentUser } from "@/lib/auth"
import { createSession, destroySession } from "@/lib/session"

const schema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await db.user.findUnique({ where: { username: parsed.data.username.toLowerCase() } })
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash))
  if (!user || !ok) return { error: "Username atau password salah" }

  await createSession({ uid: user.id, role: user.role, name: user.name })
  redirect(ROLE_HOME[user.role])
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Password saat ini wajib diisi"),
    next: z.string().min(8, "Password baru minimal 8 karakter").max(72, "Password baru maksimal 72 karakter"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Konfirmasi password tidak cocok", path: ["confirm"] })
  .refine((v) => v.next !== v.current, { message: "Password baru harus berbeda dari yang lama", path: ["next"] })

export async function changePassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { error: "Password saat ini salah" }
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.next, 10), mustChangePassword: false },
  })
  redirect(ROLE_HOME[user.role])
}

export async function logout() {
  await destroySession()
  redirect("/login")
}
