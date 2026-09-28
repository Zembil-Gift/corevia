import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteFooter } from "./site-footer"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

interface LegalDocument {
  title: string
  content: string
  updatedAt: string | null
}

export async function fetchLegal(type: "terms" | "privacy"): Promise<LegalDocument | null> {
  try {
    const res = await fetch(`${CMS_BASE_URL}/legal/${type}`, { next: { revalidate: 60 } })
    return res.ok ? ((await res.json()) as LegalDocument) : null
  } catch {
    return null
  }
}

/** Public Terms of Service / Privacy Policy page; the text is edited by the platform admin. */
export function LegalPage({ doc, fallbackTitle }: { doc: LegalDocument | null; fallbackTitle: string }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">{doc?.title ?? fallbackTitle}</h1>
        {doc?.updatedAt && (
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated {new Date(doc.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
        <div className="mt-8 whitespace-pre-line leading-relaxed text-foreground/90">
          {doc?.content ?? "This document is not available right now. Please check back later."}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
