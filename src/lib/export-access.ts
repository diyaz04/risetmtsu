import "server-only"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { FIELD_LABEL } from "@/lib/labels"

type User = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/** Admin: semua. Guru: siswa yang diklaim. Siswa: riset sendiri. */
function canAccess(user: User, student: { userId: string; teacherId: string | null }) {
  if (user.role === "ADMIN") return true
  if (user.role === "TEACHER") return !!user.teacher && student.teacherId === user.teacher.id
  return student.userId === user.id
}

const studentInclude = {
  user: true,
  teacher: { include: { user: true } },
} as const

export type ExportMeta = {
  title: string
  studentName: string
  kelas: string | null
  nis: string | null
  fieldLabel: string | null
  teacherName: string | null
}

function metaOf(
  s: { kelas: string | null; nis: string | null; field: keyof typeof FIELD_LABEL | null; user: { name: string }; teacher: { user: { name: string } } | null },
  title: string | null,
): ExportMeta {
  return {
    title: title ?? "Laporan Riset",
    studentName: s.user.name,
    kelas: s.kelas,
    nis: s.nis,
    fieldLabel: s.field ? FIELD_LABEL[s.field] : null,
    teacherName: s.teacher?.user.name ?? null,
  }
}

export type Denied = { denied: 401 | 404 }

/** Seluruh riset seorang siswa (untuk unduh Word / cetak). */
export async function loadResearchForExport(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { denied: 401 } as Denied

  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      ...studentInclude,
      research: { include: { chapters: { orderBy: { number: "asc" } } } },
    },
    relationLoadStrategy: "join",
  })
  // 404 (bukan 403) agar keberadaan data milik orang lain tidak terbongkar
  if (!student || !canAccess(user, student)) return { denied: 404 } as Denied

  const chapters = (student.research?.chapters ?? []).filter((c) => c.content && c.status !== "LOCKED")
  return {
    meta: metaOf(student, student.research?.title ?? null),
    chapters,
    approved: chapters.filter((c) => c.status === "APPROVED").length,
  }
}

/** Satu bab. */
export async function loadChapterForExport(chapterId: string) {
  const user = await getCurrentUser()
  if (!user) return { denied: 401 } as Denied

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { research: { include: { student: { include: studentInclude } } } },
    relationLoadStrategy: "join",
  })
  if (!chapter || chapter.status === "LOCKED" || !canAccess(user, chapter.research.student)) {
    return { denied: 404 } as Denied
  }
  return { chapter, meta: metaOf(chapter.research.student, chapter.research.title) }
}

/** Nama file aman: huruf/angka/strip saja. */
export function safeFileName(...parts: (string | number | null | undefined)[]) {
  const slug = parts
    .filter((p) => p !== null && p !== undefined && p !== "")
    .join("-")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
  return slug || "riset"
}
