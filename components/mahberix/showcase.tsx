"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { motion, useInView, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion"
import {
  Briefcase,
  Wallet,
  MapPin,
  Users,
  Clock,
  BadgeCheck,
  CalendarClock,
  Building2,
  Newspaper,
  BarChart3,
  Star,
  GitBranch,
  type LucideIcon,
} from "lucide-react"
import { useLang, pick } from "@/lib/i18n"

const ease = [0.22, 1, 0.36, 1] as const

type Copy = { eyebrow: string; lead: string; accent: string; body: string; bullets: string[] }
type Feature = {
  id: string
  n: string
  icon: LucideIcon
  en: Copy
  am: Copy
  image: { src: string; w: number; h: number; alt: string; video?: string }
  frameMax: string
  glow: string
  overlays: ReactNode
}

const features: Feature[] = [
  {
    id: "profile",
    n: "01",
    icon: Building2,
    en: {
      eyebrow: "Company profile",
      lead: "Create your profile",
      accent: "then start publishing.",
      body: "Set up your company profile in minutes — logo, description and links. Once it's live, use it as your home base to publish blog posts, open job listings and upcoming events straight to your public page.",
      bullets: ["Branded public page", "Post blog articles", "List open jobs", "Share upcoming events"],
    },
    am: {
      eyebrow: "የኩባንያ መገለጫ",
      lead: "መገለጫዎን ይፍጠሩ",
      accent: "ከዚያም ማውጣት ይጀምሩ።",
      body: "የኩባንያዎን መገለጫ በደቂቃዎች ውስጥ ያዋቅሩ — አርማ፣ መግለጫ እና አገናኞች። ከቀጥታ በኋላ ብሎጎችን፣ የስራ ማስታወቂያዎችን እና መጪ ዝግጅቶችን ወደ የህዝብ ገጽዎ ለማውጣት እንደ መነሻ ይጠቀሙበት።",
      bullets: ["የግል የህዝብ ገጽ", "ብሎግ ጽሁፎችን ይለጥፉ", "ክፍት ስራዎችን ይዘርዝሩ", "መጪ ዝግጅቶችን ያጋሩ"],
    },
    image: { src: "/assets/Z_company_profile_1180x741.png", w: 1180, h: 741, alt: "Company profile page in Mahberix" },
    frameMax: "max-w-[52.8rem]",
    glow: "rgba(52,211,153,0.26)",
    overlays: (
      <>
        <FloatBadge className="left-2 top-10 lg:-left-14" delay={0.3} icon={<Newspaper className="h-4 w-4 text-emerald-300" />} label="Published" value="Blog" sub="2 posts" ping />
        <FloatBadge className="bottom-6 right-2 lg:-right-14" delay={0.5} icon={<CalendarClock className="h-4 w-4 text-teal-300" />} label="Upcoming" value="3 events" sub="this month" />
      </>
    ),
  },
  {
    id: "hiring",
    n: "02",
    icon: Briefcase,
    en: {
      eyebrow: "Hiring & applicant tracking",
      lead: "Fill roles",
      accent: "without the spreadsheet chaos.",
      body: "Post openings to your public careers page, gather every application in one inbox, and screen candidates with AI-assisted overviews. Move people through stages, schedule interviews, and hire or reject in bulk.",
      bullets: ["Public careers page", "AI candidate overviews", "Interview scheduling", "Bulk hire & reject"],
    },
    am: {
      eyebrow: "ቅጥር እና የአመልካች ክትትል",
      lead: "ቦታዎችን ይሙሉ",
      accent: "ያለ ስፕሬድሺት ትርምስ።",
      body: "ማስታወቂያዎችን ወደ የህዝብ የስራ ገጽዎ ይለጥፉ፣ ሁሉንም ማመልከቻ በአንድ ኢንቦክስ ይሰብስቡ፣ እና በAI በታገዙ ማጠቃለያዎች አመልካቾችን ይምረጡ። ሰዎችን በደረጃዎች ያንቀሳቅሱ፣ ቃለ መጠይቆችን ያቀናብሩ፣ እና በጅምላ ይቅጠሩ ወይም ውድቅ ያድርጉ።",
      bullets: ["የህዝብ የስራ ገጽ", "የAI አመልካች ማጠቃለያ", "የቃለ መጠይቅ ዕቅድ", "በጅምላ ቅጥር እና ውድቅ"],
    },
    image: { src: "/assets/Z_jobs_1650x482.png", w: 1650, h: 482, alt: "Jobs and applicants pipeline in Mahberix" },
    frameMax: "max-w-6xl",
    glow: "rgba(52,211,153,0.28)",
    overlays: (
      <>
        <FloatBadge className="left-2 top-10 lg:-left-10" delay={0.3} icon={<Users className="h-4 w-4 text-emerald-300" />} label="Applicants" value="34" sub="+8 today" ping />
        <FloatBadge className="bottom-6 right-2 lg:-right-12" delay={0.5} icon={<CalendarClock className="h-4 w-4 text-teal-300" />} label="Next interview" value="09:30" sub="Amara O." />
      </>
    ),
  },
  {
    id: "payroll",
    n: "03",
    icon: Wallet,
    en: {
      eyebrow: "Payments & payroll",
      lead: "Pay your team",
      accent: "and keep a clean record.",
      body: "See exactly what each person is owed, mark payments as paid in a click, and give every employee a transparent record of their own history.",
      bullets: ["What's due at a glance", "Mark as paid in one click", "Per-employee history", "Tied to attendance"],
    },
    am: {
      eyebrow: "ክፍያዎች እና ደመወዝ",
      lead: "ቡድንዎን ይክፈሉ",
      accent: "እና ንጹህ መዝገብ ይያዙ።",
      body: "እያንዳንዱ ሰው ምን ያህል እንደሚገባው በትክክል ይመልከቱ፣ ክፍያዎችን በአንድ ጠቅታ እንደተከፈሉ ምልክት ያድርጉ፣ እና ለእያንዳንዱ ሰራተኛ ግልጽ የሆነ የራሱ ታሪክ ይስጡ።",
      bullets: ["የሚከፈለው በአንድ እይታ", "በአንድ ጠቅታ እንደተከፈለ ምልክት", "የእያንዳንዱ ሰራተኛ ታሪክ", "ከመገኘት ጋር የተያያዘ"],
    },
    image: { src: "/assets/Z_payroll_1661x637.png", w: 1661, h: 637, alt: "Payroll and payments dashboard in Mahberix" },
    frameMax: "max-w-6xl",
    glow: "rgba(250,204,21,0.22)",
    overlays: (
      <>
        <FloatBadge className="right-2 top-10 lg:-right-12" delay={0.3} icon={<Wallet className="h-4 w-4 text-amber-300" />} label="Payroll due" value="ETB37.5k" sub="in 4 days" />
        <FloatBadge className="bottom-6 left-2 lg:-left-10" delay={0.5} icon={<BadgeCheck className="h-4 w-4 text-emerald-300" />} label="Processed" value="Paid" sub="6 employees" check />
      </>
    ),
  },
  {
    id: "attendance",
    n: "04",
    icon: MapPin,
    en: {
      eyebrow: "Geofenced attendance",
      lead: "Know who's in",
      accent: "wherever the work happens.",
      body: "Location-aware clock-in and clock-out with lunch breaks, tied to each employee. ",
      bullets: ["GPS clock-in / out", "Lunch break tracking", "Live present-today view", "Feeds payroll & reviews"],
    },
    am: {
      eyebrow: "በጂኦ የተከለለ መገኘት",
      lead: "ማን እንዳለ ይወቁ",
      accent: "ስራው በሚሰራበት ቦታ ሁሉ።",
      body: "ከእያንዳንዱ ሰራተኛ ጋር የተያያዘ በአካባቢ የሚያውቅ መግቢያ እና መውጫ ከምሳ እረፍት ጋር። ",
      bullets: ["በጂፒኤስ መግቢያ / መውጫ", "የምሳ እረፍት ክትትል", "የዛሬ መገኘት ቀጥታ እይታ", "ደመወዝ እና ግምገማ ይመግባል"],
    },
    image: { src: "/assets/Z_attendance_953x647.png", w: 953, h: 647, alt: "Geofenced attendance tracking in Mahberix" },
    frameMax: "max-w-[52.8rem]",
    glow: "rgba(45,212,191,0.26)",
    overlays: (
      <>
        <FloatBadge className="left-2 top-10 lg:-left-14" delay={0.3} icon={<MapPin className="h-4 w-4 text-teal-300" />} label="Status" value="On-site" sub="Geofenced" ping />
        <FloatBadge className="bottom-6 right-2 lg:-right-14" delay={0.5} icon={<Clock className="h-4 w-4 text-emerald-300" />} label="Present today" value="83%" sub="5 / 6" />
      </>
    ),
  },
  {
    id: "reports",
    n: "05",
    icon: BarChart3,
    en: {
      eyebrow: "Employee reports",
      lead: "One report",
      accent: "for the whole picture.",
      body: "Pull peer reviews, attendance, Trello activity and GitHub stats into a single employee report. No tab-hopping — every signal on a person's performance lives on one page.",
      bullets: ["Peer review scores", "Attendance summary", "Trello activity", "GitHub stats"],
    },
    am: {
      eyebrow: "የሰራተኛ ሪፖርቶች",
      lead: "አንድ ሪፖርት",
      accent: "ለሙሉ ምስሉ።",
      body: "የእኩዮች ግምገማ፣ መገኘት፣ የTrello እንቅስቃሴ እና የGitHub ስታቲስቲክስ ወደ አንድ የሰራተኛ ሪፖርት ያሰባስቡ። ትር መዝለል የለም — በአንድ ሰው አፈጻጸም ላይ ያለ እያንዳንዱ ምልክት በአንድ ገጽ ላይ ይኖራል።",
      bullets: ["የእኩዮች ግምገማ ውጤት", "የመገኘት ማጠቃለያ", "የTrello እንቅስቃሴ", "የGitHub ስታቲስቲክስ"],
    },
    image: { src: "", w: 1300, h: 850, alt: "Employee report combining peer reviews, attendance, Trello and GitHub", video: "/assets/employee_report_1300x850.mp4" },
    frameMax: "max-w-5xl",
    glow: "rgba(52,211,153,0.26)",
    overlays: (
      <>
        <FloatBadge className="left-2 top-10 lg:-left-14" delay={0.3} icon={<Star className="h-4 w-4 text-amber-300" />} label="Peer review" value="4.6" sub="avg score" ping />
        <FloatBadge className="bottom-6 right-2 lg:-right-14" delay={0.5} icon={<GitBranch className="h-4 w-4 text-teal-300" />} label="GitHub" value="128" sub="commits / mo" />
      </>
    ),
  },
]

