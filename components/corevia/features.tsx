import {
  Building2,
  Newspaper,
  Briefcase,
  Users,
  MapPin,
  BarChart3,
  Wallet,
  LineChart,
  Github,
  Trello,
  Mail,
  type LucideIcon,
} from "lucide-react"

type Feature = { title: string; body: string; icon: LucideIcon }

const features: Feature[] = [
  { title: "Company profile", body: "Branded public page in minutes.", icon: Building2 },
  { title: "Blog & events", body: "Publish posts and events to your site.", icon: Newspaper },
  { title: "Hiring & ATS", body: "Post jobs, screen with AI, hire in bulk.", icon: Briefcase },
  { title: "Employee management", body: "Profiles, roles and documents in one place.", icon: Users },
  { title: "Geofenced attendance", body: "GPS clock-in, clock-out and lunch breaks.", icon: MapPin },
  { title: "Performance & peer reviews", body: "360° reviews with clear scores.", icon: BarChart3 },
  { title: "Payments & payroll", body: "See what's due, mark paid, keep history.", icon: Wallet },
  { title: "Employee reports", body: "Reviews, attendance, Trello & GitHub in one view.", icon: LineChart },
]

const integrations = [
  { label: "GitHub", icon: Github },
  { label: "Trello", icon: Trello },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Everything included</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            One platform, every tool your company runs on
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
                <f.icon className="h-5 w-5 text-emerald-400" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Connects with</span>
          {integrations.map((i) => (
            <span
              key={i.label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
            >
              <i.icon className="h-4 w-4 text-muted-foreground" />
              {i.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
