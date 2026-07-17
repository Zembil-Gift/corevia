import Link from "next/link"
import {
  Briefcase,
  MapPin,
  Newspaper,
  CalendarDays,
  ArrowRight,
  Globe,
  Mail,
  Phone,
  Building2,
  Users,
  Factory,
  CalendarClock,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react"
import {
  fetchOrgInfo,
  fetchOrgJobs,
  fetchOrgBlogs,
  fetchOrgEvents,
  type OrgInfo,
} from "@/lib/org-content-api"
import { formatJobEmploymentType } from "@/lib/jobs-api"

function formatDate(iso?: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

function location(org: OrgInfo): string {
  return [org.addressLine, org.city, org.country].filter(Boolean).join(", ")
}

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [org, jobs, blogs, events] = await Promise.all([
    fetchOrgInfo(slug),
    fetchOrgJobs(slug),
    fetchOrgBlogs(slug),
    fetchOrgEvents(slug),
  ])
  // The layout already 404s on a missing org; this guard is just for types.
  if (!org) return null

  const loc = location(org)
  const socials = [
    { href: org.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { href: org.twitterUrl, icon: Twitter, label: "X" },
    { href: org.facebookUrl, icon: Facebook, label: "Facebook" },
    { href: org.instagramUrl, icon: Instagram, label: "Instagram" },
  ].filter((s) => s.href)

  const facts = [
    org.industry && { icon: Factory, label: "Industry", value: org.industry },
    org.businessType && { icon: Building2, label: "Business type", value: org.businessType },
    org.companySize && { icon: Users, label: "Company size", value: `${org.companySize} employees` },
    org.foundedYear && { icon: CalendarClock, label: "Founded", value: String(org.foundedYear) },
    loc && { icon: MapPin, label: "Location", value: loc },
  ].filter(Boolean) as { icon: typeof Factory; label: string; value: string }[]

  const contacts = [
    org.websiteUrl && { icon: Globe, label: org.websiteUrl.replace(/^https?:\/\//, ""), href: org.websiteUrl },
    org.companyEmail && { icon: Mail, label: org.companyEmail, href: `mailto:${org.companyEmail}` },
    org.phone && { icon: Phone, label: org.phone, href: `tel:${org.phone}` },
  ].filter(Boolean) as { icon: typeof Globe; label: string; href: string }[]

  const sectionNav = [
    { id: "about", label: "About", show: true },
    { id: "jobs", label: "Jobs", show: jobs.length > 0 },
    { id: "blog", label: "Blog", show: blogs.length > 0 },
    { id: "events", label: "Events", show: events.length > 0 },
  ].filter((s) => s.show)

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          {org.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(60% 120% at 20% 0%, rgba(16,185,129,0.25), transparent 60%), radial-gradient(50% 120% at 90% 10%, rgba(163,230,53,0.18), transparent 60%), #0a0c0b",
              }}
            />
          )}

          {socials.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20">
              <div className="mx-auto flex max-w-5xl justify-end gap-2 px-6">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="pointer-events-auto grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-black/40 text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-black/60 hover:text-emerald-300 hover:shadow-[0_0_16px_rgba(16,185,129,0.75)]"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-24 w-24 rounded-2xl border-4 border-background bg-card object-cover shadow-xl sm:h-28 sm:w-28"
              />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-background bg-emerald-500/15 text-3xl font-bold text-emerald-400 shadow-xl sm:h-28 sm:w-28">
                {org.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1 pb-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{org.name}</h1>
              {org.tagline && <p className="mt-1 text-lg text-muted-foreground">{org.tagline}</p>}
            </div>
            {jobs.length > 0 && (
              <a
                href="#jobs"
                className="inline-flex items-center gap-1.5 self-start rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 sm:self-auto"
              >
                <Briefcase className="h-4 w-4" /> {jobs.length} open role{jobs.length > 1 ? "s" : ""}
              </a>
            )}
          </div>

          {/* quick facts row */}
          {facts.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {facts.map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1.5">
                  <f.icon className="h-4 w-4 text-emerald-400" /> {f.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section nav */}
      {sectionNav.length > 1 && (
        <nav className="sticky top-[57px] z-30 mt-8 border-y border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl gap-1 px-6 py-2">
            {sectionNav.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        {/* About */}
        <section id="about" className="scroll-mt-28 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div>
            <h2 className="text-xl font-semibold text-foreground">About {org.name}</h2>
            {org.description ? (
              <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {org.description}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {org.name} hasn&apos;t added a description yet.
              </p>
            )}
          </div>

          <aside className="space-y-6">
            {contacts.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                <ul className="mt-3 space-y-2.5">
                  {contacts.map((c) => (
                    <li key={c.label}>
                      <a
                        href={c.href}
                        target={c.href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2.5 text-sm text-foreground hover:text-emerald-400"
                      >
                        <c.icon className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span className="break-all">{c.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </section>

        {/* Jobs */}
        {jobs.length > 0 && (
          <ProfileSection
            id="jobs"
            icon={Briefcase}
            title="Open positions"
            count={jobs.length}
            allHref={`/o/${slug}/jobs`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.slice(0, 6).map((job) => (
                <Link
                  key={job.id}
                  href={`/o/${slug}/jobs/${job.slug}`}
                  className="flex min-h-[12rem] flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      {formatJobEmploymentType(job.employmentType)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {job.department && (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                    )}
                    {job.createdAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" /> Posted {formatDate(job.createdAt)}
                      </span>
                    )}
                  </div>
                  {job.description && (
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {job.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Blog */}
        {blogs.length > 0 && (
          <ProfileSection
            id="blog"
            icon={Newspaper}
            title="Blogs"
            count={blogs.length}
            allHref={`/o/${slug}/blog`}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.slice(0, 3).map((post) => (
                <Link
                  key={post.id}
                  href={`/o/${slug}/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-emerald-500/40"
                >
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImageUrl} alt="" className="h-36 w-full object-cover" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {post.publishedAt && (
                      <p className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
                    )}
                    <h3 className="mt-1 font-semibold text-foreground group-hover:text-emerald-400">{post.title}</h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Events */}
        {events.length > 0 && (
          <ProfileSection
            id="events"
            icon={CalendarDays}
            title="Events"
            count={events.length}
            allHref={`/o/${slug}/events`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {events.slice(0, 4).map((ev) => (
                <Link
                  key={ev.id}
                  href={`/o/${slug}/events/${ev.slug}`}
                  className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground">{ev.title}</h3>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      {ev.eventType === "ONLINE" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {ev.eventType === "ONLINE" ? "Online" : "In person"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {ev.startDate && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" /> {formatDate(ev.startDate)}
                      </span>
                    )}
                    {ev.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {ev.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </ProfileSection>
        )}
      </div>
    </>
  )
}

function ProfileSection({
  id,
  icon: Icon,
  title,
  count,
  allHref,
  children,
}: {
  id: string
  icon: typeof Briefcase
  title: string
  count: number
  allHref: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
          <Icon className="h-5 w-5 text-emerald-400" /> {title}
        </h2>
        {count > 3 && (
          <Link href={allHref} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300">
            View all {count} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
