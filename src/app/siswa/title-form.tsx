"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { submitTitle, type FormState } from "@/app/actions/title"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function TitleForm({ isResubmit }: { isResubmit: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitTitle, {})

  useEffect(() => {
    if (state.ok) toast.success("Judul berhasil diajukan")
  }, [state])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul riset</Label>
        <Input id="title" name="title" placeholder="Contoh: Pengaruh Kebiasaan Membaca terhadap Prestasi Belajar" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Latar singkat (opsional)</Label>
        <Textarea id="description" name="description" rows={4} placeholder="Kenapa kamu tertarik dengan topik ini?" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Mengirim..." : isResubmit ? "Ajukan Ulang" : "Ajukan Judul"}
      </Button>
    </form>
  )
}
