"use client"

import Link from "next/link"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Users,
  Briefcase,
  Wallet,
  UserPlus,
  CalendarClock,
  CheckCircle2,
  Clock,
  MinusCircle,
  ArrowRight,
} from "lucide-react"
import { useLang, pick } from "@/lib/i18n"

const tr = {
  dashboard: { en: "Dashboard", am: "ዳሽቦርድ" },
  employees: { en: "Employees", am: "ሰራተኞች" },
  active: { en: "active", am: "ንቁ" },
  openJobs: { en: "Open jobs", am: "ክፍት ስራዎች" },
  totalPostings: { en: "total postings", am: "ጠቅላላ ማስታወቂያዎች" },
  upcomingPayroll: { en: "Upcoming payroll", am: "መጪ ደመወዝ" },
  duePayments: { en: "due payments", am: "የሚከፈሉ ክፍያዎች" },
  newApplicants: { en: "New applicants", am: "አዲስ አመልካቾች" },
  totalOnOpen: { en: "total on open jobs", am: "በክፍት ስራዎች ጠቅላላ" },
  attendanceToday: { en: "Attendance today", am: "የዛሬ መገኘት" },
  activeEmployees: { en: "active employees", am: "ንቁ ሰራተኞች" },
  present: { en: "present", am: "የተገኙ" },
  presentC: { en: "Present", am: "የተገኙ" },
  clockedOut: { en: "Clocked out", am: "የወጡ" },
  absent: { en: "Absent", am: "ያልተገኙ" },
  viewPayroll: { en: "View payroll", am: "ደመወዝ ይመልከቱ" },
  noDue: { en: "No due payments right now.", am: "አሁን የሚከፈል ክፍያ የለም።" },
  due: { en: "Due", am: "የሚከፈልበት" },
  totalDue: { en: "Total due", am: "ጠቅላላ የሚከፈል" },
  applicantsOpen: { en: "Applicants · open jobs", am: "አመልካቾች · ክፍት ስራዎች" },
  applicants: { en: "Applicants", am: "አመልካቾች" },
  viewJobs: { en: "View jobs", am: "ስራዎች ይመልከቱ" },
  noOpenApplicants: { en: "No open jobs with applicants.", am: "አመልካቾች ያሉት ክፍት ስራ የለም።" },
  total: { en: "total", am: "ጠቅላላ" },
  totalC: { en: "Total", am: "ጠቅላላ" },
  newLabel: { en: "new", am: "አዲስ" },
  newC: { en: "New", am: "አዲስ" },
  contentOverview: { en: "Content overview", am: "የይዘት አጠቃላይ እይታ" },
  totalVsLive: { en: "total vs. live", am: "ጠቅላላ ከቀጥታ" },
  publishedOpen: { en: "Published / Open", am: "የታተመ / ክፍት" },
  currentlyIn: { en: "Currently clocked in", am: "አሁን የገቡ" },
  clockedOutToday: { en: "Clocked out today", am: "ዛሬ የወጡ" },
  notClockedIn: { en: "Not clocked in", am: "ያልገቡ" },
  quickLinks: { en: "Quick links", am: "ፈጣን አገናኞች" },
  viewPublicBlog: { en: "View public blog →", am: "የህዝብ ብሎግ ይመልከቱ →" },
  viewPublicJobs: { en: "View public jobs →", am: "የህዝብ ስራዎች ይመልከቱ →" },
  viewPublicEvents: { en: "View public events →", am: "የህዝብ ዝግጅቶች ይመልከቱ →" },
  blog: { en: "Blog", am: "ብሎግ" },
  jobs: { en: "Jobs", am: "ስራዎች" },
  events: { en: "Events", am: "ዝግጅቶች" },
}

export type DashboardData = {
  counts: {
    blogs: number
    publishedBlogs: number
    events: number
    publishedEvents: number
    jobs: number
    openJobs: number
  }
  employees: { total: number; active: number }
  attendance: { present: number; clockedOut: number; absent: number }
  upcomingPayroll: {
    count: number
    totalMinor: number
    items: { id: number; employeeName: string; dueDate: string; amountMinor: number }[]
  }
  openJobApplicants: {
    totalApplicants: number
    newApplicants: number
    jobs: { jobId: number; title: string; total: number; newCount: number }[]
  }
  orgSlug: string | null
}

