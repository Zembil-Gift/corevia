import { headers } from "next/headers"
import { getAdminToken } from "@/lib/auth"
import { DashboardView, type DashboardData } from "@/components/admin/dashboard-view"
import type { EmployeeApi, EmployeeAttendanceApi, EmployeePaymentApi } from "@/lib/employees-api"
import type { JobApi } from "@/lib/jobs-api"
import type { JobApplicationApi } from "@/lib/job-applications-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL

async function managerGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${CMS_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

type Page<T> = { totalElements: number; content: T[] }

function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default async function AdminDashboardPage() {
  const cookieHeader = (await headers()).get("cookie")
  const token = getAdminToken(cookieHeader)

  const empty: DashboardData = {
    counts: { blogs: 0, publishedBlogs: 0, events: 0, publishedEvents: 0, jobs: 0, openJobs: 0 },
    employees: { total: 0, active: 0 },
    attendance: { present: 0, clockedOut: 0, absent: 0 },
    upcomingPayroll: { count: 0, totalMinor: 0, items: [] },
    openJobApplicants: { totalApplicants: 0, newApplicants: 0, jobs: [] },
    orgSlug: null,
  }

  if (!token) {
    return <DashboardView data={empty} />
  }

  const [blogPage, eventPage, jobPage, employeePage, duePayments, me] = await Promise.all([
    managerGet<Page<{ status?: string }>>("/manager/blogs?page=0&size=200", token),
    managerGet<Page<{ status?: string }>>("/manager/events?page=0&size=200", token),
    managerGet<Page<JobApi>>("/manager/jobs?page=0&size=200", token),
    managerGet<Page<EmployeeApi>>(
      "/manager/employees?page=0&size=200&sortBy=createdAt&direction=desc",
      token
    ),
    managerGet<EmployeePaymentApi[]>("/manager/payments/due", token),
    managerGet<{ orgSlug?: string }>("/manager/me", token),
  ])

  const blogs = blogPage?.content ?? []
  const events = eventPage?.content ?? []
  const jobs = jobPage?.content ?? []
  const employees = employeePage?.content ?? []
  const due = Array.isArray(duePayments) ? duePayments : []

  const openJobs = jobs.filter((j) => j.status === "OPEN")

  // Attendance for today: fetch each active employee's history and look for a record
  // dated today. Capped so the dashboard never fans out to an unbounded request count.
  const activeEmployees = employees.filter((e) => e.active).slice(0, 60)
  const today = todayIso()
  const attendanceResults = await Promise.all(
    activeEmployees.map((e) =>
      managerGet<EmployeeAttendanceApi[]>(`/manager/employees/${e.id}/attendance`, token)
    )
  )
  let present = 0
  let clockedOut = 0
  for (const history of attendanceResults) {
    const record = (history ?? []).find((r) => r.date === today)
    if (!record) continue
    if (record.clockOutAt) clockedOut += 1
    else present += 1
  }
  const absent = Math.max(0, activeEmployees.length - present - clockedOut)

  // Applicants across currently open jobs (top jobs by applicant volume).
  const openJobApplicantResults = await Promise.all(
    openJobs.slice(0, 20).map(async (job) => {
      const apps = await managerGet<JobApplicationApi[]>(
        `/manager/job-applications/${job.id}`,
        token
      )
      const list = Array.isArray(apps) ? apps : []
      return {
        jobId: job.id,
        title: job.title,
        total: list.length,
        newCount: list.filter((a) => a.status === "APPLIED").length,
      }
    })
  )
  const jobsWithApplicants = openJobApplicantResults
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
  const totalApplicants = openJobApplicantResults.reduce((sum, j) => sum + j.total, 0)
  const newApplicants = openJobApplicantResults.reduce((sum, j) => sum + j.newCount, 0)

  const upcomingItems = [...due]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      employeeName: p.employeeName,
      dueDate: p.dueDate,
      amountMinor: p.amountMinor,
    }))
  const totalDueMinor = due.reduce((sum, p) => sum + (p.amountMinor ?? 0), 0)

  const data: DashboardData = {
    counts: {
      blogs: blogPage?.totalElements ?? 0,
      publishedBlogs: blogs.filter((b) => b.status === "PUBLISHED").length,
      events: eventPage?.totalElements ?? 0,
      publishedEvents: events.filter((e) => e.status === "PUBLISHED").length,
      jobs: jobPage?.totalElements ?? 0,
      openJobs: openJobs.length,
    },
    employees: {
      total: employeePage?.totalElements ?? 0,
      active: employees.filter((e) => e.active).length,
    },
    attendance: { present, clockedOut, absent },
    upcomingPayroll: { count: due.length, totalMinor: totalDueMinor, items: upcomingItems },
    openJobApplicants: { totalApplicants, newApplicants, jobs: jobsWithApplicants },
    orgSlug: me?.orgSlug ?? null,
  }

  return <DashboardView data={data} />
}
