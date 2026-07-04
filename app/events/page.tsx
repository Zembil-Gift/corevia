"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Video,
  Users,
  Loader2,
} from "lucide-react"
import { fetchEvents, type EventApi, type EventSortBy, type EventSortDirection } from "@/lib/events-api"
import { formatEventDateShort } from "@/lib/event-data"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/afrodebab/footer"

const PAGE_SIZE = 6
const SORT_OPTIONS: { value: EventSortBy; label: string }[] = [
  { value: "startDate", label: "Date" },
  { value: "title", label: "Title" },
  { value: "endDate", label: "End date" },
]

export default function EventsPage() {
  const [page, setPage] = useState(1)
  const [size] = useState(PAGE_SIZE)
  const [sortBy, setSortBy] = useState<EventSortBy>("startDate")
  const [direction, setDirection] = useState<EventSortDirection>("asc")
  const [data, setData] = useState<{
    content: EventApi[]
    totalPages: number
    totalElements: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/events?page=${page - 1}&size=${size}&sortBy=${encodeURIComponent(sortBy)}&direction=${direction}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to load events: ${res.status}`)
      }
      const json = await res.json()
      setData({
        content: json.content,
        totalPages: json.totalPages,
        totalElements: json.totalElements,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, size, sortBy, direction])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const events = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED")

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74, 148, 115, 0.08), transparent 60%)",
        }}
      />

      <header className="sticky top-4 z-[9999] mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg max-w-5xl px-4 py-2 mt-4">
        <Link
          className="flex items-center justify-center gap-3"
          href="/"
        >
          <Image
            src="/afrodebab-logo.png"
            alt="AfroDebab"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-semibold text-foreground tracking-tight">
            AfroDebab
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
            Events
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Meetups, launches, and tech events. Join us online or in person.
          </p>
        </div>

        {/* Sort controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as EventSortBy)
              setPage(1)
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDirection((d) => (d === "asc" ? "desc" : "asc"))
              setPage(1)
            }}
            className="rounded-full"
          >
            {direction === "asc" ? "Oldest first" : "Newest first"}
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm mb-8 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading events…</p>
          </div>
        ) : publishedEvents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No events at the moment. Check back later.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {publishedEvents.map((event) => {
                const imageUrl = event.coverImageUrl || "/placeholder.svg"
                const isExternalImage = imageUrl.startsWith("http")
                const isOnline = event.eventType === "ONLINE"
                return (
                  <article
                    key={event.id}
                    className="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/30">
                      <Image
                        src={imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={isExternalImage}
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5 md:p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isOnline
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary/20 text-secondary-foreground"
                          }`}
                        >
                          {isOnline ? (
                            <Video className="size-3" />
                          ) : (
                            <Users className="size-3" />
                          )}
                          {isOnline ? "Online" : "In-person"}
                        </span>
                      </div>
                      <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h2>
                      <p className="text-muted-foreground text-sm md:text-base line-clamp-3 flex-1 mb-4">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="size-4 mt-0.5 shrink-0 text-primary/70" />
                          <span>{formatEventDateShort(event.startDate)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="size-4 mt-0.5 shrink-0 text-primary/70" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                      <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all"
                      >
                        View details & register
                        <ArrowRight className="size-4 shrink-0" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            {totalPages > 1 && (
              <nav
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 md:mt-16"
                aria-label="Events pagination"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    aria-label="Previous page"
                    className="rounded-full"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="flex items-center gap-1 px-4 text-sm text-muted-foreground min-w-[120px] justify-center">
                    Page{" "}
                    <span className="font-medium text-foreground">{page}</span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{totalPages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    aria-label="Next page"
                    className="rounded-full"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                {totalElements > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {totalElements} event{totalElements !== 1 ? "s" : ""} total
                  </p>
                )}
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
