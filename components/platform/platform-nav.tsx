"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, PlusCircle, Inbox, Scale, LogOut } from "lucide-react"
import { Logo } from "@/components/corevia/logo"
import { LangToggle } from "@/components/corevia/lang-toggle"
import { useLang, pick } from "@/lib/i18n"

const links = [
  { href: "/platform", label: { en: "Overview", am: "አጠቃላይ እይታ" }, icon: LayoutDashboard, exact: true },
  { href: "/platform/organizations", label: { en: "Organizations", am: "ድርጅቶች" }, icon: Building2 },
  { href: "/platform/requests", label: { en: "Signup requests", am: "የምዝገባ ጥያቄዎች" }, icon: Inbox },
  { href: "/platform/principles", label: { en: "Leadership principles", am: "የአመራር መርሆዎች" }, icon: Scale },
  { href: "/platform/register", label: { en: "Register organization", am: "ድርጅት ይመዝግቡ" }, icon: PlusCircle },
]

export function PlatformNav() {
  const { lang } = useLang()
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    router.push("/login")
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-60 flex-col border-r border-border bg-[#0f1412]">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/platform" aria-label="Platform home">
          <Logo />
        </Link>
      </div>

      <div className="px-3 pt-3">
        <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
          {pick(lang, { en: "Platform admin", am: "የመድረክ አስተዳዳሪ" })}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Platform">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-500 text-emerald-950"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <l.icon className="h-4 w-4 shrink-0" />
              {pick(lang, l.label)}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <LangToggle className="w-full justify-start" />
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {pick(lang, { en: "Sign out", am: "ውጣ" })}
        </button>
      </div>
    </aside>
  )
}
