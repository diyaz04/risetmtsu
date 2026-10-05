export const STUDENT_DOMAIN = "riset.com"

/** "Ahmad Fauzi" -> "ahmadfauzi@riset.com" (huruf kecil, tanpa spasi/simbol). */
export function baseStudentUsername(fullName: string) {
  const slug = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
  return `${slug}@${STUDENT_DOMAIN}`
}

/** Tambah angka di belakang nama jika username sudah dipakai: ahmadfauzi2@riset.com */
export function uniqueStudentUsername(fullName: string, taken: Set<string>) {
  const [slug] = baseStudentUsername(fullName).split("@")
  let candidate = `${slug}@${STUDENT_DOMAIN}`
  for (let n = 2; taken.has(candidate); n++) candidate = `${slug}${n}@${STUDENT_DOMAIN}`
  return candidate
}
