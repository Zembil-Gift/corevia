"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Users, UserCog, Briefcase, FileText, Newspaper, ArrowRight } from "lucide-react"
import { fetchPlatformStats, type PlatformStats } from "@/lib/platform-api"
import { StatCard, OrgStatusBadge, BarList } from "@/components/platform/ui"

export default function PlatformOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlatformStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading platform metrics…</p>
  }
  if (error || !stats) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error || "No data"}
      </p>
    )
  }

  const topByEmployees = [...stats.organizations]
    .sort((a, b) => b.employees - a.employees)
    .slice(0, 6)
    .map((o) => ({ label: o.name, value: o.employees }))
  const topByApplicants = [...stats.organizations]
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 6)
    .map((o) => ({ label: o.name, value: o.applicants }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every organization on the platform, and the activity inside it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Organizations"
          value={stats.totalOrganizations}
          sub={`${stats.activeOrganizations} active · ${stats.suspendedOrganizations} suspended`}
          icon={Building2}
        />
        <StatCard label="Managers" value={stats.totalManagers} sub="across all orgs" icon={UserCog} />
        <StatCard label="Employees" value={stats.totalEmployees} sub="across all orgs" icon={Users} />
        <StatCard
          label="Jobs"
          value={stats.totalJobs}
          sub={`${stats.totalOpenJobs} open now`}
          icon={Briefcase}
        />
        <StatCard
          label="Applicants"
          value={stats.totalApplicants}
          sub={`${stats.totalHired} hired`}
          icon={FileText}
        />
        <StatCard
          label="Content"
          value={stats.totalBlogs + stats.totalEvents}
          sub={`${stats.totalBlogs} blogs · ${stats.totalEvents} events`}
          icon={Newspaper}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title="Employees by organization" rows={topByEmployees} />
        <BarList title="Applicants by organization" rows={topByApplicants} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-semibold text-foreground">Organizations</p>
          <Link
            href="/platform/organizations"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Organization</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Employees</th>
                <th className="px-5 py-3 text-right font-medium">Jobs</th>
                <th className="px-5 py-3 text-right font-medium">Applicants</th>
              </tr>
            </thead>
            <tbody>
              {stats.organizations.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{o.name}</p>
                    <p className="text-xs text-muted-foreground">/{o.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <OrgStatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-foreground">{o.employees}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-foreground">
                    {o.jobs}
                    <span className="text-muted-foreground"> ({o.openJobs} open)</span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-foreground">{o.applicants}</td>
                </tr>
              ))}
              {stats.organizations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No organizations yet.{" "}
                    <Link href="/platform/register" className="text-emerald-400 hover:text-emerald-300">
                      Register the first one
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
