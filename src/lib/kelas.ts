const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }

/** Nilai parameter URL untuk siswa tanpa kelas. */
export const NO_KELAS = "_"

export const kelasLabel = (k: string | null) => (k ? `Kelas ${k}` : "Tanpa kelas")

function rank(kelas: string) {
  const m = kelas.trim().toUpperCase().match(/^([IVX]+|\d+)/)
  if (!m) return 99
  return ROMAN[m[0]] ?? (Number(m[0]) || 99)
}

/** Urutkan kelas secara wajar: VII-01, VII-02, VIII-01, IX-01 (bukan urutan abjad). Tanpa kelas di akhir. */
export function compareKelas(a: string | null, b: string | null) {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return rank(a) - rank(b) || a.localeCompare(b, "id", { numeric: true })
}

export const kelasHref = (kelas: string | null) =>
  `/guru/siswa?kelas=${encodeURIComponent(kelas ?? NO_KELAS)}`
