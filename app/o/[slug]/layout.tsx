import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchOrgInfo } from "@/lib/org-content-api"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const org = await fetchOrgInfo(slug)
  if (!org) return { title: "Organization" }
  return {
    title: `${org.name}${org.tagline ? ` — ${org.tagline}` : " — Company profile"}`,
    description: org.tagline ?? org.description?.slice(0, 160) ?? undefined,
  }
}

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await fetchOrgInfo(slug)
  if (!org) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href={`/o/${org.slug}`} className="flex items-center gap-2.5">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-border"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-sm font-bold text-emerald-400">
                {org.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-semibold text-foreground">{org.name}</span>
          </Link>
          {org.websiteUrl && (
            <a
              href={org.websiteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Visit website
            </a>
          )}
        </div>
      </header>

      {children}

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {org.name}
          </span>
          <Link href="/" className="hover:text-foreground">
            Powered by Mahberix
          </Link>
        </div>
      </footer>
    </div>
  )
}
