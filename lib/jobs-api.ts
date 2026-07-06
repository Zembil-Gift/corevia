const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? "afrodebab"

export type JobEmploymentTypeApi =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN"

export type JobStatusApi = "DRAFT" | "OPEN" | "CLOSED"

export interface JobApi {
  id: number
  title: string
  slug: string
  department: string
  employmentType: JobEmploymentTypeApi
  location: string
  description: string
  status: JobStatusApi
  createdAt?: string
}

export interface JobListResponse {
  content: JobApi[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
  sort: { empty: boolean; sorted: boolean; unsorted: boolean }
  pageable: {
    offset: number
    sort: { empty: boolean; sorted: boolean; unsorted: boolean }
    paged: boolean
    pageNumber: number
    pageSize: number
    unpaged: boolean
  }
}

export type JobSortBy = "title" | "department" | "createdAt" | string
export type JobSortDirection = "asc" | "desc"

/** Fetch paginated jobs. Page is 0-based in the API. */
export async function fetchJobs(
  page: number = 0,
  size: number = 6,
  sortBy?: JobSortBy,
  direction?: JobSortDirection
): Promise<JobListResponse> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (sortBy) params.set("sortBy", sortBy)
  if (direction) params.set("direction", direction)
  const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/jobs?${params.toString()}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.status}`)
  }
  return res.json()
}

/** Fetch a single job by slug. */
export async function fetchJobBySlug(slug: string): Promise<JobApi | null> {
  const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/jobs/${encodeURIComponent(slug)}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Failed to fetch job: ${res.status}`)
  }
  return res.json()
}

/** Format API employment type for display. */
export function formatJobEmploymentType(
  type: JobEmploymentTypeApi | string
): string {
  const labels: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  }
  return labels[type] ?? type
}

/** Employment type options for filter chips (API enum values). */
export const JOB_EMPLOYMENT_TYPES: JobEmploymentTypeApi[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]

export function isJobOpen(job: JobApi): boolean {
  return job.status === "OPEN"
}
