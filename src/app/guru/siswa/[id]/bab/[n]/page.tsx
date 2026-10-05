import Link from "next/link"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { ArrowLeft } from "lucide-react"
import { DocEditor } from "@/components/doc-editor"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { CHAPTER_STATUS_LABEL, CHAPTER_TITLES } from "@/lib/labels"
import { CommentForm, ReviewPanel } from "./review-panel"

export default async function GuruBabPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params
  const number = Number(n)
  if (!Number.isInteger(number) || number < 1 || number > CHAPTER_TITLES.length) notFound()

  const user = await requireRole("TEACHER")
  const student = await db.studentProfile.findUnique({ where: { id }, include: { user: true } })
  // guru hanya boleh melihat siswa yang dia klaim
  if (!student || !user.teacher || student.teacherId !== user.teacher.id) notFound()

  const chapter = await db.chapter.findFirst({
    where: { number, research: { studentId: id } },
    include: { comments: { include: { author: true }, orderBy: { createdAt: "desc" } } },
    relationLoadStrategy: "join",
  })
  if (!chapter || chapter.status === "LOCKED") notFound()

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link
          href={`/guru/siswa/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {student.user.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            Bab {number} · {CHAPTER_TITLES[number - 1]}
          </h1>
          <StatusBadge status={chapter.status} label={CHAPTER_STATUS_LABEL[chapter.status]} />
        </div>
        {chapter.submittedAt && (
          <p className="text-sm text-muted-foreground">
            Dikirim{" "}
            {chapter.submittedAt.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
          </p>
        )}
      </div>

      {(chapter.status === "DRAFT" || chapter.status === "REVISION") && (
        <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-800">
          {chapter.status === "DRAFT"
            ? "Siswa masih mengerjakan bab ini (draft). Kamu hanya bisa membaca."
            : "Siswa sedang merevisi bab ini sesuai catatanmu."}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 order-2 lg:order-1">
          <DocEditor initialContent={chapter.content as JSONContent | null} editable={false} />
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          {chapter.status === "SUBMITTED" && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle>Review bab</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewPanel chapterId={chapter.id} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Catatan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {chapter.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
              ) : (
                <ul className="space-y-2">
                  {chapter.comments.map((c) => (
                    <li key={c.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="whitespace-pre-wrap">{c.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.author.name} · {c.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {chapter.status !== "SUBMITTED" && <CommentForm chapterId={chapter.id} />}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
