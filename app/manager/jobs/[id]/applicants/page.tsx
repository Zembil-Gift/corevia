"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  ApplicationStatus,
  JobApplicationAiOverviewApi,
  JobApplicationApi,
} from "@/lib/job-applications-api"
import type { SubOrganization } from "@/lib/sub-orgs-api"

const INTERVIEW_ELIGIBLE_STATUSES = new Set(["APPLIED", "UNDER_REVIEW"])
const STATUS_FILTERS: Array<"ALL" | ApplicationStatus> = [
  "ALL",
  "APPLIED",
  "UNDER_REVIEW",
  "SELECTED_FOR_INTERVIEW",
  "REJECTED",
  "HIRED",
]

type AiOverviewState =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "loaded"; data: JobApplicationAiOverviewApi }

type ParsedAiOverview = {
  matchScore: number | null
  strengths: string[]
  weaknesses: string[]
  overallAssessment: string | null
}

const parseAiOverview = (text: string | null): ParsedAiOverview | null => {
  if (!text) return null
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    const matchScore = typeof raw.matchScore === "number" ? raw.matchScore : null
    const strengths = Array.isArray(raw.strengths)
      ? raw.strengths.filter((item): item is string => typeof item === "string")
      : []
    const weaknesses = Array.isArray(raw.weaknesses)
      ? raw.weaknesses.filter((item): item is string => typeof item === "string")
      : []
    const overallAssessment =
      typeof raw.overallAssessment === "string" ? raw.overallAssessment : null
    return { matchScore, strengths, weaknesses, overallAssessment }
  } catch {
    return null
  }
}

const normalizeScore = (value: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}

const scoreTone = (value: number | null) => {
  if (typeof value !== "number") {
    return { text: "text-zinc-400", ring: "#3f3f46" }
  }
  if (value >= 90) return { text: "text-emerald-400", ring: "#34d399" }
  if (value >= 70) return { text: "text-amber-400", ring: "#fbbf24" }
  return { text: "text-rose-400", ring: "#fb7185" }
}

