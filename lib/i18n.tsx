"use client"

// Minimal i18n: just a shared `lang` flag + setter, persisted to localStorage.
// Components keep their own { en, am } copy dicts and pick with `pick(lang, ...)`.
// ponytail: no i18n library — a context flag is all the app needs. Add
// next-intl only if we need routed locales (/am/...) or server-side messages.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Lang = "en" | "am"

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  // Read saved choice after mount (avoids hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem("lang")
    if (saved === "am" || saved === "en") setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem("lang", l)
  }

  // Keep <html lang> in sync for a11y / correct font shaping.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

// Pick a value by current lang. Falls back to English if a translation is missing.
export function pick<T>(lang: Lang, dict: { en: T; am?: T }): T {
  return (lang === "am" ? dict.am : dict.en) ?? dict.en
}
