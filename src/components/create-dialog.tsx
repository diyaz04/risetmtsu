"use client"

import { useActionState, useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import type { CreateResult, Credential } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CredentialsList({ credentials }: { credentials: Credential[] }) {
  const [copied, setCopied] = useState(false)
  const text = credentials.map((c) => `${c.name}\t${c.username}\t${c.password}`).join("\n")

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    const csv = "Nama,Username,Password\n" + credentials.map((c) => `"${c.name}",${c.username},${c.password}`).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = Object.assign(document.createElement("a"), { href: url, download: "akun-riset.csv" })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        Catat atau unduh sekarang. Password hanya tampil sekali dan tidak bisa dilihat lagi (hanya bisa di-reset).
      </p>
      <div className="max-h-64 overflow-auto rounded-lg border text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="p-2">Nama</th>
              <th className="p-2">Username</th>
              <th className="p-2">Password</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((c) => (
              <tr key={c.username} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.username}</td>
                <td className="p-2 font-mono">{c.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Tersalin" : "Salin"}
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          <Download /> Unduh CSV
        </Button>
      </div>
    </div>
  )
}

function DialogBody({
  action,
  submitLabel,
  children,
  onDone,
}: {
  action: (prev: CreateResult | null, fd: FormData) => Promise<CreateResult>
  submitLabel: string
  children: React.ReactNode
  onDone: () => void
}) {
  const [state, formAction, pending] = useActionState(action, null)
  const hasCreds = !!state && state.credentials.length > 0

  if (hasCreds) {
    return (
      <div className="space-y-3">
        <CredentialsList credentials={state.credentials} />
        {state.skipped.length > 0 && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">{state.skipped.length} dilewati:</p>
            <ul className="list-disc pl-4">
              {state.skipped.map((s, i) => (
                <li key={i}>
                  {s.line}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button className="w-full" onClick={onDone}>
          Selesai
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  )
}

export function CreateDialog({
  triggerLabel,
  triggerIcon,
  variant = "default",
  title,
  description,
  action,
  submitLabel,
  children,
}: {
  triggerLabel: string
  triggerIcon?: React.ReactNode
  variant?: "default" | "outline"
  title: string
  description?: string
  action: (prev: CreateResult | null, fd: FormData) => Promise<CreateResult>
  submitLabel: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState(0)

  function close() {
    setOpen(false)
    setKey((k) => k + 1) // reset form & hasil
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {triggerIcon} {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogBody key={key} action={action} submitLabel={submitLabel} onDone={close}>
            {children}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
