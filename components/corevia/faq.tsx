const faqs = [
  {
    q: "Is my company's data isolated from other companies?",
    a: "Yes. Corevia is multi-tenant by design — every organization's data is scoped to its own tenant, so companies never see each other's employees, jobs, or reports.",
  },
  {
    q: "Do employees and managers log in separately?",
    a: "Everyone signs in with their email and password. Corevia resolves the right organization and role automatically, then routes managers and employees to the correct dashboard.",
  },
  {
    q: "Can we publish our jobs and blog to our own site?",
    a: "Yes. Your jobs, blog posts, and events are exposed on public pages for your organization, so candidates and readers can browse them without an account.",
  },
  {
    q: "How does attendance tracking work?",
    a: "Employees clock in and out from their device. Corevia verifies they're within your configured geofence before recording attendance, keeping time data honest.",
  },
  {
    q: "What happens after the free trial?",
    a: "You keep full access for 14 days with no credit card. Pick a plan when you're ready — nothing is charged automatically.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">FAQ</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {faqs.map((item) => (
            <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                {item.q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
