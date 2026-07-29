"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  CalendarDays,
  Users,
  BarChart3,
  Star,
  Wallet,
  Mail,
  Building2,
  Trello,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LangToggle } from "@/components/corevia/lang-toggle"
import { useLang, pick } from "@/lib/i18n"
import { clearAdminClientToken } from "@/lib/admin-client-auth"

const navItems: { href: string; label: { en: string; am: string }; icon: LucideIcon }[] = [
  { href: "/manager", label: { en: "Dashboard", am: "ዳሽቦርድ" }, icon: LayoutDashboard },
  { href: "/manager/profile", label: { en: "Company Profile", am: "የኩባንያ መገለጫ" }, icon: Building2 },
  { href: "/manager/blog", label: { en: "Blog", am: "ብሎግ" }, icon: FileText },
  { href: "/manager/jobs", label: { en: "Jobs", am: "ስራዎች" }, icon: Briefcase },
  { href: "/manager/events", label: { en: "Events", am: "ዝግጅቶች" }, icon: CalendarDays },
  { href: "/manager/employees", label: { en: "Employees", am: "ሰራተኞች" }, icon: Users },
  { href: "/manager/metrics", label: { en: "Reports", am: "ሪፖርቶች" }, icon: BarChart3 },
  { href: "/manager/peer-reviews", label: { en: "Peer Reviews", am: "የእኩዮች ግምገማ" }, icon: Star },
  { href: "/manager/payments", label: { en: "Payroll", am: "ደመወዝ" }, icon: Wallet },
  { href: "/manager/email-notifications", label: { en: "Email Notifications", am: "የኢሜይል ማሳወቂያ" }, icon: Mail },
  { href: "/manager/integrations", label: { en: "Integrations", am: "ውህደቶች" }, icon: Trello },
]

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { lang } = useLang()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    clearAdminClientToken()
    window.location.href = "/login"
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/manager" && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#e78a53]/15 text-[#e78a53]"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{pick(lang, item.label)}</span>
          </Link>
        )
      })}
      <div className="mt-auto flex flex-col gap-2 border-t border-zinc-800 pt-3">
        <LangToggle className="self-start" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {pick(lang, { en: "Log out", am: "ውጣ" })}
        </Button>
      </div>
    </nav>
  )
}
