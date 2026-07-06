import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, Briefcase } from "lucide-react"
import { fetchOrgJobBySlug, fetchOrgInfo } from "@/lib/org-content-api"
import { formatJobEmploymentType } from "@/lib/jobs-api"

export default async function OrgJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string; jobSlug: string }>
}) {
  const { slug, jobSlug } = await params
  const [job, org] = await Promise.all([
    fetchOrgJobBySlug(slug, jobSlug),
    fetchOrgInfo(slug),
  ])
  if (!job) notFound()

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/o/${slug}#jobs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {org?.name ?? "company"}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{job.title}</h1>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          {formatJobEmploymentType(job.employmentType)}
        </span>
        {job.department && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> {job.department}
          </span>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
        )}
      </div>

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {job.description}
      </div>
    </article>
  )
}
