import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, CalendarDays, Globe } from "lucide-react"
import { fetchOrgEventBySlug, fetchOrgInfo } from "@/lib/org-content-api"

function formatDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function OrgEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventSlug: string }>
}) {
  const { slug, eventSlug } = await params
  const [ev, org] = await Promise.all([
    fetchOrgEventBySlug(slug, eventSlug),
    fetchOrgInfo(slug),
  ])
  if (!ev) notFound()

  const start = formatDate(ev.startDate)
  const end = formatDate(ev.endDate)

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/o/${slug}#events`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {org?.name ?? "company"}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{ev.title}</h1>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          {ev.eventType === "ONLINE" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {ev.eventType === "ONLINE" ? "Online" : "In person"}
        </span>
        {start && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {start}
            {end && ` – ${end}`}
          </span>
        )}
        {ev.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {ev.location}
          </span>
        )}
      </div>

      {ev.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.coverImageUrl} alt="" className="mt-6 w-full rounded-xl object-cover" />
      )}

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {ev.description}
      </div>

      {ev.registrationUrl && (
        <a
          href={ev.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          Register
        </a>
      )}
    </article>
  )
}
