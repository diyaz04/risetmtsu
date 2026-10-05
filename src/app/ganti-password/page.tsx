import Link from "next/link"
import { redirect } from "next/navigation"
import { KeyRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROLE_HOME, getCurrentUser } from "@/lib/auth"
import { PasswordForm } from "./password-form"

export default async function GantiPasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-gradient-brand text-white">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="text-xl">Ganti Password</CardTitle>
          <CardDescription>
            {user.mustChangePassword
              ? "Demi keamanan, ganti password awalmu sebelum melanjutkan."
              : "Masukkan password saat ini lalu pilih password baru."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordForm />
          {!user.mustChangePassword && (
            <Link href={ROLE_HOME[user.role]} className="block text-center text-sm text-muted-foreground hover:text-foreground">
              Batal
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
