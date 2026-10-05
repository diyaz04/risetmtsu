import Link from "next/link"
import { FileDown, Printer } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = { chapterId: string; studentId?: never } | { studentId: string; chapterId?: never }

/** Unduh Word dan cetak/PDF untuk satu bab (chapterId) atau seluruh riset (studentId). */
export function ExportButtons({ chapterId, studentId, className }: Props & { className?: string }) {
  const docx = chapterId ? `/api/export/bab/${chapterId}` : `/api/export/riset/${studentId}`
  const print = chapterId ? `/cetak/bab/${chapterId}` : `/cetak/riset/${studentId}`
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* <a> biasa: respons berupa file, bukan halaman Next.js */}
      <a href={docx} download className={buttonVariants({ variant: "outline" })}>
        <FileDown /> Unduh Word
      </a>
      <Link href={print} className={buttonVariants({ variant: "outline" })}>
        <Printer /> Cetak / PDF
      </Link>
    </div>
  )
}
