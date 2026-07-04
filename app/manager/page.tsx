import Link from "next/link"
import { headers } from "next/headers"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL

// Tenant-scoped count helper: hits a /manager/* list endpoint with the manager's token
// so every number reflects only the logged-in organization.
async function managerCount(
  path: string,
  token: string,
  isPublished: (row: { status?: string }) => boolean
): Promise<{ total: number; published: number }> {
  try {
    const res = await fetch(`${CMS_BASE_URL}${path}?page=0&size=200`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return { total: 0, published: 0 }
    const data = (await res.json()) as {
      totalElements: number
      content: Array<{ status?: string }>
    }
    return {
      total: data.totalElements ?? 0,
      published: (data.content ?? []).filter(isPublished).length,
    }
  } catch {
    return { total: 0, published: 0 }
  }
}

export default async function AdminDashboardPage() {
  const cookieHeader = (await headers()).get("cookie")
  const token = getAdminToken(cookieHeader)

  let jobsCount = 0
  let openJobsCount = 0
  let eventsCount = 0
  let publishedEventsCount = 0
  let blogsCount = 0
  let publishedBlogsCount = 0
  let employeesCount = 0
  let activeEmployeesCount = 0
  let duePaymentsCount = 0

  if (token) {
    const [jobs, events, blogs] = await Promise.all([
      managerCount("/manager/jobs", token, (r) => r.status === "OPEN"),
      managerCount("/manager/events", token, (r) => r.status === "PUBLISHED"),
      managerCount("/manager/blogs", token, (r) => r.status === "PUBLISHED"),
    ])
    jobsCount = jobs.total
    openJobsCount = jobs.published
    eventsCount = events.total
    publishedEventsCount = events.published
    blogsCount = blogs.total
    publishedBlogsCount = blogs.published
  }

  // Resolve this org's slug so the "public" quick links point to /o/{slug}, not the
  // single hard-coded public site.
  let orgSlug: string | null = null
  if (token) {
    try {
      const meRes = await fetch(`${CMS_BASE_URL}/manager/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (meRes.ok) orgSlug = ((await meRes.json()) as { orgSlug?: string }).orgSlug ?? null
    } catch {
      // non-fatal
    }
  }

  try {
    if (token) {
      const [employeesRes, duePaymentsRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_CMS_BASE_URL}/manager/employees?page=0&size=100&sortBy=createdAt&direction=desc`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        ),
        fetch(`${process.env.NEXT_PUBLIC_CMS_BASE_URL}/manager/payments/due`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ])
      if (employeesRes.ok) {
        const employeesData = (await employeesRes.json()) as {
          totalElements: number
          content: Array<{ active: boolean }>
        }
        employeesCount = employeesData.totalElements
        activeEmployeesCount = employeesData.content.filter((employee) => employee.active).length
      }
      if (duePaymentsRes.ok) {
        const dueData = (await duePaymentsRes.json()) as unknown[]
        duePaymentsCount = Array.isArray(dueData) ? dueData.length : 0
      }
    }
  } catch {
    // ignore
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-zinc-400 mb-8">Manage blog, jobs, events, and employees.</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/manager/blog"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-[#e78a53]/40 hover:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-white mb-1">Blog</h2>
          <p className="text-3xl font-bold text-[#e78a53]">{blogsCount}</p>
          <p className="text-sm text-zinc-500 mt-1">{publishedBlogsCount} published</p>
        </Link>
        <Link
          href="/manager/jobs"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-[#e78a53]/40 hover:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-white mb-1">Jobs</h2>
          <p className="text-3xl font-bold text-[#e78a53]">{jobsCount}</p>
          <p className="text-sm text-zinc-500 mt-1">
            {openJobsCount} open
          </p>
        </Link>
        <Link
          href="/manager/events"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-[#e78a53]/40 hover:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-white mb-1">Events</h2>
          <p className="text-3xl font-bold text-[#e78a53]">{eventsCount}</p>
          <p className="text-sm text-zinc-500 mt-1">
            {publishedEventsCount} published
          </p>
        </Link>
        <Link
          href="/manager/employees"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-[#e78a53]/40 hover:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-white mb-1">Employees</h2>
          <p className="text-3xl font-bold text-[#e78a53]">{employeesCount}</p>
          <p className="text-sm text-zinc-500 mt-1">{activeEmployeesCount} active</p>
        </Link>
        <Link
          href="/manager/payments"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-[#e78a53]/40 hover:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-white mb-1">Payroll</h2>
          <p className="text-3xl font-bold text-[#e78a53]">{duePaymentsCount}</p>
          <p className="text-sm text-zinc-500 mt-1">due payments</p>
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick links</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href={orgSlug ? `/o/${orgSlug}/blog` : "/blog"} className="text-[#e78a53] hover:underline">
              View public blog →
            </Link>
          </li>
          <li>
            <Link href={orgSlug ? `/o/${orgSlug}/jobs` : "/jobs"} className="text-[#e78a53] hover:underline">
              View public jobs →
            </Link>
          </li>
          <li>
            <Link href={orgSlug ? `/o/${orgSlug}/events` : "/events"} className="text-[#e78a53] hover:underline">
              View public events →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
