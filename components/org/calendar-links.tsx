"use client"

import { useState } from "react"
import { CalendarPlus, Check, Copy, Download } from "lucide-react"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? ""

export const eventsFeedUrl = (orgSlug: string) => `${CMS_BASE_URL}/public/${encodeURIComponent(orgSlug)}/events.ics`

const linkClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-emerald-500/50 hover:text-emerald-300"

/** Subscribe links for the org's events feed; calendar apps re-fetch it, so new events show up on their own. */
export function SubscribeCalendarLinks({ orgSlug, orgName }: { orgSlug: string; orgName?: string }) {
  const [copied, setCopied] = useState(false)
  const feed = eventsFeedUrl(orgSlug)
  const webcal = feed.replace(/^https?:\/\//, "webcal://")
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feed)}&name=${encodeURIComponent(
    `${orgName ?? "Company"} events`,
  )}`

  const copy = async () => {
    await navigator.clipboard.writeText(feed)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={google} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <CalendarPlus className="size-3.5" aria-hidden /> Google Calendar
      </a>
      <a href={outlook} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <CalendarPlus className="size-3.5" aria-hidden /> Outlook
      </a>
      <a href={webcal} className={linkClass}>
        <CalendarPlus className="size-3.5" aria-hidden /> Apple Calendar
      </a>
      <button type="button" onClick={copy} className={linkClass}>
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy feed URL"}
      </button>
    </div>
  )
}

const googleDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")

type CalendarEvent = {
  slug: string
  title: string
  description?: string | null
  location?: string | null
  startDate: string
  endDate?: string | null
}

/** One event: .ics download (any calendar app) or a pre-filled Google Calendar entry. */
export function AddToCalendarLinks({ orgSlug, event }: { orgSlug: string; event: CalendarEvent }) {
  const end = event.endDate ?? new Date(new Date(event.startDate).getTime() + 3600_000).toISOString()
  const google =
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${googleDate(event.startDate)}/${googleDate(end)}`,
      details: (event.description ?? "").slice(0, 1500),
      location: event.location ?? "",
    }).toString()
  const ics = `${CMS_BASE_URL}/public/${encodeURIComponent(orgSlug)}/events/${encodeURIComponent(event.slug)}/calendar.ics`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={google} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <CalendarPlus className="size-3.5" aria-hidden /> Add to Google Calendar
      </a>
      <a href={ics} className={linkClass}>
        <Download className="size-3.5" aria-hidden /> Download .ics
      </a>
    </div>
  )
}
