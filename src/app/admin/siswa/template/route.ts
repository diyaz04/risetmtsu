import ExcelJS from "exceljs"
import { readSession } from "@/lib/session"

export const runtime = "nodejs"

/** Template Excel untuk impor siswa. Hanya admin. */
export async function GET() {
  const session = await readSession()
  if (session?.role !== "ADMIN") return new Response("Tidak diizinkan", { status: 401 })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Siswa")
  ws.columns = [
    { header: "Nama Lengkap", key: "nama", width: 34 },
    { header: "NIS", key: "nis", width: 16, style: { numFmt: "@" } }, // teks, agar angka 0 di depan tidak hilang
    { header: "Kelas", key: "kelas", width: 10, style: { numFmt: "@" } },
    { header: "Password Awal", key: "password", width: 20, style: { numFmt: "@" } },
  ]
  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: "FFFFFFFF" } }
  header.alignment = { vertical: "middle" }
  header.height = 22
  header.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } }
  })
  ws.views = [{ state: "frozen", ySplit: 1 }]

  const help = wb.addWorksheet("Petunjuk")
  help.getColumn(1).width = 90
  const lines = [
    "PETUNJUK PENGISIAN",
    "",
    "1. Isi data siswa mulai baris 2 pada sheet \"Siswa\". Jangan ubah atau hapus baris judul (baris 1).",
    "2. Nama Lengkap wajib diisi. Username dibuat otomatis: nama tanpa spasi + @riset.com (contoh: ahmadfauzi@riset.com).",
    "3. NIS dan Kelas boleh dikosongkan. NIS tidak boleh sama dengan siswa lain.",
    "4. Password Awal boleh dikosongkan; jika kosong, sistem membuat password acak. Jika diisi, minimal 6 karakter.",
    "5. Siswa wajib mengganti password awal saat login pertama.",
    "6. Maksimal 500 siswa sekali impor. Simpan sebagai .xlsx lalu unggah di menu Siswa > Impor Banyak.",
    "",
    "CONTOH (jangan ikut diunggah; ketik di sheet \"Siswa\"):",
    "Ahmad Fauzi | 12345 | 7A | siswa123",
    "Siti Aisyah | 12346 | 7A | (kosong = acak)",
  ]
  lines.forEach((l, i) => {
    const cell = help.getCell(i + 1, 1)
    cell.value = l
    if (i === 0 || l.startsWith("CONTOH")) cell.font = { bold: true }
  })

  const buffer = await wb.xlsx.writeBuffer()
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-siswa.xlsx"',
      "Cache-Control": "no-store",
    },
  })
}
