import "server-only"
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ISectionOptions,
} from "docx"

/** Simpul dokumen Tiptap/ProseMirror (JSON). */
type Mark = { type: string; attrs?: Record<string, unknown> }
type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: Mark[]; content?: Node[] }

const FONT = "Times New Roman"
const SIZE = 24 // setengah poin -> 12pt
const CM = 567 // twips per cm
const LINE = 360 // spasi 1,5
const FIRST_LINE = Math.round(1.25 * CM)

const ALIGN: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

type Ctx = {
  /** menambah instance numbering baru agar tiap daftar nomor mulai dari 1 */
  nextInstance: () => number
  italics?: boolean
  indentLeft?: number
  /** di dalam tabel/daftar/kutipan: tanpa indentasi baris pertama */
  plain?: boolean
}

function runs(nodes: Node[] | undefined, base: { bold?: boolean; italics?: boolean; allCaps?: boolean; size?: number }) {
  const out: TextRun[] = []
  for (const n of nodes ?? []) {
    if (n.type === "hardBreak") {
      out.push(new TextRun({ break: 1 }))
      continue
    }
    if (n.type !== "text" || !n.text) continue
    const has = (t: string) => n.marks?.some((m) => m.type === t)
    out.push(
      new TextRun({
        text: n.text,
        font: has("code") ? "Courier New" : FONT,
        size: base.size ?? SIZE,
        bold: base.bold || has("bold"),
        italics: base.italics || has("italic"),
        underline: has("underline") ? {} : undefined,
        strike: has("strike"),
        allCaps: base.allCaps,
      }),
    )
  }
  return out
}

function align(node: Node, fallback: (typeof AlignmentType)[keyof typeof AlignmentType]) {
  const a = node.attrs?.textAlign
  return typeof a === "string" && ALIGN[a] ? { alignment: ALIGN[a], explicit: true } : { alignment: fallback, explicit: false }
}

function blocks(nodes: Node[] | undefined, ctx: Ctx, listLevel = -1, listRef?: { ref: string; instance: number }): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = []

  for (const node of nodes ?? []) {
    switch (node.type) {
      case "paragraph": {
        const { alignment, explicit } = align(node, ctx.plain ? AlignmentType.LEFT : AlignmentType.JUSTIFIED)
        out.push(
          new Paragraph({
            children: runs(node.content, { italics: ctx.italics }),
            alignment,
            spacing: { line: LINE, after: ctx.plain ? 0 : 120 },
            indent: ctx.indentLeft ? { left: ctx.indentLeft } : !ctx.plain && !explicit ? { firstLine: FIRST_LINE } : undefined,
            ...(listRef ? { numbering: { reference: listRef.ref, level: listLevel, instance: listRef.instance } } : {}),
          }),
        )
        break
      }
      case "heading": {
        const level = Number(node.attrs?.level ?? 1)
        const { alignment } = align(node, level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT)
        out.push(
          new Paragraph({
            children: runs(node.content, { bold: true, italics: level === 3, allCaps: level === 1, size: level === 1 ? 28 : SIZE }),
            alignment,
            spacing: { line: LINE, before: 240, after: 120 },
            keepNext: true,
          }),
        )
        break
      }
      case "bulletList":
      case "orderedList": {
        const ordered = node.type === "orderedList"
        const ref = ordered ? "numbers" : "bullets"
        const instance = ordered ? ctx.nextInstance() : 0
        for (const item of node.content ?? []) {
          out.push(...blocks(item.content, { ...ctx, plain: true }, Math.min(listLevel + 1, 2), { ref, instance }))
        }
        break
      }
      case "blockquote":
        out.push(...blocks(node.content, { ...ctx, italics: true, indentLeft: 720, plain: true }))
        break
      case "table":
        out.push(table(node, ctx))
        break
      case "horizontalRule":
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } } }))
        break
      default:
        break
    }
  }
  return out
}

