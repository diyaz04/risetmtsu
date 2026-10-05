"use client"

import { useState, useTransition } from "react"
import { KeyRound, Trash2, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { deleteUser, releaseStudent, resetPassword, type Credential } from "@/app/actions/admin"
import { CredentialsList } from "@/components/create-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function UserRowActions({
  userId,
  name,
  studentId,
  claimed,
}: {
  userId: string
  name: string
  studentId?: string
  claimed?: boolean
}) {
  const [pending, start] = useTransition()
  const [cred, setCred] = useState<Credential | null>(null)

  function reset() {
    if (!confirm(`Reset password ${name}?`)) return
    start(async () => {
      const res = await resetPassword(userId)
      if ("error" in res) toast.error(res.error)
      else setCred(res)
    })
  }

  function release() {
    if (!confirm(`Lepas klaim ${name}? Siswa kembali ke pool (progres riset tetap tersimpan).`)) return
    start(async () => {
      await releaseStudent(studentId!)
      toast.success("Klaim dilepas")
    })
  }

  function remove() {
    if (!confirm(`Hapus ${name} beserta seluruh data risetnya? Ini tidak bisa dibatalkan.`)) return
    start(async () => {
      const res = await deleteUser(userId)
      if ("error" in res) toast.error(res.error)
      else toast.success("Dihapus")
    })
  }

  return (
    <div className="flex justify-end gap-1">
      {claimed && (
        <Button variant="ghost" size="icon-sm" onClick={release} disabled={pending} title="Lepas klaim">
          <Undo2 />
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" onClick={reset} disabled={pending} title="Reset password">
        <KeyRound />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={remove} disabled={pending} title="Hapus">
        <Trash2 className="text-destructive" />
      </Button>

      <Dialog open={!!cred} onOpenChange={(o) => !o && setCred(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password baru</DialogTitle>
          </DialogHeader>
          {cred && <CredentialsList credentials={[cred]} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
