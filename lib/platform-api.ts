// Types + client helpers for the platform-admin dashboard. All calls go through the
// Next.js /api/platform/* routes, which attach the platform JWT (httpOnly cookie) as Bearer.

export interface OrgStats {
  id: number
  name: string
  slug: string
  status: string
  plan: string
  createdAt: string
  managers: number
  employees: number
  jobs: number
  openJobs: number
  applicants: number
  hired: number
  blogs: number
  publishedBlogs: number
  events: number
  publishedEvents: number
}

export interface PlatformStats {
  totalOrganizations: number
  activeOrganizations: number
  suspendedOrganizations: number
  totalManagers: number
  totalEmployees: number
  totalJobs: number
  totalOpenJobs: number
  totalApplicants: number
  totalHired: number
  totalBlogs: number
  totalEvents: number
  organizations: OrgStats[]
}

export interface CreateOrgInput {
  name: string
  slug: string
  managerName: string
  managerEmail: string
  /** When provisioning from a self-serve signup request, links back so it is marked approved. */
  requestId?: number
}

export interface SignupRequest {
  id: number
  companyName: string
  contactName: string
  email: string
  message: string | null
  status: string
  createdAt: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Request failed")
  }
  return data as T
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  return parse<PlatformStats>(await fetch("/api/platform/stats", { cache: "no-store" }))
}

export async function createOrganization(input: CreateOrgInput): Promise<{ id: number; slug: string; name: string }> {
  return parse(
    await fetch("/api/platform/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}

export async function setOrgStatus(id: number, action: "suspend" | "activate"): Promise<OrgStats> {
  return parse<OrgStats>(await fetch(`/api/platform/orgs/${id}/${action}`, { method: "POST" }))
}

export async function fetchSignupRequests(): Promise<SignupRequest[]> {
  return parse<SignupRequest[]>(await fetch("/api/platform/signup-requests", { cache: "no-store" }))
}

export async function rejectSignupRequest(id: number): Promise<SignupRequest> {
  return parse<SignupRequest>(await fetch(`/api/platform/signup-requests/${id}/reject`, { method: "POST" }))
}

/** Turn "Acme Inc." into "acme-inc" to match the backend slug pattern. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
