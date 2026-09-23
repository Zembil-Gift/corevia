"use client"

import {
  Building2,
  Newspaper,
  Briefcase,
  Users,
  MapPin,
  BarChart3,
  Wallet,
  LineChart,
  Github,
  Trello,
  type LucideIcon,
} from "lucide-react"
import { useLang, pick } from "@/lib/i18n"

type Copy = { title: string; body: string }
type Feature = { icon: LucideIcon; en: Copy; am: Copy }

const heading = {
  eyebrow: { en: "Everything included", am: "ሁሉም ተካትቷል" },
  title: {
    en: "One platform, every tool your company runs on",
    am: "አንድ መድረክ፣ ኩባንያዎ የሚጠቀምባቸው ሁሉም መሳሪያዎች",
  },
  connects: { en: "Connects with", am: "ይገናኛል ከ" },
}

const features: Feature[] = [
  { icon: Building2, en: { title: "Company profile", body: "Branded public page in minutes." }, am: { title: "የኩባንያ መገለጫ", body: "በደቂቃዎች ውስጥ የግል የህዝብ ገጽ።" } },
  { icon: Newspaper, en: { title: "Blog & events", body: "Publish posts and events to your site." }, am: { title: "ብሎግ እና ዝግጅቶች", body: "ጽሁፎችን እና ዝግጅቶችን ወደ ጣቢያዎ ያውጡ።" } },
  { icon: Briefcase, en: { title: "Hiring & ATS", body: "Post jobs, screen with AI, hire in bulk." }, am: { title: "ቅጥር እና ATS", body: "ስራዎችን ይለጥፉ፣ በAI ይምረጡ፣ በጅምላ ይቅጠሩ።" } },
  { icon: Users, en: { title: "Employee management", body: "Profiles, roles and documents in one place." }, am: { title: "የሰራተኛ አስተዳደር", body: "መገለጫዎች፣ ሚናዎች እና ሰነዶች በአንድ ቦታ።" } },
  { icon: MapPin, en: { title: "Geofenced attendance", body: "GPS clock-in, clock-out and lunch breaks." }, am: { title: "በጂኦ የተከለለ መገኘት", body: "በጂፒኤስ መግቢያ፣ መውጫ እና የምሳ እረፍት።" } },
  { icon: BarChart3, en: { title: "Performance & peer reviews", body: "360° reviews with clear scores." }, am: { title: "አፈጻጸም እና የእኩዮች ግምገማ", body: "ግልጽ ውጤት ያለው የ360° ግምገማ።" } },
  { icon: Wallet, en: { title: "Payments & payroll", body: "See what's due, mark paid, keep history." }, am: { title: "ክፍያዎች እና ደመወዝ", body: "የሚከፈለውን ይመልከቱ፣ እንደተከፈለ ምልክት ያድርጉ፣ ታሪክ ይያዙ።" } },
  { icon: LineChart, en: { title: "Employee reports", body: "Reviews, attendance, Trello & GitHub in one view." }, am: { title: "የሰራተኛ ሪፖርቶች", body: "ግምገማ፣ መገኘት፣ Trello እና GitHub በአንድ እይታ።" } },
]

const integrations = [
  { label: "GitHub", icon: Github },
  { label: "Trello", icon: Trello },
]

export function Features() {
  const { lang } = useLang()
  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">{pick(lang, heading.eyebrow)}</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {pick(lang, heading.title)}
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const c = pick(lang, f)
            return (
              <article
                key={f.en.title}
                className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
                  <f.icon className="h-5 w-5 text-emerald-400" />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{pick(lang, heading.connects)}</span>
          {integrations.map((i) => (
            <span
              key={i.label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
            >
              <i.icon className="h-4 w-4 text-muted-foreground" />
              {i.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
