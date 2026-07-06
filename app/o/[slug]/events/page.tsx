import Link from "next/link"
import { MapPin, CalendarDays, Globe } from "lucide-react"
import { fetchOrgEvents } from "@/lib/org-content-api"
import { OrgSubShell } from "@/components/org/org-subpage"

export default async function OrgEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const events = await fetchOrgEvents(slug)

  return (
    <OrgSubShell slug={slug} title="Events">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published events yet.</p>
      ) : (
        <div className="space-y-3">
      {events.map((ev) => (
        <Link
          key={ev.id}
          href={`/o/${slug}/events/${ev.slug}`}
          className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-500/40"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{ev.title}</h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              {ev.eventType === "ONLINE" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {ev.eventType === "ONLINE" ? "Online" : "In person"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {ev.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(ev.startDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {ev.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {ev.location}
              </span>
            )}
          </div>
          {ev.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
          )}
            </Link>
          ))}
        </div>
      )}
    </OrgSubShell>
  )
}
