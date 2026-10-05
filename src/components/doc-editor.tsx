"use client"

import { useEffect } from "react"
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import { TableKit } from "@tiptap/extension-table"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Columns3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Rows3,
  Table2,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  initialContent: JSONContent | null
  editable: boolean
  onChange?: (json: JSONContent, wordCount: number) => void
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function ToolButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      // mousedown + preventDefault agar fokus & seleksi di editor tidak hilang
      onMouseDown={(e) => {
        e.preventDefault()
        if (!disabled) onClick()
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40 [&_svg]:size-4",
        active && "bg-accent text-emerald-700",
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" />

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      inTable: e.isActive("table"),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      justify: e.isActive({ textAlign: "justify" }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      block: e.isActive("heading", { level: 1 })
        ? "1"
        : e.isActive("heading", { level: 2 })
          ? "2"
          : e.isActive("heading", { level: 3 })
            ? "3"
            : "p",
    }),
  })
  const chain = () => editor.chain().focus()

  return (
    <div className="sticky top-14 z-[5] flex flex-wrap items-center gap-0.5 border-b bg-white px-3 py-1.5">
      <ToolButton title="Urungkan" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
        <Undo2 />
      </ToolButton>
      <ToolButton title="Ulangi" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
        <Redo2 />
      </ToolButton>
      <Divider />
      <select
        aria-label="Gaya paragraf"
        value={s.block}
        onChange={(e) => {
          const v = e.target.value
          if (v === "p") chain().setParagraph().run()
          else chain().toggleHeading({ level: Number(v) as 1 | 2 | 3 }).run()
        }}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="p">Paragraf</option>
        <option value="1">Judul Bab</option>
        <option value="2">Subjudul</option>
        <option value="3">Sub-subjudul</option>
      </select>
      <Divider />
      <ToolButton title="Tebal" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton title="Miring" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton title="Garis bawah" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline />
      </ToolButton>
      <Divider />
      <ToolButton title="Rata kiri" active={s.left} onClick={() => chain().setTextAlign("left").run()}>
        <AlignLeft />
      </ToolButton>
      <ToolButton title="Rata tengah" active={s.center} onClick={() => chain().setTextAlign("center").run()}>
        <AlignCenter />
      </ToolButton>
      <ToolButton title="Rata kanan" active={s.right} onClick={() => chain().setTextAlign("right").run()}>
        <AlignRight />
      </ToolButton>
      <ToolButton title="Rata kiri-kanan" active={s.justify} onClick={() => chain().setTextAlign("justify").run()}>
        <AlignJustify />
      </ToolButton>
      <Divider />
      <ToolButton title="Daftar poin" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton title="Daftar nomor" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton title="Kutipan" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>
      <Divider />
      <ToolButton
        title="Sisipkan tabel"
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table2 />
      </ToolButton>
      {s.inTable && (
        <>
          <ToolButton title="Tambah baris" onClick={() => chain().addRowAfter().run()}>
            <Rows3 />
          </ToolButton>
          <ToolButton title="Tambah kolom" onClick={() => chain().addColumnAfter().run()}>
            <Columns3 />
          </ToolButton>
          <ToolButton title="Hapus tabel" onClick={() => chain().deleteTable().run()}>
            <Trash2 className="text-destructive" />
          </ToolButton>
        </>
      )}
    </div>
  )
}

export function DocEditor({ initialContent, editable, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false, // hindari mismatch SSR
    editable,
    content: initialContent ?? "",
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit,
    ],
    editorProps: {
      attributes: { class: "outline-none", spellcheck: "true", lang: "id" },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON(), countWords(editor.getText())),
  })

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  if (!editor) return <div className="h-96 animate-pulse rounded-lg bg-muted" />

  return (
    <div className="rounded-xl border bg-white">
      {editable && <Toolbar editor={editor} />}
      <div className="overflow-x-auto bg-muted/60 px-2 py-6 sm:px-6">
        <div className="paper-doc mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

export function wordCountOf(json: JSONContent | null): number {
  const walk = (n: JSONContent): string => (n.text ?? "") + (n.content ?? []).map(walk).join(" ")
  return json ? countWords(walk(json)) : 0
}
