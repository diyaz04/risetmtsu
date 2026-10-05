import Link from "next/link"
import type { Chapter, TitleSubmission } from "@prisma/client"
import { Check } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { CHAPTER_STATUS_LABEL, CHAPTER_TITLES, TITLE_STATUS_LABEL } from "@/lib/labels"
import { cn } from "@/lib/utils"

/** Stepper: Judul → Bab 1..5. Dipakai di halaman siswa dan guru. */
export function Stepper({ titleApproved, chapters }: { titleApproved: boolean; chapters: Pick<Chapter, "number" | "status">[] }) {
  const steps = [
    { label: "Judul", done: titleApproved },
    ...CHAPTER_TITLES.map((t, i) => ({
      label: `Bab ${i + 1}`,
      done: chapters.find((c) => c.number === i + 1)?.status === "APPROVED",
      title: t,
    })),
  ]
  const current = steps.findIndex((s) => !s.done)

  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:flex-wrap sm:overflow-visible sm:pb-0">
      {steps.map((s, i) => (
        <li key={s.label} className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1",
              s.done && "border-transparent bg-gradient-brand text-white",
              !s.done && i === current && "border-emerald-500 text-emerald-700",
              !s.done && i !== current && "text-muted-foreground",
            )}
          >
            {s.done && <Check className="size-3.5" />}
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-4 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

export function TitleHistory({ submissions }: { submissions: TitleSubmission[] }) {
  if (submissions.length === 0) return <p className="text-sm text-muted-foreground">Belum ada pengajuan judul.</p>
  return (
    <ul className="space-y-3">
      {submissions.map((s) => (
        <li key={s.id} className="rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium">{s.title}</p>
            <StatusBadge status={s.status} label={TITLE_STATUS_LABEL[s.status]} />
          </div>
          {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
          {s.teacherNote && (
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">Catatan guru: </span>
              {s.teacherNote}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Diajukan {s.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function ChapterList({
  chapters,
  hrefFor,
}: {
  chapters: Pick<Chapter, "id" | "number" | "status">[]
  /** Jika diisi, bab yang tidak terkunci menjadi tautan. */
  hrefFor?: (number: number) => string
}) {
  return (
    <ul className="divide-y rounded-xl border">
      {CHAPTER_TITLES.map((title, i) => {
        const ch = chapters.find((c) => c.number === i + 1)
        const status = ch?.status ?? "LOCKED"
        const row = (
          <>
            <p className="font-medium">
              Bab {i + 1} · {title}
            </p>
            <StatusBadge status={status} label={CHAPTER_STATUS_LABEL[status]} />
          </>
        )
        return (
          <li key={title}>
            {hrefFor && status !== "LOCKED" ? (
              <Link href={hrefFor(i + 1)} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/50">
                {row}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 p-4">{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
