import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { ArrowLeft } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { CHAPTER_STATUS_LABEL, CHAPTER_TITLES } from "@/lib/labels"
import { ChapterEditor } from "./chapter-editor"

export default async function BabPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const number = Number(n)
  if (!Number.isInteger(number) || number < 1 || number > CHAPTER_TITLES.length) notFound()

  const user = await requireRole("STUDENT")
  if (!user.student) redirect("/siswa")

  const chapter = await db.chapter.findFirst({
    where: { number, research: { studentId: user.student.id } },
    include: { comments: { include: { author: true }, orderBy: { createdAt: "desc" } } },
    relationLoadStrategy: "join",
  })
  // belum ada (judul belum di-ACC) atau masih terkunci -> kembali ke dashboard
  if (!chapter || chapter.status === "LOCKED") redirect("/siswa")

  const editable = chapter.status === "DRAFT" || chapter.status === "REVISION"

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/siswa" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Riset Saya
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            Bab {number} · {CHAPTER_TITLES[number - 1]}
          </h1>
          <StatusBadge status={chapter.status} label={CHAPTER_STATUS_LABEL[chapter.status]} />
        </div>
      </div>

      {chapter.status === "SUBMITTED" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Bab ini sudah dikirim dan sedang direview guru. Kamu belum bisa mengeditnya.
        </p>
      )}
      {chapter.status === "APPROVED" && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Bab ini sudah disetujui guru.</p>
      )}
      {chapter.status === "REVISION" && (
        <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
          Guru meminta revisi. Baca catatan di bawah, perbaiki, lalu kirim ulang.
        </p>
      )}

      {chapter.comments.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Catatan Guru</h2>
          <ul className="space-y-2">
            {chapter.comments.map((c) => (
              <li key={c.id} className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p>{c.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.author.name} ·{" "}
                  {c.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ChapterEditor
        chapterId={chapter.id}
        initialContent={chapter.content as JSONContent | null}
        editable={editable}
      />
    </div>
  )
}
