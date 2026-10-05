"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { Check, Loader2, Save, Send, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { saveChapter, submitChapter } from "@/app/actions/chapter"
import { DocEditor, wordCountOf } from "@/components/doc-editor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type SaveState = "saved" | "dirty" | "saving" | "error"
const AUTOSAVE_MS = 2000

export function ChapterEditor({
  chapterId,
  initialContent,
  editable,
}: {
  chapterId: string
  initialContent: JSONContent | null
  editable: boolean
}) {
  const router = useRouter()
  const latest = useRef<JSONContent | null>(initialContent)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)
  const [state, setState] = useState<SaveState>("saved")
  const [words, setWords] = useState(() => wordCountOf(initialContent))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const persist = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    if (!dirty.current || !latest.current) return true
    dirty.current = false
    setState("saving")
    const res = await saveChapter(chapterId, JSON.stringify(latest.current))
    if ("error" in res) {
      dirty.current = true
      setState("error")
      toast.error(res.error)
      return false
    }
    // ada ketikan baru saat menyimpan -> tetap dianggap belum tersimpan
    setState(dirty.current ? "dirty" : "saved")
    return true
  }, [chapterId])

  function handleChange(json: JSONContent, wordCount: number) {
    latest.current = json
    dirty.current = true
    setWords(wordCount)
    setState("dirty")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(persist, AUTOSAVE_MS)
  }

  // Ctrl/Cmd+S dan peringatan sebelum menutup tab dengan perubahan belum tersimpan
  useEffect(() => {
    if (!editable) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        persist().then((ok) => ok && toast.success("Tersimpan"))
      }
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("beforeunload", onBeforeUnload)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [editable, persist])

  async function submit() {
    if (!latest.current) return
    setSubmitting(true)
    const res = await submitChapter(chapterId, JSON.stringify(latest.current))
    setSubmitting(false)
    if ("error" in res) {
      toast.error(res.error)
      return
    }
    dirty.current = false
    setConfirmOpen(false)
    toast.success("Bab berhasil dikirim ke guru")
    router.refresh()
  }

  const indicator = {
    saved: { icon: <Check className="size-3.5" />, text: "Tersimpan", cls: "text-emerald-700" },
    dirty: { icon: null, text: "Belum disimpan", cls: "text-muted-foreground" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Menyimpan...", cls: "text-muted-foreground" },
    error: { icon: <TriangleAlert className="size-3.5" />, text: "Gagal menyimpan", cls: "text-destructive" },
  }[state]

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`flex items-center gap-1.5 text-sm ${indicator.cls}`}>
            {indicator.icon}
            {indicator.text}
            <span className="text-muted-foreground">· {words} kata</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => persist().then((ok) => ok && toast.success("Tersimpan"))}
              disabled={state === "saving"}
            >
              <Save /> Simpan
            </Button>
            <Button onClick={() => persist().then((ok) => ok && setConfirmOpen(true))}>
              <Send /> Kirim ke Guru
            </Button>
          </div>
        </div>
      )}

      <DocEditor initialContent={initialContent} editable={editable} onChange={handleChange} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim bab ke guru?</DialogTitle>
            <DialogDescription>
              Setelah dikirim, bab tidak bisa diedit sampai guru memberi hasil review. Pastikan sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Mengirim..." : "Ya, Kirim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
