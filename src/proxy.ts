import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PREFIX_ROLE: Record<string, string> = {
  "/admin": "ADMIN",
  "/guru": "TEACHER",
  "/siswa": "STUDENT",
}
const ROLE_HOME: Record<string, string> = { ADMIN: "/admin", TEACHER: "/guru", STUDENT: "/siswa" }

// Cek optimistik saja; otorisasi sebenarnya tetap dilakukan di server (requireRole).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("riset_session")?.value

  let role: string | null = null
  if (token && process.env.SESSION_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET))
      role = payload.role as string
    } catch {
      role = null
    }
  }

  if (pathname === "/login") {
    return role ? NextResponse.redirect(new URL(ROLE_HOME[role], request.url)) : NextResponse.next()
  }

  if (pathname === "/ganti-password") {
    return role ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url))
  }

  const prefix = Object.keys(PREFIX_ROLE).find((p) => pathname === p || pathname.startsWith(p + "/"))
  if (prefix) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url))
    if (PREFIX_ROLE[prefix] !== role) return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/ganti-password","/admin/:path*", "/guru/:path*", "/siswa/:path*"],
}
