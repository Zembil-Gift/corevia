"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
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
  ShieldCheck,
  Trello,
  Settings,
  LogOut,
  Megaphone,
  Bell,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LangToggle } from "@/components/mahberix/lang-toggle"
import { useLang, pick } from "@/lib/i18n"
import { clearAdminClientToken, isViceManagerClient } from "@/lib/admin-client-auth"
import { useUnreadCount } from "@/components/notifications/use-unread-count"

const allNavItems: { href: string; label: { en: string; am: string }; icon: LucideIcon; managerOnly?: boolean }[] = [
  { href: "/manager", label: { en: "Dashboard", am: "ዳሽቦርድ" }, icon: LayoutDashboard },
  { href: "/manager/profile", label: { en: "Company Profile", am: "የኩባንያ መገለጫ" }, icon: Building2, managerOnly: true },
  { href: "/manager/sub-organizations", label: { en: "Branches & Sub-Orgs", am: "ቅርንጫፎች" }, icon: Building2, managerOnly: true },
  { href: "/manager/vice-managers", label: { en: "Vice Managers", am: "ምክትል ስራ አስኪያጆች" }, icon: ShieldCheck, managerOnly: true },
  { href: "/manager/blog", label: { en: "Blog", am: "ብሎግ" }, icon: FileText, managerOnly: true },
  { href: "/manager/jobs", label: { en: "Jobs", am: "ስራዎች" }, icon: Briefcase, managerOnly: true },
  { href: "/manager/events", label: { en: "Events", am: "ዝግጅቶች" }, icon: CalendarDays, managerOnly: true },
  { href: "/manager/employees", label: { en: "Employees", am: "ሰራተኞች" }, icon: Users },
  { href: "/manager/metrics", label: { en: "Reports", am: "ሪፖርቶች" }, icon: BarChart3 },
  { href: "/manager/peer-reviews", label: { en: "Peer Reviews", am: "የእኩዮች ግምገማ" }, icon: Star },
  { href: "/manager/payments", label: { en: "Payroll", am: "ደመወዝ" }, icon: Wallet },
  { href: "/manager/broadcasts", label: { en: "Broadcasts", am: "ማስታወቂያዎች" }, icon: Megaphone },
  { href: "/manager/notifications", label: { en: "Notifications", am: "ማሳወቂያዎች" }, icon: Bell },
  { href: "/manager/email-notifications", label: { en: "Email Notifications", am: "የኢሜይል ማሳወቂያ" }, icon: Mail, managerOnly: true },
  { href: "/manager/integrations", label: { en: "Integrations", am: "ውህደቶች" }, icon: Trello },
  { href: "/manager/settings", label: { en: "Settings", am: "ቅንብሮች" }, icon: Settings, managerOnly: true },
]

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { lang } = useLang()
  const pathname = usePathname()
  const [isVice, setIsVice] = useState(false)
  const unread = useUnreadCount("manager")

  useEffect(() => {
    setIsVice(isViceManagerClient())
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    clearAdminClientToken()
    window.location.href = "/login"
  }

  const navItems = isVice ? allNavItems.filter((i) => !i.managerOnly) : allNavItems

  return (
    <nav className="flex min-h-0 flex-1 flex-col p-3">
      {/* Links scroll on short screens so the language toggle and Log out stay reachable. */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
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
            {item.href === "/manager/notifications" && unread > 0 && (
              <span className="ml-auto rounded-full bg-[#e78a53] px-1.5 text-[11px] font-semibold text-white" aria-label={`${unread} unread`}>
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        )
      })}
      </div>
      <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-zinc-800 pt-3">
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
