"use client"

import Link from "next/link"
import { brand } from "@/lib/brand"
import { useLang, pick, type Lang } from "@/lib/i18n"
import { Logo } from "./logo"

type Col = { title: string; links: { label: string; href: string }[] }

const columns: (lang: Lang) => Col[] = (lang) => [
  {
    title: pick(lang, { en: "Product", am: "ምርት" }),
    links: [
      { label: pick(lang, { en: "Features", am: "ገጽታዎች" }), href: "#features" },
      { label: pick(lang, { en: "Tour", am: "ጉብኝት" }), href: "#showcase" },
      { label: pick(lang, { en: "FAQ", am: "ተደጋጋሚ ጥያቄ" }), href: "#faq" },
    ],
  },
  {
    title: pick(lang, { en: "Platform", am: "መድረክ" }),
    links: [
      { label: pick(lang, { en: "Sign in", am: "ግባ" }), href: "/login" },
      { label: pick(lang, { en: "Start free", am: "በነጻ ጀምር" }), href: "/signup" },
      { label: pick(lang, { en: "Jobs", am: "ስራዎች" }), href: "/jobs" },
      { label: pick(lang, { en: "Blog", am: "ብሎግ" }), href: "/blog" },
    ],
  },
  {
    title: pick(lang, { en: "Company", am: "ኩባንያ" }),
    links: [
      { label: pick(lang, { en: "Events", am: "ዝግጅቶች" }), href: "/events" },
      { label: `${pick(lang, { en: "Contact", am: "አግኙን" })}: ${brand.email}`, href: `mailto:${brand.email}` },
    ],
  },
]

const misc = {
  tagline: { en: "Run your whole company from one platform", am: "ሙሉ ኩባንያዎን ከአንድ መድረክ ያንቀሳቅሱ" },
  rights: { en: "All rights reserved.", am: "መብቱ በህግ የተጠበቀ ነው።" },
  built: {
    en: "Built for companies that want one platform, not six.",
    am: "ስድስት ሳይሆን አንድ መድረክ ለሚፈልጉ ኩባንያዎች የተሰራ።",
  },
}

export function SiteFooter() {
  const { lang } = useLang()
  return (
    <footer className="border-t border-border bg-[#080b0a] text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="[&_span]:text-white">
              <Logo />
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate-400">{pick(lang, misc.tagline)}.</p>
          </div>

          {columns(lang).map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {brand.name}. {pick(lang, misc.rights)}
          </p>
          <p className="text-xs text-slate-500">{pick(lang, misc.built)}</p>
        </div>
      </div>
    </footer>
  )
}
