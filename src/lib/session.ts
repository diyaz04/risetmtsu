import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { Role } from "@prisma/client"

export const SESSION_COOKIE = "riset_session"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 hari

export type SessionPayload = { uid: string; role: Role; name: string }

function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diset (minimal 32 karakter)")
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key())

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key())
    return { uid: payload.uid as string, role: payload.role as Role, name: payload.name as string }
  } catch {
    return null
  }
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}
