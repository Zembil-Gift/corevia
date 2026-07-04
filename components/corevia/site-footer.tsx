import Link from "next/link"
import { brand } from "@/lib/brand"
import { Logo } from "./logo"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Start free", href: "/signup" },
      { label: "Jobs", href: "/jobs" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Events", href: "/events" },
      { label: `Contact: ${brand.email}`, href: `mailto:${brand.email}` },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#080b0a] text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="[&_span]:text-white">
              <Logo />
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate-400">{brand.tagline}.</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">Built for companies that want one platform, not six.</p>
        </div>
      </div>
    </footer>
  )
}
