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
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAdminClientToken } from "@/lib/admin-client-auth"

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manager/profile", label: "Company Profile", icon: Building2 },
  { href: "/manager/blog", label: "Blog", icon: FileText },
  { href: "/manager/jobs", label: "Jobs", icon: Briefcase },
  { href: "/manager/events", label: "Events", icon: CalendarDays },
  { href: "/manager/employees", label: "Employees", icon: Users },
  { href: "/manager/metrics", label: "Reports", icon: BarChart3 },
  { href: "/manager/peer-reviews", label: "Peer Reviews", icon: Star },
  { href: "/manager/payments", label: "Payroll", icon: Wallet },
  { href: "/manager/email-notifications", label: "Email Notifications", icon: Mail },
]

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
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
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
      <div className="mt-auto border-t border-zinc-800 pt-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </Button>
      </div>
    </nav>
  )
}
