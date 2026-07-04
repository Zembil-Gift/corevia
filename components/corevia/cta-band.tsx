import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CtaBand() {
  return (
    <section className="border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-[#0c1a13] px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 0%, rgba(16,185,129,0.35), transparent 60%), radial-gradient(40% 50% at 80% 100%, rgba(163,230,53,0.20), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Bring your whole company onto one platform
            </h2>
            <p className="mt-4 text-pretty text-lg text-slate-300">
              Start your free trial today. Set up your organization, invite your team, and run operations from a single
              dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-emerald-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-400 sm:w-auto"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
