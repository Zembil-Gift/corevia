"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { brand } from "@/lib/brand"
import { useLang, pick } from "@/lib/i18n"
import { Logo } from "./logo"
import { LangToggle } from "./lang-toggle"

// Nav hrefs stay in brand.nav; labels are translated here by index.
const navLabels = {
  en: ["Features", "Tour", "FAQ"],
  am: ["ገጽታዎች", "ጉብኝት", "ተደጋጋሚ ጥያቄ"],
}
const copy = {
  signIn: { en: "Sign in", am: "ግባ" },
  startFree: { en: "Start free", am: "በነጻ ጀምር" },
}

export function SiteHeader() {
  const { lang } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={`${brand.name} home`} className="cursor-pointer">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {brand.nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {pick(lang, { en: navLabels.en[i], am: navLabels.am[i] })}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LangToggle />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {pick(lang, copy.signIn)}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            {pick(lang, copy.startFree)}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {brand.nav.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {pick(lang, { en: navLabels.en[i], am: navLabels.am[i] })}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
              <LangToggle className="self-start" />
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-3 text-center text-base font-semibold text-foreground"
              >
                {pick(lang, copy.signIn)}
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-emerald-500 px-4 py-3 text-center text-base font-semibold text-emerald-950"
              >
                {pick(lang, copy.startFree)}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
