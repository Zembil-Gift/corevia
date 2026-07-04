import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  ExternalLink,
} from "lucide-react"
import Image from "next/image"
import { fetchEventBySlug } from "@/lib/events-api"
import { formatEventDate } from "@/lib/event-data"
import { Footer } from "@/components/afrodebab/footer"

interface EventDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)
  if (!event || event.status !== "PUBLISHED") return { title: "Event not found" }
  return {
    title: `${event.title} | AfroDebab Events`,
    description: event.description,
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)

  if (!event || event.status !== "PUBLISHED") {
    notFound()
  }

  const isOnline = event.eventType === "ONLINE"
  const imageUrl = event.coverImageUrl || "/placeholder.svg"
  const isExternalImage = imageUrl.startsWith("http")

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
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Link>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16">
        <article>
          <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-muted/30 mb-8">
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              unoptimized={isExternalImage}
            />
          </div>
          <header className="mb-8">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
                isOnline
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/20 text-secondary-foreground"
              }`}
            >
              {isOnline ? (
                <Video className="size-4" />
              ) : (
                <Users className="size-4" />
              )}
              {isOnline ? "Online" : "In-person"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              {event.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {event.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 p-5 rounded-2xl bg-card border border-border/50">
              <div className="flex items-start gap-3">
                <Calendar className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Date & time</p>
                  <p className="text-muted-foreground">
                    {formatEventDate(event.startDate, event.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
            >
              Register for this event
              <ExternalLink className="size-4" />
            </a>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium border border-border bg-background hover:bg-muted/50 transition-colors"
            >
              View all events
            </Link>
          </div>
        </article>

        <div className="mt-12 pt-8 border-t border-border/50">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to all events
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
