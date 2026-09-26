"use client"

import { useEffect, useState } from "react"
import { CalendarDays } from "lucide-react"
import { SubscribeCalendarLinks } from "@/components/org/calendar-links"

export function CompanyCalendarCard() {
  const [org, setOrg] = useState<{ slug: string; name: string } | null>(null)

  useEffect(() => {
    fetch("/api/employee/me/organization", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.slug && setOrg({ slug: d.slug, name: d.name }))
      .catch(() => {})
  }, [])

  if (!org) return null
  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <CalendarDays className="size-4" aria-hidden /> Company events calendar
      </h2>
      <p className="mb-3 mt-1 text-sm text-zinc-400">
        Subscribe once and {org.name}&apos;s events appear in your calendar, including new and changed ones.
      </p>
      <SubscribeCalendarLinks orgSlug={org.slug} orgName={org.name} />
    </section>
  )
}
