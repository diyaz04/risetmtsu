import Link from "next/link"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { ArrowLeft } from "lucide-react"
import { DocEditor } from "@/components/doc-editor"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { CHAPTER_STATUS_LABEL, CHAPTER_TITLES } from "@/lib/labels"

export default async function AdminBabPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params
  const number = Number(n)
  if (!Number.isInteger(number) || number < 1 || number > CHAPTER_TITLES.length) notFound()

  const chapter = await db.chapter.findFirst({
    where: { number, research: { studentId: id } },
    include: {
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      research: { include: { student: { include: { user: true } } } },
    },
    relationLoadStrategy: "join",
  })
  if (!chapter || chapter.status === "LOCKED") notFound()

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link
          href={`/admin/riset/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {chapter.research.student.user.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            Bab {number} · {CHAPTER_TITLES[number - 1]}
          </h1>
          <StatusBadge status={chapter.status} label={CHAPTER_STATUS_LABEL[chapter.status]} />
        </div>
        {chapter.submittedAt && (
          <p className="text-sm text-muted-foreground">
            Dikirim {chapter.submittedAt.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Tampilan baca saja. Review dilakukan oleh guru pembimbing.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 min-w-0 lg:order-1">
          <DocEditor initialContent={chapter.content as JSONContent | null} editable={false} />
        </div>
        <aside className="order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>Catatan Guru</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
