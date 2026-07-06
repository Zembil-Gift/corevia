import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/**
 * Container for the per-org list/detail pages under /o/{slug}/* now that the org layout
 * no longer provides its own content column. Gives a max-width column, a title and a
 * "back to profile" link.
 */
export function OrgSubShell({
  slug,
  title,
  children,
}: {
  slug: string
  title?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/o/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>
      {title && <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{title}</h1>}
      <div className={title ? "mt-6" : "mt-6"}>{children}</div>
    </div>
  )
}
