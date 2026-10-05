"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { claimStudent } from "@/app/actions/guru"
import { Button } from "@/components/ui/button"

export function ClaimButton({ studentId }: { studentId: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await claimStudent(studentId)
          if ("error" in res) toast.error(res.error)
          else toast.success("Siswa berhasil diklaim")
        })
      }
    >
      {pending ? "Mengklaim..." : "Klaim"}
    </Button>
  )
}
