"use client"

import { useActionState } from "react"
import { changePassword, type LoginState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(changePassword, {})

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Password saat ini</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">Password baru</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Ulangi password baru</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan Password"}
      </Button>
    </form>
  )
}
