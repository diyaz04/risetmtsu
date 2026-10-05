import type { ChapterStatus, TitleStatus } from "@prisma/client"
import { CHAPTER_TITLES } from "@/lib/labels"

export type ProgressState = "UNCLAIMED" | "NO_TITLE" | "TITLE_PENDING" | "TITLE_REVISION" | "WRITING" | "REVIEW" | "DONE"

type Input = {
  claimed: boolean
  chapters: { number: number; status: ChapterStatus }[]
  /** urut dari terbaru */
  titles: { status: TitleStatus }[]
}

export type ResearchSummary = {
  state: ProgressState
  label: string
  /** kunci ke STATUS_TONE untuk warna badge */
  tone: string
  approvedChapters: number
  /** 0-100: judul disetujui + bab disetujui dari total langkah (judul + semua bab) */
  percent: number
  needsReview: boolean
}

const TOTAL_CHAPTERS = CHAPTER_TITLES.length

export function summarize({ claimed, chapters, titles }: Input): ResearchSummary {
  const approvedChapters = chapters.filter((c) => c.status === "APPROVED").length
  const titleApproved = titles.some((t) => t.status === "APPROVED")
  const percent = Math.round(((titleApproved ? 1 : 0) + approvedChapters) / (TOTAL_CHAPTERS + 1) * 100)
  const base = { approvedChapters, percent }

  if (!claimed) return { ...base, state: "UNCLAIMED", label: "Belum diklaim", tone: "LOCKED", needsReview: false }

  if (!titleApproved) {
    const latest = titles[0]
    if (!latest) return { ...base, state: "NO_TITLE", label: "Belum mengajukan judul", tone: "LOCKED", needsReview: false }
    if (latest.status === "PENDING") {
      return { ...base, state: "TITLE_PENDING", label: "Judul menunggu review", tone: "PENDING", needsReview: true }
    }
    return { ...base, state: "TITLE_REVISION", label: "Judul perlu revisi", tone: "REVISION", needsReview: false }
  }

  if (approvedChapters === TOTAL_CHAPTERS) {
    return { ...base, state: "DONE", label: "Selesai", tone: "APPROVED", needsReview: false }
  }

  const submitted = chapters.filter((c) => c.status === "SUBMITTED").sort((a, b) => a.number - b.number)[0]
  if (submitted) {
    return { ...base, state: "REVIEW", label: `Bab ${submitted.number} menunggu review`, tone: "PENDING", needsReview: true }
  }

  const active = chapters.filter((c) => c.status === "DRAFT" || c.status === "REVISION").sort((a, b) => a.number - b.number)[0]
  if (active) {
    const revising = active.status === "REVISION"
    return {
      ...base,
      state: "WRITING",
      label: `${revising ? "Revisi" : "Mengerjakan"} Bab ${active.number}`,
      tone: revising ? "REVISION" : "DRAFT",
      needsReview: false,
    }
  }
  return { ...base, state: "WRITING", label: "Sedang berjalan", tone: "DRAFT", needsReview: false }
}