const ACCENT = "#e78a53"

function formatMoney(amountMinor: number) {
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountMinor / 100))} ETB`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  tint,
}: {
  icon: typeof Users
  label: string
  value: string
  sub: string
  href: string
  tint: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-[#e78a53]/40 hover:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}22`, color: tint }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-[#e78a53]" />
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-zinc-300">{label}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </Link>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: unknown }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-medium text-zinc-200">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-zinc-300">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? ACCENT }}
          />
          {entry.name}: <span className="font-medium text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export function DashboardView({ data }: { data: DashboardData }) {
  const { lang } = useLang()
  const { counts, employees, attendance, upcomingPayroll, openJobApplicants, orgSlug } = data

  const contentData = [
    { name: pick(lang, tr.blog), total: counts.blogs, live: counts.publishedBlogs },
    { name: pick(lang, tr.jobs), total: counts.jobs, live: counts.openJobs },
    { name: pick(lang, tr.events), total: counts.events, live: counts.publishedEvents },
  ]

  const attendanceData = [
    { name: pick(lang, tr.presentC), value: attendance.present, color: "#34d399" },
    { name: pick(lang, tr.clockedOut), value: attendance.clockedOut, color: "#38bdf8" },
    { name: pick(lang, tr.absent), value: attendance.absent, color: "#71717a" },
  ]
  const attendanceTotal = attendance.present + attendance.clockedOut + attendance.absent

  const applicantData = openJobApplicants.jobs.map((j) => ({
    name: j.title.length > 22 ? `${j.title.slice(0, 22)}…` : j.title,
    Applicants: j.total,
    New: j.newCount,
  }))

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{pick(lang, tr.dashboard)}</h1>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={pick(lang, tr.employees)}
          value={String(employees.total)}
          sub={`${employees.active} ${pick(lang, tr.active)}`}
          href="/manager/employees"
          tint="#a78bfa"
        />
        <StatCard
          icon={Briefcase}
          label={pick(lang, tr.openJobs)}
          value={String(counts.openJobs)}
          sub={`${counts.jobs} ${pick(lang, tr.totalPostings)}`}
          href="/manager/jobs"
          tint={ACCENT}
        />
        <StatCard
          icon={Wallet}
          label={pick(lang, tr.upcomingPayroll)}
          value={formatMoney(upcomingPayroll.totalMinor)}
          sub={`${upcomingPayroll.count} ${pick(lang, tr.duePayments)}`}
          href="/manager/payments"
          tint="#34d399"
        />
        <StatCard
          icon={UserPlus}
          label={pick(lang, tr.newApplicants)}
          value={String(openJobApplicants.newApplicants)}
          sub={`${openJobApplicants.totalApplicants} ${pick(lang, tr.totalOnOpen)}`}
          href="/manager/jobs"
          tint="#38bdf8"
        />
      </div>

      {/* Attendance + Upcoming payroll */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Attendance donut */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">{pick(lang, tr.attendanceToday)}</h2>
          <p className="mb-2 text-xs text-zinc-500">{attendanceTotal} {pick(lang, tr.activeEmployees)}</p>
          <div className="relative h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceTotal ? attendanceData : [{ name: "None", value: 1, color: "#3f3f46" }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(attendanceTotal ? attendanceData : [{ color: "#3f3f46" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                {attendanceTotal > 0 && <Tooltip content={<ChartTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{attendance.present}</span>
              <span className="text-xs text-zinc-500">{pick(lang, tr.present)}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {attendanceData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-medium text-zinc-200">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming payroll */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock className="h-4 w-4 text-emerald-400" />
            {pick(lang, tr.upcomingPayroll)}
          </h2>
          <Link href="/manager/payments" className="text-xs text-[#e78a53] hover:underline">
            {pick(lang, tr.viewPayroll)}
          </Link>
        </div>
        {upcomingPayroll.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">{pick(lang, tr.noDue)}</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {upcomingPayroll.items.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{p.employeeName}</p>
                  <p className="text-xs text-zinc-500">{pick(lang, tr.due)} {formatDate(p.dueDate)}</p>
                </div>
                <span className="ml-3 shrink-0 text-sm font-semibold text-white">
                  {formatMoney(p.amountMinor)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {upcomingPayroll.count > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-sm">
            <span className="text-zinc-400">{pick(lang, tr.totalDue)}</span>
            <span className="font-semibold text-white">{formatMoney(upcomingPayroll.totalMinor)}</span>
          </div>
        )}
        </div>
      </div>

      {/* Applicants + Content overview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Applicants for open jobs */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{pick(lang, tr.applicantsOpen)}</h2>
            <Link href="/manager/jobs" className="text-xs text-[#e78a53] hover:underline">
              {pick(lang, tr.viewJobs)}
            </Link>
          </div>
          {applicantData.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{pick(lang, tr.noOpenApplicants)}</p>
          ) : (
            <>
              <div style={{ height: Math.max(140, applicantData.length * 44) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicantData} layout="vertical" barSize={16}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <Tooltip cursor={{ fill: "#ffffff08" }} content={<ChartTooltip />} />
                    <Bar dataKey="Applicants" name={pick(lang, tr.applicants)} fill="#38bdf8" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="New" name={pick(lang, tr.newC)} fill={ACCENT} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {openJobApplicants.jobs.map((j) => (
                  <Link
                    key={j.jobId}
                    href={`/manager/jobs/${j.jobId}/applicants`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-800/60"
                  >
                    <span className="truncate text-zinc-300">{j.title}</span>
                    <span className="ml-3 shrink-0 text-xs text-zinc-500">
                      {j.total} {pick(lang, tr.total)}
                      {j.newCount > 0 && (
                        <span className="ml-2 rounded-full bg-[#e78a53]/15 px-2 py-0.5 text-[#e78a53]">
                          {j.newCount} {pick(lang, tr.newLabel)}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content overview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{pick(lang, tr.contentOverview)}</h2>
            <span className="text-xs text-zinc-500">{pick(lang, tr.totalVsLive)}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentData} barGap={6}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "#ffffff08" }} content={<ChartTooltip />} />
                <Bar dataKey="total" name={pick(lang, tr.totalC)} fill="#3f3f46" radius={[4, 4, 0, 0]} />
                <Bar dataKey="live" name={pick(lang, tr.publishedOpen)} fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-5 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-zinc-600" /> {pick(lang, tr.totalC)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ACCENT }} />{" "}
              {pick(lang, tr.publishedOpen)}
            </span>
          </div>
        </div>

      
      </div>

      {/* Attendance quick indicators */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <div>
            <p className="text-xl font-bold text-white">{attendance.present}</p>
            <p className="text-xs text-zinc-500">{pick(lang, tr.currentlyIn)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <Clock className="h-8 w-8 text-sky-400" />
          <div>
            <p className="text-xl font-bold text-white">{attendance.clockedOut}</p>
            <p className="text-xs text-zinc-500">{pick(lang, tr.clockedOutToday)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <MinusCircle className="h-8 w-8 text-zinc-500" />
          <div>
            <p className="text-xl font-bold text-white">{attendance.absent}</p>
            <p className="text-xs text-zinc-500">{pick(lang, tr.notClockedIn)}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">{pick(lang, tr.quickLinks)}</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {orgSlug && (
            <Link
              href={`/o/${orgSlug}/blog`}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-[#e78a53] transition-colors hover:bg-zinc-800/60"
            >
              {pick(lang, tr.viewPublicBlog)}
            </Link>
          )}
          {orgSlug && (
            <Link
              href={`/o/${orgSlug}/jobs`}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-[#e78a53] transition-colors hover:bg-zinc-800/60"
            >
              {pick(lang, tr.viewPublicJobs)}
            </Link>
          )}
          {orgSlug && (
            <Link
              href={`/o/${orgSlug}/events`}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-[#e78a53] transition-colors hover:bg-zinc-800/60"
            >
              {pick(lang, tr.viewPublicEvents)}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
