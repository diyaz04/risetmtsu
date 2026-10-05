"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { addComment, reviewChapter } from "@/app/actions/review"
import type { FormState } from "@/app/actions/title"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ReviewPanel({ chapterId }: { chapterId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewChapter, {})
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) toast.success("Review tersimpan")
  }, [state])

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="chapterId" value={chapterId} />
      <div className="space-y-2">
        <Label htmlFor="note">Catatan untuk siswa (wajib jika minta revisi)</Label>
        <Textarea id="note" name="note" rows={4} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="APPROVED" disabled={pending}>
          ACC Bab
        </Button>
        <Button type="submit" name="decision" value="REVISION" variant="outline" disabled={pending}>
          Minta Revisi
        </Button>
      </div>
    </form>
  )
}

export function CommentForm({ chapterId }: { chapterId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addComment, {})
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) {
      toast.success("Catatan ditambahkan")
      ref.current?.reset()
    }
  }, [state])

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="chapterId" value={chapterId} />
      <Textarea name="body" rows={2} placeholder="Tambah catatan..." />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Kirim Catatan
      </Button>
    </form>
  )
}
