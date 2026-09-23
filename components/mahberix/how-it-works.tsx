import { Building2, Users, Rocket } from "lucide-react"

const steps = [
  {
    icon: Building2,
    title: "Create your organization",
    body: "Sign up and spin up your company workspace in minutes. Your data is isolated from every other company on the platform.",
  },
  {
    icon: Users,
    title: "Invite your team",
    body: "Add managers and employees with the right access. Everyone logs in with their email and lands in the right place.",
  },
  {
    icon: Rocket,
    title: "Run your operations",
    body: "Post jobs, track attendance, review performance, pay your team and publish content — all from one dashboard.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Live in an afternoon, not a quarter
          </h2>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 text-5xl font-black tabular-nums text-muted/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950 shadow-sm">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
