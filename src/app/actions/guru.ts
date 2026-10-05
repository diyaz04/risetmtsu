"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"

/** Klaim atomik: hanya berhasil jika siswa belum dimiliki guru lain. */
export async function claimStudent(studentId: string): Promise<{ ok: true } | { error: string }> {
  const user = await requireRole("TEACHER")
  if (!user.teacher) return { error: "Akun guru belum punya bidang riset" }

  const { count } = await db.studentProfile.updateMany({
    where: { id: studentId, teacherId: null },
    data: { teacherId: user.teacher.id, field: user.teacher.field, claimedAt: new Date() },
  })
  if (count === 0) return { error: "Siswa ini sudah diklaim guru lain" }

  await db.research.upsert({ where: { studentId }, update: {}, create: { studentId } })
  revalidatePath("/guru", "layout")
  return { ok: true }
}
