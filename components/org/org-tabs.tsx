"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function OrgTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/o/${slug}`
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/jobs`, label: "Jobs" },
    { href: `${base}/blog`, label: "Blog" },
    { href: `${base}/events`, label: "Events" },
  ]

  return (
    <nav className="flex flex-wrap gap-1">
      {tabs.map((t) => {
        const active = t.href === base ? pathname === base : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-500 text-emerald-950"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
