import type { ChapterStatus, ResearchField, TitleStatus } from "@prisma/client"

export const FIELD_LABEL: Record<ResearchField, string> = {
  AGAMA: "Riset Agama",
  HUMANIORA: "Riset Humaniora",
  SAINS: "Riset Sains",
}

export const FIELDS = Object.keys(FIELD_LABEL) as ResearchField[]

/** Warna pembeda tiap bidang (badge/aksen kartu). */
export const FIELD_TONE: Record<ResearchField, { badge: string; accent: string }> = {
  AGAMA: { badge: "bg-emerald-100 text-emerald-700", accent: "border-t-emerald-500" },
  HUMANIORA: { badge: "bg-sky-100 text-sky-700", accent: "border-t-sky-500" },
  SAINS: { badge: "bg-violet-100 text-violet-700", accent: "border-t-violet-500" },
}

export const CHAPTER_TITLES = [
  "Pendahuluan",
  "Kajian Pustaka",
  "Metode Penelitian",
  "Hasil dan Pembahasan",
  "Penutup",
] as const

export const TITLE_STATUS_LABEL: Record<TitleStatus, string> = {
  PENDING: "Menunggu review",
  APPROVED: "Disetujui",
  REVISION: "Perlu revisi",
  REJECTED: "Ditolak",
}

export const CHAPTER_STATUS_LABEL: Record<ChapterStatus, string> = {
  LOCKED: "Terkunci",
  DRAFT: "Draft",
  SUBMITTED: "Menunggu review",
  REVISION: "Perlu revisi",
  APPROVED: "Disetujui",
}

/** Kelas warna badge per status (hijau = baik, kuning = menunggu, merah = perlu tindakan). */
export const STATUS_TONE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  REVISION: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT: "bg-sky-100 text-sky-700",
  LOCKED: "bg-muted text-muted-foreground",
}
