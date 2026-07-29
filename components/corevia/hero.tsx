"use client"

import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { useLang, pick } from "@/lib/i18n"
import { HeroPreview } from "./hero-preview"

const copy = {
  badge: { en: "All-in-one company operations", am: "የተቋም ስራዎች በአንድ ቦታ" },
  headlinePrefix: { en: "One platform to run your ", am: "አንድ መድረክ ለ" },
  subtitle: {
    en: "Hiring, employees, attendance, performance, payments and content. Corevia gives every company one operations platform, without stitching six tools together.",
    am: "ቅጥር፣ ሰራተኞች፣ መገኘት፣ አፈጻጸም፣ ክፍያዎች እና ይዘት። Corevia ለእያንዳንዱ ኩባንያ ስድስት መሳሪያዎችን ሳያገናኙ አንድ የስራ መድረክ ይሰጣል።",
  },
  startTrial: { en: "Start free trial", am: "ነጻ ሙከራ ጀምር" },
  seeHow: { en: "See how it works", am: "እንዴት እንደሚሰራ ይመልከቱ" },
}

// The word that morphs inside the headline — each maps to a product module.
const morphWords = {
  en: ["hiring", "payroll", "attendance", "business", "whole team"],
  am: ["ቅጥር", "ክፍያ", "መገኘት", "ንግድ", "ሙሉ ቡድን"],
}

const bullets = {
  en: ["31-day free trial", "No credit card"],
  am: ["ለ31 ቀናት ነጻ ሙከራ", "ክሬዲት ካርድ አያስፈልግም"],
}

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const { lang } = useLang()
  const words = pick(lang, morphWords)
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setI((v) => (v + 1) % words.length), 2200)
    return () => clearInterval(id)
  }, [reduce, words.length])

  return (
    <section className="relative overflow-hidden">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -5%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(40% 40% at 85% 10%, rgba(163,230,53,0.08), transparent 60%)",
        }}
      />
      {/* Faint grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 55% at 50% 0%, #000 40%, transparent 100%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {pick(lang, copy.badge)}
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl"
          >
            {pick(lang, copy.headlinePrefix)}
            <span className="relative inline-grid overflow-hidden text-left align-bottom">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={words[i]}
                  initial={reduce ? false : { y: "100%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease }}
                  className="col-start-1 row-start-1 pr-1 text-emerald-400"
                >
                  {words[i]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            {pick(lang, copy.subtitle)}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 sm:w-auto"
            >
              {pick(lang, copy.startTrial)}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#showcase"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              {pick(lang, copy.seeHow)}
            </a>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.34 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {pick(lang, bullets).map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {b}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="mt-16 sm:mt-20">
          <HeroPreview />
        </div>
      </div>
    </section>
  )
}
