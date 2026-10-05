"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { reviewTitle, type FormState } from "@/app/actions/title"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewTitle, {})

  useEffect(() => {
    if (state.ok) toast.success("Review tersimpan")
  }, [state])

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <div className="space-y-2">
        <Label htmlFor="note">Catatan (wajib jika revisi atau tolak)</Label>
        <Textarea id="note" name="note" rows={3} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="APPROVED" disabled={pending}>
          Setujui Judul
        </Button>
        <Button type="submit" name="decision" value="REVISION" variant="outline" disabled={pending}>
          Minta Revisi
        </Button>
        <Button type="submit" name="decision" value="REJECTED" variant="destructive" disabled={pending}>
          Tolak
        </Button>
      </div>
    </form>
  )
}
