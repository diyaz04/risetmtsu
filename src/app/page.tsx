import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileDown,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  LogIn,
  PenLine,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCog,
  UserRound,
  Users,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"
import { ROLE_HOME } from "@/lib/auth"
import { readSession } from "@/lib/session"
import { cn } from "@/lib/utils"

const BIDANG = [
  { label: "Riset Agama", icon: BookOpen },
  { label: "Riset Humaniora", icon: Landmark },
  { label: "Riset Sains", icon: FlaskConical },
]

const PERAN = [
  {
    icon: UserRound,
    title: "Siswa Peneliti",
    text: "Ajukan judul, tulis tiap bab di editor ala Word dengan simpan otomatis, dan baca catatan guru kapan saja.",
  },
  {
    icon: Users,
    title: "Guru Pembimbing",
    text: "Klaim siswa, review judul dan bab, beri catatan, lalu setujui. Bab berikutnya terbuka otomatis.",
  },
  {
    icon: UserCog,
    title: "Admin Utama",
    text: "Kelola data siswa dan guru, impor dari Excel, dan pantau progres seluruh riset per kategori.",
  },
]

const FITUR = [
  { icon: PenLine, label: "Editor ala Word" },
  { icon: Timer, label: "Simpan otomatis" },
  { icon: FileDown, label: "Ekspor Word & PDF" },
  { icon: ShieldCheck, label: "Akses sesuai peran" },
]

const ALUR = [
  { title: "Siswa didaftarkan", text: "Admin menambahkan siswa satu per satu atau impor sekaligus dari Excel." },
  { title: "Guru mengklaim", text: "Guru riset mengklaim siswa, dan bidang riset siswa mengikuti guru tersebut." },
  { title: "Ajukan judul", text: "Siswa mengajukan judul. Guru menyetujui, meminta revisi, atau menolak." },
  { title: "Tulis Bab 1–5", text: "Siswa menulis bab demi bab langsung di sistem lalu mengirimnya untuk direview." },
  { title: "ACC dan unduh", text: "Setelah disetujui, laporan bisa diunduh sebagai Word atau dicetak ke PDF." },
]

