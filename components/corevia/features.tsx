import {
  Briefcase,
  Users,
  MapPin,
  BarChart3,
  Wallet,
  Newspaper,
  Sparkles,
  Github,
  Trello,
  Send,
  type LucideIcon,
} from "lucide-react"

type Module = {
  title: string
  body: string
  icon: LucideIcon
  tint: string
  iconColor: string
}

const hiring: Module = {
  title: "Hiring & applicant tracking",
  body: "Post jobs, collect applications, screen with AI-assisted overviews, schedule interviews, hire or send rejections in bulk.",
  icon: Briefcase,
  tint: "from-emerald-500/10 to-transparent",
  iconColor: "text-emerald-400",
}

const employees: Module = {
  title: "Employee management",
  body: "A single source of truth for your team — profiles, roles, documents and connected accounts.",
  icon: Users,
  tint: "from-indigo-500/10 to-transparent",
  iconColor: "text-indigo-400",
}

const attendance: Module = {
  title: "Geofenced attendance",
  body: "Location-based clock-in / clock-out and lunch breaks.",
  icon: MapPin,
  tint: "from-teal-500/10 to-transparent",
  iconColor: "text-teal-400",
}

const performance: Module = {
  title: "Performance & peer reviews",
  body: "Metric scores, review periods and 360° peer reviews with clear results.",
  icon: BarChart3,
  tint: "from-violet-500/10 to-transparent",
  iconColor: "text-violet-400",
}

const payments: Module = {
  title: "Payments & payroll",
  body: "Track what's due, mark payments as paid, and give every employee their own payment history.",
  icon: Wallet,
  tint: "from-amber-500/10 to-transparent",
  iconColor: "text-amber-400",
}

const content: Module = {
  title: "Content: blog & events",
  body: "Publish company blog posts and events straight to your public site — no separate CMS to run.",
  icon: Newspaper,
  tint: "from-rose-500/10 to-transparent",
  iconColor: "text-rose-400",
}

const integrations = [
  { label: "GitHub activity", icon: Github },
  { label: "Trello reports", icon: Trello },
  // { label: "Telegram support", icon: Send },
  { label: "Email notifications", icon: Sparkles },
]

// A fixed floor height keeps the row height constant while a card reflows its
// text on hover, so the cards below never get pushed down.
const cardBase =
  "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-lg sm:basis-0 sm:min-h-[14rem]"

function CardBody({ m }: { m: Module }) {
  return (
    <>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${m.tint}`} aria-hidden />
      <div className="relative">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
          <m.icon className={`h-5 w-5 ${m.iconColor}`} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-foreground">{m.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
      </div>
    </>
  )
}

// A row of two cards where one is wide and one is narrow. Hovering the narrow
// card expands it to the wide width while the other shrinks — with a smooth
// flex-grow transition. `narrowFirst` places the narrow card on the left.
function SwapRow({ wide, narrow, narrowFirst = false }: { wide: Module; narrow: Module; narrowFirst?: boolean }) {
  const wideCard = (
    <article className={`feat-wide ${cardBase} sm:grow-[2] sm:group-has-[.feat-narrow:hover]/row:grow-[1]`}>
      <CardBody m={wide} />
    </article>
  )
  const narrowCard = (
    <article className={`feat-narrow ${cardBase} sm:grow-[1] sm:hover:grow-[2]`}>
      <CardBody m={narrow} />
    </article>
  )
  return (
    <div className="group/row flex flex-col gap-4 sm:flex-row">
      {narrowFirst ? (
        <>
          {narrowCard}
          {wideCard}
        </>
      ) : (
        <>
          {wideCard}
          {narrowCard}
        </>
      )}
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Everything in one place</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Six tools worth of work, one platform
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Stop paying for and stitching together separate apps for hiring, HR, time tracking, reviews, payroll and
            content. Corevia runs them as one connected system.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-4">
          <SwapRow wide={hiring} narrow={employees} />
          <SwapRow wide={performance} narrow={attendance} narrowFirst />
          <SwapRow wide={payments} narrow={content} />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-6">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Plus native integrations to enrich performance data
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {integrations.map((i) => (
              <span
                key={i.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                <i.icon className="h-4 w-4 text-muted-foreground" />
                {i.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
