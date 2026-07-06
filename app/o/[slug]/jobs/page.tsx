import Link from "next/link"
import { MapPin, Briefcase } from "lucide-react"
import { fetchOrgJobs } from "@/lib/org-content-api"
import { formatJobEmploymentType } from "@/lib/jobs-api"
import { OrgSubShell } from "@/components/org/org-subpage"

export default async function OrgJobsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const jobs = await fetchOrgJobs(slug)

  return (
    <OrgSubShell slug={slug} title="Open positions">
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open positions right now.</p>
      ) : (
        <div className="space-y-3">
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/o/${slug}/jobs/${job.slug}`}
          className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-500/40"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{job.title}</h2>
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              {formatJobEmploymentType(job.employmentType)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
            </Link>
          ))}
        </div>
      )}
    </OrgSubShell>
  )
}
