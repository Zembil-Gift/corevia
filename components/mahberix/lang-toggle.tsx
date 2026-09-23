"use client"

import { Languages } from "lucide-react"
import { useLang, type Lang } from "@/lib/i18n"

const options: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "am", label: "አማ" },
]

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang()

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-background/60 p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      <Languages className="ml-1.5 h-4 w-4 text-muted-foreground" aria-hidden />
      {options.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLang(o.code)}
          aria-pressed={lang === o.code}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            lang === o.code
              ? "bg-emerald-500 text-emerald-950"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
