import { CalendarClock, GraduationCap, Wallet } from "lucide-react"
import type { JobApi } from "@/lib/jobs-api"

function formatDeadline(ymd: string): string {
  // yyyy-mm-dd is a calendar date; build it locally so it doesn't shift a day in UTC-behind zones.
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

/** Experience level, salary and deadline — rendered only when the manager filled them in. */
export function JobFacts({ job, className = "" }: { job: JobApi; className?: string }) {
  if (!job.experienceLevel && !job.salaryRange && !job.applicationDeadline) return null
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground ${className}`}>
      {job.experienceLevel && (
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" /> {job.experienceLevel}
        </span>
      )}
      {job.salaryRange && (
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" /> {job.salaryRange}
        </span>
      )}
      {job.applicationDeadline && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" /> Apply by {formatDeadline(job.applicationDeadline)}
        </span>
      )}
    </div>
  )
}
