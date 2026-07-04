import Link from "next/link"
import { Briefcase, Newspaper, CalendarDays, ArrowRight } from "lucide-react"
import { fetchOrgJobs, fetchOrgBlogs, fetchOrgEvents } from "@/lib/org-content-api"

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [jobs, blogs, events] = await Promise.all([
    fetchOrgJobs(slug),
    fetchOrgBlogs(slug),
    fetchOrgEvents(slug),
  ])

  const cards = [
    {
      href: `/o/${slug}/jobs`,
      label: "Open positions",
      value: jobs.length,
      icon: Briefcase,
      cta: "Browse jobs",
    },
    {
      href: `/o/${slug}/blog`,
      label: "Published articles",
      value: blogs.length,
      icon: Newspaper,
      cta: "Read the blog",
    },
    {
      href: `/o/${slug}/events`,
      label: "Upcoming & past events",
      value: events.length,
      icon: CalendarDays,
      cta: "See events",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-emerald-500/40"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <c.icon className="h-5 w-5" />
          </span>
          <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">{c.value}</p>
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
            {c.cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  )
}
