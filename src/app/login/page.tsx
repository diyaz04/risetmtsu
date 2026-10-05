import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/80 via-white to-white px-4">
      <Card className="w-full max-w-sm shadow-xl shadow-emerald-600/5">
        <CardHeader className="items-center text-center">
          <Logo size={84} priority className="mx-auto mb-2" />
          <CardTitle className="text-xl">Sistem Manajemen Riset</CardTitle>
          <CardDescription>MTs KH A Wahab Muhsin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <Link href="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Kembali ke beranda
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
