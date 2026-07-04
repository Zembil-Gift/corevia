"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Loader2, Plus, Pencil, MailX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatJobEmploymentType, type JobApi } from "@/lib/jobs-api"
import type { JobApplicationApi } from "@/lib/job-applications-api"
import { CreateJobModal } from "@/components/admin/create-job-modal"
import { EditJobModal } from "@/components/admin/edit-job-modal"

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editJob, setEditJob] = useState<JobApi | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [applications, setApplications] = useState<JobApplicationApi[]>([])
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)

  const fetchJobsList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/jobs?page=0&size=100&sortBy=createdAt&direction=desc")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message ?? `Failed to load: ${res.status}`)
      }
      const data = await res.json()
      setJobs(data.content ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/job-applications", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setApplications(Array.isArray(data) ? data : [])
      }
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    fetchJobsList()
    fetchApplications()
  }, [fetchJobsList, fetchApplications])

  // Resolve the logged-in manager's org slug so "View" opens this org's public page
  // (/o/{slug}/...) rather than the single hard-coded public site.
  useEffect(() => {
    fetch("/api/manager/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.orgSlug) setOrgSlug(d.orgSlug as string)
      })
      .catch(() => {})
  }, [])

  const jobsWithHires = useMemo(() => {
    const hiredJobIds = new Set<number>()
    for (const app of applications) {
      if (app.status === "HIRED") {
        hiredJobIds.add(app.jobId)
      }
    }
    return hiredJobIds
  }, [applications])

  const handleSendRejections = async (jobId: number) => {
    setRejectingJobId(jobId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/job-applications/${jobId}/send-rejections`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to send rejections")
      }
      await fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send rejections")
    } finally {
      setRejectingJobId(null)
    }
  }

  const openEditModal = (job: JobApi) => {
    setEditJob(job)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditJob(null)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-zinc-400 mt-1">Manage job listings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
          >
            <Plus className="size-4 mr-2" />
            Create job
          </Button>
          <Link
            href={orgSlug ? `/o/${orgSlug}/jobs` : "/jobs"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            View public jobs
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Department
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    View
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Rejections
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-zinc-800/80 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">
                        {job.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {job.department}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatJobEmploymentType(job.employmentType)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          job.status === "OPEN"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : job.status === "CLOSED"
                            ? "bg-zinc-600/30 text-zinc-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <Link
                        href={`/manager/jobs/${job.id}/applicants`}
                        className="text-sm text-zinc-300 hover:text-white hover:underline"
                      >
                        Applicants
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {jobsWithHires.has(job.id) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={rejectingJobId === job.id}
                          onClick={() => handleSendRejections(job.id)}
                        >
                          {rejectingJobId === job.id ? (
                            <>
                              <Loader2 className="mr-1 size-3 animate-spin" />
                              Sending
                            </>
                          ) : (
                            <>
                              <MailX className="mr-1 size-3" />
                              Send Rejections
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-sm text-zinc-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={orgSlug ? `/o/${orgSlug}/jobs/${job.slug}` : `/jobs/${job.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#e78a53] hover:underline"
                        >
                          View
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white p-1 h-8 w-8"
                          onClick={() => openEditModal(job)}
                          aria-label={`Edit ${job.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </p>
        </>
      )}

      <CreateJobModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchJobsList}
      />
      <EditJobModal
        open={editModalOpen}
        onOpenChange={(open) => !open && closeEditModal()}
        onSuccess={() => {
          closeEditModal();
          fetchJobsList();
        }}
        job={editJob}
      />
    </div>
  );
}
