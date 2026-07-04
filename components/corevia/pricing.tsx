"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

type Plan = {
  name: string
  blurb: string
  monthly: number
  featured?: boolean
  cta: string
  features: string[]
}

const plans: Plan[] = [
  {
    name: "Starter",
    blurb: "For small teams getting organized.",
    monthly: 29,
    cta: "Start free trial",
    features: [
      "Up to 15 employees",
      "Hiring & applicant tracking",
      "Employee management",
      "Geofenced attendance",
      "Company blog & events",
      "Email support",
    ],
  },
  {
    name: "Growth",
    blurb: "For scaling companies that run on data.",
    monthly: 89,
    featured: true,
    cta: "Start free trial",
    features: [
      "Up to 100 employees",
      "Everything in Starter",
      "Performance & peer reviews",
      "Payments & payroll tracking",
      "AI applicant overviews",
      "GitHub, Trello & Telegram insights",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    blurb: "For large orgs with custom needs.",
    monthly: 0,
    cta: "Talk to sales",
    features: [
      "Unlimited employees",
      "Everything in Growth",
      "Custom leadership principles",
      "SSO & advanced roles",
      "Dedicated success manager",
      "SLA & onboarding assistance",
    ],
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Simple pricing that scales with you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every plan includes a 14-day free trial. No credit card required.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = plan.monthly === 0 ? null : annual ? Math.round(plan.monthly * 0.8) : plan.monthly
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.featured
                    ? "border-emerald-500 bg-card shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/20"
                    : "border-border bg-card"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-emerald-950">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>

                <div className="mt-5 flex items-end gap-1">
                  {price === null ? (
                    <span className="text-3xl font-extrabold text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold tabular-nums text-foreground">${price}</span>
                      <span className="mb-1 text-sm text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <p className="mt-1 h-4 text-xs text-muted-foreground">
                  {price !== null && annual ? "billed annually" : price !== null ? "billed monthly" : " "}
                </p>

                <Link
                  href={plan.monthly === 0 ? "/signup?plan=enterprise" : "/signup"}
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    plan.featured
                      ? "bg-emerald-500 text-emerald-950 shadow-sm hover:-translate-y-0.5 hover:bg-emerald-400"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-6 space-y-3 border-t border-border pt-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices are placeholders for demonstration. Update them in{" "}
          <code className="rounded bg-muted px-1 py-0.5">components/corevia/pricing.tsx</code>.
        </p>
      </div>
    </section>
  )
}