export function Showcase() {
  return (
    <section id="showcase" className="relative scroll-mt-20 overflow-hidden border-t border-border bg-background">
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(80% 60% at 50% 0%, #000 30%, transparent 100%)",
        }}
      />

      {/*<div className="mx-auto max-w-3xl px-4 pt-24 text-center sm:px-6 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">A look inside</p>
        <h2 className="mt-3 whitespace-nowrap text-[clamp(1.4rem,6vw,3rem)] font-extrabold leading-tight tracking-tight text-foreground">
          Everything your company{" "}
          <Typewriter text="needs" className="text-emerald-400" />
        </h2>
        
      </div>*/}

      <div className="flex flex-col">
        {features.map((f, i) => (
          <FeatureChapter key={f.id} f={f} last={i === features.length - 1} />
        ))}
      </div>
    </section>
  )
}

function FeatureChapter({ f, last }: { f: Feature; last: boolean }) {
  const { lang } = useLang()
  const c = pick(lang, f)
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const parallax = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60])

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  }
  const word: Variants = {
    hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
  }

  const leadWords = c.lead.split(" ")
  const accentWords = c.accent.split(" ")

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* giant ghost chapter number */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 -top-2 select-none text-[7rem] font-black leading-none tracking-tight text-white/[0.035] sm:text-[13rem]"
      >
        {f.n}
      </span>

      {/* Morphing text */}
      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
            <f.icon className="h-3.5 w-3.5" />
            {c.eyebrow}
          </span>
        </Reveal>

        <motion.h3
          variants={container}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl"
        >
          {leadWords.map((w, i) => (
            <motion.span key={`l-${i}`} variants={word} className="mr-[0.22em] inline-block">
              {w}
            </motion.span>
          ))}
          <br className="hidden sm:block" />
          {accentWords.map((w, i) => (
            <motion.span
              key={`a-${i}`}
              variants={word}
              className="mr-[0.22em] inline-block text-emerald-400"
            >
              {w}
            </motion.span>
          ))}
        </motion.h3>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{c.body}</p>
        </Reveal>

        <Reveal delay={0.16}>
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {c.bullets.map((b) => (
              <li
                key={b}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* Big morphing screenshot */}
      <div className="relative mt-9 [perspective:1800px] sm:mt-11">
        <motion.div style={{ y: parallax }} className={`relative mx-auto ${f.frameMax}`}>
          {/* per-feature glow */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="pointer-events-none absolute -inset-10 -z-10"
            style={{ background: `radial-gradient(55% 50% at 50% 45%, ${f.glow}, transparent 70%)` }}
          />

          <motion.div
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 60, scale: 0.94, rotateX: 10, filter: "blur(16px)" }
            }
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.95, ease }}
            className="relative [transform-style:preserve-3d]"
          >
            {/* emerald edge halo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-[1.5rem] bg-gradient-to-b from-emerald-400/35 via-emerald-500/5 to-transparent blur-[1px]"
            />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl shadow-black/50 ring-1 ring-black/40">
              {/* chrome */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-[#0d1210] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/90" />
                <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                <span className="h-3 w-3 rounded-full bg-green-400/90" />
                <div className="ml-3 hidden items-center gap-2 rounded-md bg-black/40 px-3 py-1 text-xs text-muted-foreground sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  app.mahberix.com/{f.id}
                </div>
              </div>

              <div className="relative bg-[#0b0f0d]">
                {f.image.video ? (
                  <video
                    src={f.image.video}
                    width={f.image.w}
                    height={f.image.h}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label={f.image.alt}
                    className="h-auto w-full"
                  />
                ) : (
                  <Image
                    src={f.image.src}
                    alt={f.image.alt}
                    width={f.image.w}
                    height={f.image.h}
                    sizes="(max-width: 1024px) 100vw, 1100px"
                    className="h-auto w-full"
                  />
                )}
                {/* sheen sweep on view */}
                {!reduce && (
                  <motion.div
                    aria-hidden
                    initial={{ x: "-130%" }}
                    whileInView={{ x: "170%" }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                    className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                )}
              </div>
            </div>

            {/* floating UI badges */}
            {f.overlays}
          </motion.div>
        </motion.div>
      </div>

      {/* connector line to next chapter */}
      {!last && (
        <div aria-hidden className="mx-auto mt-10 h-10 w-px bg-gradient-to-b from-emerald-500/40 to-transparent sm:mt-12" />
      )}
    </div>
  )
}

// Types its text out one character at a time the moment it scrolls into view,
// with a blinking caret. Used for the last two words of the section heading.
function Typewriter({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setN(text.length)
      return
    }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) clearInterval(id)
    }, 95)
    return () => clearInterval(id)
  }, [inView, reduce, text])

  return (
    <span ref={ref} className={className}>
      {text.slice(0, n)}
      <motion.span
        aria-hidden
        animate={reduce ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="ml-0.5 inline-block h-[0.85em] w-[3px] translate-y-[0.12em] rounded-sm bg-emerald-400"
      />
    </span>
  )
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

function FloatBadge({
  className,
  delay,
  icon,
  label,
  value,
  sub,
  ping = false,
  check = false,
}: {
  className: string
  delay: number
  icon: ReactNode
  label: string
  value: string
  sub: string
  ping?: boolean
  check?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, delay, ease }}
      className={`absolute z-10 hidden sm:block ${className}`}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0e1512]/85 px-4 py-2.5 shadow-xl shadow-black/50 backdrop-blur-md"
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
          {icon}
          {ping && (
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1 text-base font-bold tabular-nums text-foreground">
            {check && <BadgeCheck className="h-4 w-4 text-emerald-400" />}
            {value}
          </span>
          <span className="block text-[11px] font-medium text-emerald-300/80">{sub}</span>
        </span>
      </motion.div>
    </motion.div>
  )
}