function table(node: Node, ctx: Ctx) {
  const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" }
  const borders = { top: line, bottom: line, left: line, right: line }

  const rows = (node.content ?? []).map(
    (row) =>
      new TableRow({
        children: (row.content ?? []).map((cell) => {
          const isHeader = cell.type === "tableHeader"
          const content = blocks(cell.content, { ...ctx, plain: true, indentLeft: undefined })
          return new TableCell({
            children: content.length ? content : [new Paragraph({})],
            borders,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            columnSpan: Number(cell.attrs?.colspan ?? 1) || 1,
            rowSpan: Number(cell.attrs?.rowspan ?? 1) || 1,
            shading: isHeader ? { type: ShadingType.CLEAR, fill: "F3F4F6", color: "auto" } : undefined,
          })
        }),
      }),
  )
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
}

function bodyOf(doc: unknown, ctx: Ctx) {
  const root = doc as Node | null
  const out = root?.type === "doc" ? blocks(root.content, ctx) : []
  return out.length ? out : [new Paragraph({})]
}

const pageProps = {
  page: {
    size: { width: 11906, height: 16838 }, // A4
    margin: { top: 1440, bottom: 1440, left: 1701, right: 1440 }, // atas/bawah/kanan 2,54 cm, kiri 3 cm
  },
}

const footer = () =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22 })],
      }),
    ],
  })

function numberingConfig() {
  const level = (i: number, fmt: (typeof LevelFormat)[keyof typeof LevelFormat], text: string) => ({
    level: i,
    format: fmt,
    text,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720 + i * 360, hanging: 360 } } },
  })
  return {
    config: [
      {
        reference: "bullets",
        levels: [level(0, LevelFormat.BULLET, "•"), level(1, LevelFormat.BULLET, "–"), level(2, LevelFormat.BULLET, "•")],
      },
      {
        reference: "numbers",
        levels: [level(0, LevelFormat.DECIMAL, "%1."), level(1, LevelFormat.LOWER_LETTER, "%2."), level(2, LevelFormat.LOWER_ROMAN, "%3.")],
      },
    ],
  }
}

function makeDocument(title: string, sections: ISectionOptions[]) {
  return new Document({
    creator: "Sistem Riset MTs KH A Wahab Muhsin",
    title,
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    numbering: numberingConfig(),
    sections,
  })
}

function counter() {
  let n = 0
  return () => ++n
}

export type CoverMeta = {
  title: string
  studentName: string
  kelas?: string | null
  nis?: string | null
  fieldLabel?: string | null
  teacherName?: string | null
  school: string
  year: number
}

function cover(meta: CoverMeta): ISectionOptions {
  const center = (text: string, opts: { bold?: boolean; size?: number; before?: number; after?: number; caps?: boolean } = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 120, line: LINE },
      children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? SIZE, font: FONT, allCaps: opts.caps })],
    })

  const info = (label: string, value?: string | null) =>
    value
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: `${label}: ${value}`, font: FONT, size: SIZE })],
        })
      : null

  return {
    properties: pageProps,
    children: [
      center("LAPORAN RISET", { bold: true, size: 32, before: 1800, after: 360 }),
      center(meta.title, { bold: true, size: 28, caps: true, after: 1200 }),
      center("Disusun oleh:", { after: 120 }),
      center(meta.studentName, { bold: true, size: 28, after: 120 }),
      ...[info("Kelas", meta.kelas), info("NIS", meta.nis), info("Bidang", meta.fieldLabel), info("Pembimbing", meta.teacherName)].filter(
        (p): p is Paragraph => !!p,
      ),
      center(meta.school.toUpperCase(), { bold: true, size: 28, before: 2400, after: 60 }),
      center(String(meta.year), { bold: true, size: 28 }),
    ],
  }
}

/** Satu bab saja. */
export async function buildChapterDocx(content: unknown, title: string) {
  const ctx: Ctx = { nextInstance: counter() }
  const doc = makeDocument(title, [{ properties: pageProps, footers: { default: footer() }, children: bodyOf(content, ctx) }])
  return Packer.toBuffer(doc)
}

/** Halaman judul + semua bab yang sudah ada isinya, tiap bab mulai di halaman baru. */
export async function buildResearchDocx(meta: CoverMeta, chapters: { content: unknown }[]) {
  const ctx: Ctx = { nextInstance: counter() }
  const sections: ISectionOptions[] = [
    cover(meta),
    ...chapters.map((c) => ({ properties: pageProps, footers: { default: footer() }, children: bodyOf(c.content, ctx) })),
  ]
  return Packer.toBuffer(makeDocument(meta.title, sections))
}
