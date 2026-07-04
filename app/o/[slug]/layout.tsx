import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchOrgInfo } from "@/lib/org-content-api"
import { OrgTabs } from "@/components/org/org-tabs"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const org = await fetchOrgInfo(slug)
  return { title: org ? `${org.name} — Careers & News` : "Organization" }
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
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Organization
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{org.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public careers, news and events · <span className="text-foreground">/o/{org.slug}</span>
          </p>
          <div className="mt-6">
            <OrgTabs slug={org.slug} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Powered by Corevia
          </Link>
        </div>
      </footer>
    </div>
  )
}