export default function AdminJobApplicantsPage() {
  const params = useParams<{ id: string }>()
  const jobId = params?.id
  const [applications, setApplications] = useState<JobApplicationApi[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [selectingInterview, setSelectingInterview] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApplicationStatus>("ALL")
  const [subOrgs, setSubOrgs] = useState<SubOrganization[]>([])
  const [hireTarget, setHireTarget] = useState<JobApplicationApi | null>(null)
  const [hirePhone, setHirePhone] = useState("")
  const [hirePosition, setHirePosition] = useState("")
  const [hireSalaryDate, setHireSalaryDate] = useState("")
  const [hireSalaryAmount, setHireSalaryAmount] = useState("")
  const [hireSubOrgId, setHireSubOrgId] = useState<number | "">("")
  const [hiring, setHiring] = useState(false)
  const [aiOverviewState, setAiOverviewState] = useState<Record<number, AiOverviewState>>({})
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [activeAiOverview, setActiveAiOverview] = useState<JobApplicationAiOverviewApi | null>(
    null
  )

  useEffect(() => {
    fetch("/api/admin/sub-organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubOrgs(data)
      })
      .catch(() => {})
  }, [])

  const fetchApplications = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/job-applications/${jobId}`, { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to load applicants")
      }
      const data = await res.json()
      const list = Array.isArray(data) ? (data as JobApplicationApi[]) : []
      setApplications(list)
      const allowedIds = new Set(
        list
          .filter((application) => INTERVIEW_ELIGIBLE_STATUSES.has(application.status))
          .map((application) => application.id)
      )
      setSelectedIds((prev) => prev.filter((id) => allowedIds.has(id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applicants")
      setApplications([])
      setSelectedIds([])
    } finally {
      setLoading(false)
    }
  }, [jobId])

  const fetchAiOverview = useCallback(async (applicationId: number) => {
    setAiOverviewState((prev) => ({
      ...prev,
      [applicationId]: { state: "loading" },
    }))
    try {
      const res = await fetch(`/api/admin/job-applications/${applicationId}/ai-overview`, {
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load AI overview")
      }
      setAiOverviewState((prev) => ({
        ...prev,
        [applicationId]: { state: "loaded", data: data as JobApplicationAiOverviewApi },
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load AI overview"
      setAiOverviewState((prev) => ({
        ...prev,
        [applicationId]: { state: "error", message },
      }))
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  useEffect(() => {
    if (applications.length === 0) return
    for (const application of applications) {
      if (!aiOverviewState[application.id]) {
        void fetchAiOverview(application.id)
      }
    }
  }, [applications, aiOverviewState, fetchAiOverview])

  const filteredApplications = useMemo(() => {
    if (statusFilter === "ALL") return applications
    return applications.filter((application) => application.status === statusFilter)
  }, [applications, statusFilter])

  const activeAiDetails = useMemo(
    () => parseAiOverview(activeAiOverview?.aiOverviewText ?? null),
    [activeAiOverview]
  )
  const normalizedAiScore = normalizeScore(activeAiDetails?.matchScore ?? null)
  const aiScoreTone = scoreTone(normalizedAiScore)
  const aiScoreLabel = normalizedAiScore == null ? "—" : `${normalizedAiScore}%`
  const aiScoreStyle =
    normalizedAiScore == null
      ? { background: "#27272a" }
      : { background: `conic-gradient(${aiScoreTone.ring} ${normalizedAiScore}%, #27272a 0)` }

  const selectedEligibleIds = useMemo(
    () =>
      selectedIds.filter((id) => {
        const found = filteredApplications.find((application) => application.id === id)
        return Boolean(found && INTERVIEW_ELIGIBLE_STATUSES.has(found.status))
      }),
    [filteredApplications, selectedIds]
  )

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, id]
      return prev.filter((value) => value !== id)
    })
  }

  const openAiOverview = (overview: JobApplicationAiOverviewApi) => {
    setActiveAiOverview(overview)
    setAiModalOpen(true)
  }

  const handleAiModalChange = (open: boolean) => {
    if (!open) {
      setActiveAiOverview(null)
    }
    setAiModalOpen(open)
  }

  const renderAiOverviewCell = (applicationId: number) => {
    const overviewState = aiOverviewState[applicationId]
    if (!overviewState || overviewState.state === "loading") {
      return (
        <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="size-3 animate-spin" />
          Loading
        </span>
      )
    }
    if (overviewState.state === "error") {
      return <span className="text-xs font-medium text-rose-400">Failed</span>
    }
    
    const overview = overviewState.data
    if (overview.aiOverviewStatus === "PENDING") {
      return <span className="text-xs font-medium text-amber-400">Pending</span>
    }
    if (overview.aiOverviewStatus === "FAILED") {
      return <span className="text-xs font-medium text-rose-400">Failed</span>
    }
  
  
    const details = parseAiOverview(overview.aiOverviewText ?? null)
    const score = normalizeScore(details?.matchScore ?? null)
    

    const tone = scoreTone(score)
    const label = score == null ? "—" : `${score}%`
  
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`font-semibold transition-transform active:scale-95 ${tone.text} hover:bg-zinc-800`}
        onClick={() => openAiOverview(overview)}
      >
        {label}
      </Button>
    )
  }

  const handleMarkUnderReview = async (applicationId: number) => {
    setStatusUpdatingId(applicationId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/job-applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "UNDER_REVIEW" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to update status")
      }
      await fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleSelectInterview = async () => {
    if (!jobId || selectedEligibleIds.length === 0) return
    setSelectingInterview(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/job-applications/${jobId}/select-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: selectedEligibleIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to select interview candidates")
      }
      setSelectedIds([])
      await fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select interview candidates")
    } finally {
      setSelectingInterview(false)
    }
  }

  const openHireForm = (application: JobApplicationApi) => {
    setHireTarget(application)
    setHirePhone(application.phoneNumber ?? "")
    setHirePosition("")
    setHireSalaryDate("")
    setHireSalaryAmount("")
    const def = subOrgs.find((s) => s.isDefault)
    setHireSubOrgId(def ? def.id : (subOrgs[0]?.id ?? ""))
  }

  const closeHireForm = () => {
    if (hiring) return
    setHireTarget(null)
    setHirePhone("")
    setHirePosition("")
    setHireSalaryDate("")
    setHireSalaryAmount("")
    setHireSubOrgId("")
  }

  const handleHire = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!jobId || !hireTarget) return
    const majorAmount = Number(hireSalaryAmount)
    if (!Number.isFinite(majorAmount) || majorAmount <= 0) {
      setError("Salary amount must be greater than zero.")
      return
    }

    setHiring(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/job-applications/${jobId}/hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: hireTarget.id,
          phone: hirePhone.trim(),
          position: hirePosition.trim(),
          salaryDate: hireSalaryDate,
          salaryAmountMinor: Math.round(majorAmount * 100),
          subOrganizationId: hireSubOrgId ? Number(hireSubOrgId) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to hire applicant")
      }
      closeHireForm()
      await fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hire applicant")
    } finally {
      setHiring(false)
    }
  }

  const formatTimestamp = (value: string) => new Date(value).toLocaleString()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Applicants</h1>
          {/*<p className="mt-1 text-zinc-400">Manage applicants for Software Engineer Role</p>*/}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "ALL" | ApplicationStatus)}
            className="h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-200"
            aria-label="Filter applicants by status"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : status}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={handleSelectInterview}
            disabled={selectingInterview || selectedEligibleIds.length === 0}
            className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
          >
            {selectingInterview ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Selecting
              </>
            ) : (
              `Select for Interview (${selectedEligibleIds.length})`
            )}
          </Button>
          <Link
            href="/manager/jobs"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Back to jobs
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {hireTarget && (
        <form
          onSubmit={handleHire}
          className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:grid-cols-6"
        >
          <Input
            value={hirePhone}
            onChange={(event) => setHirePhone(event.target.value)}
            placeholder="Phone"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Input
            value={hirePosition}
            onChange={(event) => setHirePosition(event.target.value)}
            placeholder="Position"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          {subOrgs.length > 0 && (
            <select
              value={hireSubOrgId}
              onChange={(event) => setHireSubOrgId(event.target.value ? Number(event.target.value) : "")}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:border-[#e78a53] focus:outline-none"
            >
              {subOrgs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isDefault ? "(Main)" : ""}
                </option>
              ))}
            </select>
          )}
          <Input
            value={hireSalaryDate}
            onChange={(event) => setHireSalaryDate(event.target.value)}
            type="date"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Input
            value={hireSalaryAmount}
            onChange={(event) => setHireSalaryAmount(event.target.value)}
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Salary amount"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={hiring}
              className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
            >
              {hiring ? "Hiring..." : `Hire ${hireTarget.fullName}`}
            </Button>
            <Button type="button" variant="outline" disabled={hiring} onClick={closeHireForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          No applicants found for this job.
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          No applicants found with status {statusFilter}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Pick</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Applicant</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Contact</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Applied</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  AI Overview
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => {
                const canSelectForInterview = INTERVIEW_ELIGIBLE_STATUSES.has(application.status)
                const canHire = application.status === "SELECTED_FOR_INTERVIEW"
                const isSelected = selectedIds.includes(application.id)
                return (
                  <tr key={application.id} className="border-b border-zinc-800/80 align-top last:border-0">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!canSelectForInterview}
                        onChange={(event) => toggleSelection(application.id, event.target.checked)}
                        aria-label={`Select ${application.fullName}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{application.fullName}</p>
                      <p className="text-sm text-zinc-500">#{application.id}</p>
                      {application.resumeUrl && (
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#e78a53] hover:underline"
                        >
                          View resume
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <p>{application.email}</p>
                      {application.phoneNumber && <p className="text-sm text-zinc-400">{application.phoneNumber}</p>}
                      {application.githubUrl && (
                        <a
                          href={application.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#e78a53] hover:underline"
                        >
                          GitHub
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          application.status === "HIRED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : application.status === "REJECTED"
                              ? "bg-red-500/20 text-red-400"
                              : application.status === "SELECTED_FOR_INTERVIEW"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatTimestamp(application.createdAt)}</td>
                    <td className="px-4 py-3">{renderAiOverviewCell(application.id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={application.status !== "APPLIED" || statusUpdatingId === application.id}
                          onClick={() => handleMarkUnderReview(application.id)}
                        >
                          {statusUpdatingId === application.id ? "Saving..." : "Mark Under Review"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                          disabled={!canHire}
                          onClick={() => openHireForm(application)}
                        >
                          Hire
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog.Root open={aiModalOpen} onOpenChange={handleAiModalChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            aria-describedby={undefined}
          >
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-white">AI overview</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            {activeAiOverview ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Applicant</p>
                      <p className="text-lg font-semibold text-white">{activeAiOverview.fullName}</p>
                      <p className="text-sm text-zinc-400">{activeAiOverview.jobTitle}</p>
                      {activeAiOverview.aiOverviewCompletedAt && (
                        <p className="mt-2 text-xs text-zinc-500">
                          Completed {formatTimestamp(activeAiOverview.aiOverviewCompletedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className="flex size-24 items-center justify-center rounded-full"
                        style={aiScoreStyle}
                      >
                        <div className="flex size-[72px] items-center justify-center rounded-full bg-zinc-900">
                          <span className={`text-lg font-semibold ${aiScoreTone.text}`}>
                            {aiScoreLabel}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Match score</p>
                        <p className={`text-2xl font-semibold ${aiScoreTone.text}`}>{aiScoreLabel}</p>
                        <p className="text-xs text-zinc-500">Higher is better</p>
                      </div>
                    </div>
                  </div>
                </div>

                {activeAiDetails ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                        <p className="text-sm font-semibold text-white">Strengths</p>
                        {activeAiDetails.strengths.length > 0 ? (
                          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                            {activeAiDetails.strengths.map((item, index) => (
                              <li key={`${item}-${index}`} className="flex gap-2">
                                <span className="mt-1 size-1.5 rounded-full bg-emerald-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-zinc-500">No strengths provided yet.</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                        <p className="text-sm font-semibold text-white">Weaknesses</p>
                        {activeAiDetails.weaknesses.length > 0 ? (
                          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                            {activeAiDetails.weaknesses.map((item, index) => (
                              <li key={`${item}-${index}`} className="flex gap-2">
                                <span className="mt-1 size-1.5 rounded-full bg-rose-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-zinc-500">No weaknesses provided yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <p className="text-sm font-semibold text-white">Overall assessment</p>
                      <p className="mt-3 text-sm text-zinc-300">
                        {activeAiDetails.overallAssessment ?? "No assessment summary provided."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
                    AI overview data is not available yet.
                  </div>
                )}

                <p className="text-xs text-zinc-500">
                  Disclaimer: This is AI generated and might make a mistake.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No AI overview selected.</p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