export default async function Home() {
  const session = await readSession()
  const cta = session
    ? { href: ROLE_HOME[session.role], label: "Buka Dashboard", icon: LayoutDashboard }
    : { href: "/login", label: "Login Sekarang", icon: LogIn }
  const CtaIcon = cta.icon

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-foreground">
      {/* dekorasi latar */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] overflow-hidden">
        <div className="absolute -left-24 -top-32 size-[26rem] rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -right-24 -top-20 size-[30rem] rounded-full bg-lime-300/30 blur-3xl" />
        <div className="absolute inset-0 [background-image:radial-gradient(#10b98126_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-20 border-b border-transparent bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Logo size={40} priority />
            <span className="truncate text-sm font-semibold leading-tight sm:text-base">
              Riset MTs KH A Wahab Muhsin
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#peran" className="hover:text-foreground">
              Untuk Siapa
            </a>
            <a href="#alur" className="hover:text-foreground">
              Alur Riset
            </a>
          </nav>
          <Link href={cta.href} className={cn(buttonVariants({ size: "lg" }), "h-10 shrink-0 px-4")}>
            <CtaIcon /> {session ? "Dashboard" : "Login"}
          </Link>
        </div>
      </header>

      <main className="relative">
        {/* hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pb-28">
          <div className="animate-fade-up space-y-7 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700">
              <Sparkles className="size-3.5" /> Iman · Islam · Ihsan
            </span>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Sistem Manajemen Riset
              <span className="mt-1 block bg-gradient-brand bg-clip-text text-transparent">MTs KH A Wahab Muhsin</span>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Kelola riset siswa dari pengajuan judul sampai laporan akhir. Menulis, membimbing, dan memantau progres,
              semuanya dalam satu tempat.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={cta.href}
                className={cn(buttonVariants({ size: "lg" }), "group h-12 w-full px-7 text-base shadow-lg shadow-emerald-600/25 sm:w-auto")}
              >
                <CtaIcon className="size-5" /> {cta.label}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#alur" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 w-full px-7 text-base sm:w-auto")}>
                Lihat Alur Riset
              </a>
            </div>

            <ul className="flex flex-wrap justify-center gap-2 pt-1 lg:justify-start">
              {BIDANG.map((b) => (
                <li key={b.label} className="flex items-center gap-1.5 rounded-full border bg-white/80 px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
                  <b.icon className="size-4 text-emerald-600" /> {b.label}
                </li>
              ))}
            </ul>
          </div>

          {/* visual: logo + kartu melayang */}
          <div className="animate-fade-up relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center" style={{ animationDelay: "0.15s" }}>
            <div aria-hidden className="animate-glow absolute inset-6 rounded-full bg-gradient-to-tr from-emerald-300/60 via-green-200/50 to-lime-200/60 blur-2xl" />
            <div className="animate-float relative">
              <Logo size={300} priority className="size-56 drop-shadow-2xl sm:size-72" />
            </div>

            <div className="animate-float absolute left-0 top-6 hidden w-44 rounded-2xl border bg-white/90 p-3 shadow-xl backdrop-blur sm:-left-4 sm:block" style={{ animationDelay: "0.8s" }}>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="font-semibold">Bab 1 disetujui</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Bab 2 sudah terbuka</p>
            </div>

            <div className="animate-float absolute bottom-10 right-0 hidden w-48 rounded-2xl border bg-white/90 p-3 shadow-xl backdrop-blur sm:-right-4 sm:block" style={{ animationDelay: "1.6s" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Progres riset</span>
                <span className="font-semibold text-emerald-700">67%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-gradient-brand" />
              </div>
            </div>

            <div className="animate-float absolute bottom-2 left-4 hidden rounded-2xl border bg-white/90 px-3 py-2 shadow-xl backdrop-blur sm:block" style={{ animationDelay: "2.4s" }}>
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <PenLine className="size-3.5 text-emerald-600" /> Tersimpan otomatis
              </p>
            </div>
          </div>
        </section>

        {/* fitur singkat */}
        <section className="mx-auto max-w-6xl px-4">
          <ul className="grid grid-cols-2 gap-3 rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur sm:grid-cols-4">
            {FITUR.map((f) => (
              <li key={f.label} className="flex items-center gap-3 rounded-2xl p-2 sm:justify-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <f.icon className="size-5" />
                </span>
                <span className="text-sm font-medium">{f.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* peran */}
        <section id="peran" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Untuk siapa</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Satu sistem, tiga peran</h2>
            <p className="mt-3 text-muted-foreground">Setiap pengguna melihat tampilan dan alat yang sesuai dengan tugasnya.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PERAN.map((p) => (
              <article key={p.title} className="group rounded-3xl border bg-white p-6 transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-600/10">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-md shadow-emerald-600/25">
                  <p.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* alur */}
        <section id="alur" className="scroll-mt-20 bg-gradient-to-b from-emerald-50/60 to-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Alur riset</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dari judul sampai laporan</h2>
            </div>
            <ol className="mt-12 grid gap-4 md:grid-cols-5">
              {ALUR.map((a, i) => (
                <li key={a.title} className="relative rounded-3xl border bg-white p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-semibold">{a.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ajakan */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-brand px-6 py-14 text-center text-white shadow-xl shadow-emerald-700/20 sm:px-12">
            <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 size-72 rounded-full bg-lime-200/20 blur-2xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Siap memulai riset?</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Masuk dengan akun yang diberikan sekolah untuk mulai menulis, membimbing, atau memantau riset.
              </p>
              <Link
                href={cta.href}
                className={cn(buttonVariants({ size: "lg" }), "mt-8 h-12 bg-white bg-none px-8 text-base text-emerald-700 shadow-lg hover:bg-white hover:brightness-95")}
              >
                <CtaIcon className="size-5" /> {cta.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div className="text-sm">
              <p className="font-semibold">Madrasah Tsanawiyah KH. A. Wahab Muhsin</p>
              <p className="text-muted-foreground">Sukahideng, Tasikmalaya</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sistem Manajemen Riset</p>
        </div>
      </footer>
    </div>
  )
}
