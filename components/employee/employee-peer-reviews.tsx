"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, Loader2, MessageSquare, X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type {
  LeadershipPrincipleResponse,
  AdminPeerReviewResponse,
  PeerReviewAvailableEmployeeResponse,
  PeerReviewPeriodStatusResponse,
  PeerReviewRatingValue,
  PeerReviewSelfResultsResponse,
} from "@/lib/metrics-api"

const ratingOptions: Array<{ value: PeerReviewRatingValue; label: string }> = [
  { value: "EXCEEDS_THE_BAR", label: "Exceeds the bar" },
  { value: "MEETS_THE_BAR", label: "Meets the bar" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs improvement" },
]

const coerceBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return false
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const formatPercent = (value: number | null | undefined) =>
  typeof value === "number" ? `${value.toFixed(2)}%` : "—"

const scoreTone = (value: number | null | undefined) => {
  if (typeof value !== "number") return "text-zinc-300"
  if (value >= 85) return "text-emerald-400"
  if (value >= 70) return "text-amber-400"
  return "text-rose-400"
}

type PeerReviewSelfResultsApiV2 = {
  periodId: number
  periodName?: string | null
  periodStart: string
  periodEnd: string
  employee?: {
    employeeId: number
    employeeName: string
    leadershipScore?: number | null
    principleAverages?: PeerReviewSelfResultsResponse["principleAverages"]
  }
}

type NormalizedPeerReviewSelfResults = {
  periodId: number
  periodName?: string | null
  periodStart: string
  periodEnd: string
  employeeName?: string | null
  leadershipScore?: number | null
  principleAverages: NonNullable<PeerReviewSelfResultsResponse["principleAverages"]>
}

const normalizePeerReviewSelfResults = (
  data: PeerReviewSelfResultsResponse | PeerReviewSelfResultsApiV2 | null,
): NormalizedPeerReviewSelfResults | null => {
  if (!data) return null

  const periodId = Number((data as PeerReviewSelfResultsResponse).periodId)
  const periodStart = String((data as PeerReviewSelfResultsResponse).periodStart ?? "")
  const periodEnd = String((data as PeerReviewSelfResultsResponse).periodEnd ?? "")

  if (!Number.isFinite(periodId) || !periodStart || !periodEnd) return null

  const v2Employee = (data as PeerReviewSelfResultsApiV2).employee
  const employeeName =
    v2Employee && typeof v2Employee.employeeName === "string"
      ? v2Employee.employeeName
      : null

  const leadershipScore =
    v2Employee && typeof v2Employee.leadershipScore === "number"
      ? v2Employee.leadershipScore
      : typeof (data as PeerReviewSelfResultsResponse).leadershipScore === "number"
        ? (data as PeerReviewSelfResultsResponse).leadershipScore
        : null

  const principleAveragesRaw =
    v2Employee && Array.isArray(v2Employee.principleAverages)
      ? v2Employee.principleAverages
      : Array.isArray((data as PeerReviewSelfResultsResponse).principleAverages)
        ? (data as PeerReviewSelfResultsResponse).principleAverages
        : []

  return {
    periodId,
    periodName: (data as PeerReviewSelfResultsResponse).periodName ?? null,
    periodStart,
    periodEnd,
    employeeName,
    leadershipScore,
    principleAverages: principleAveragesRaw,
  }
}

type PeerReviewView = "new" | "scores"

type EmployeePeerReviewsProps = {
  view?: PeerReviewView
}

export function EmployeePeerReviews({ view = "new" }: EmployeePeerReviewsProps) {
  const [principles, setPrinciples] = useState<LeadershipPrincipleResponse[]>([])
  const [ratings, setRatings] = useState<Record<number, { rating: PeerReviewRatingValue; comment: string }>>({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const peerReviewTab = view === "scores" ? "submitted" : "new"
  const [peerReviewPeriods, setPeerReviewPeriods] = useState<PeerReviewPeriodStatusResponse[]>([])
  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [periodsError, setPeriodsError] = useState("")
  const [selectedNewPeriodId, setSelectedNewPeriodId] = useState<number | null>(null)

  // For "My scores" modal
  const [selectedSubmittedPeriodId, setSelectedSubmittedPeriodId] = useState<number | null>(null)
  const [resultsModalOpen, setResultsModalOpen] = useState(false)

  const [availableEmployees, setAvailableEmployees] = useState<PeerReviewAvailableEmployeeResponse[]>([])
  const [availableEmployeesLoading, setAvailableEmployeesLoading] = useState(false)
  const [availableEmployeesError, setAvailableEmployeesError] = useState("")
  const [selectedRevieweeId, setSelectedRevieweeId] = useState<number | null>(null)
  const [submittedResults, setSubmittedResults] = useState<PeerReviewSelfResultsResponse | null>(
    null
  )
  const [submittedResultsLoading, setSubmittedResultsLoading] = useState(false)
  const [submittedResultsError, setSubmittedResultsError] = useState("")

  const [adminReview, setAdminReview] = useState<AdminPeerReviewResponse | null>(null)
  const [adminReviewLoading, setAdminReviewLoading] = useState(false)
  const [adminReviewError, setAdminReviewError] = useState("")

  const activePrinciples = useMemo(
    () => principles.filter((principle) => principle.isActive),
    [principles]
  )
  const newPeriods = useMemo(
    () => peerReviewPeriods.filter((period) => period.id),
    [peerReviewPeriods]
  )

  const scorePeriods = useMemo(
    () => peerReviewPeriods.filter((period) => period.id),
    [peerReviewPeriods]
  )

  const selectedScorePeriod = useMemo(
    () => scorePeriods.find((period) => period.id === selectedSubmittedPeriodId) ?? null,
    [scorePeriods, selectedSubmittedPeriodId]
  )
  const selectedNewPeriod = useMemo(
    () => newPeriods.find((period) => period.id === selectedNewPeriodId) ?? null,
    [newPeriods, selectedNewPeriodId]
  )
  const selectedReviewee = useMemo(
    () => availableEmployees.find((employee) => employee.id === selectedRevieweeId) ?? null,
    [availableEmployees, selectedRevieweeId]
  )

  const loadPrinciples = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/me/peer-reviews/principles")
      const data = await res.json().catch(() => [])
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load principles")
      }
      setPrinciples(Array.isArray(data) ? data : [])
    } catch {
      setPrinciples([])
    }
  }, [])

  const loadPeerReviewPeriods = useCallback(async () => {
    setPeriodsLoading(true)
    setPeriodsError("")
    try {
      const res = await fetch("/api/employee/me/peer-reviews/periods", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load peer review periods")
      }
      const normalized = Array.isArray(data)
        ? (data as Array<Record<string, unknown>>).map((period) => ({
            ...(period as Omit<PeerReviewPeriodStatusResponse, "submitted">),
            submitted: coerceBoolean(period.submitted ?? (period as { isSubmitted?: unknown }).isSubmitted),
          }))
        : []
      setPeerReviewPeriods(normalized as PeerReviewPeriodStatusResponse[])
    } catch (err) {
      setPeriodsError(err instanceof Error ? err.message : "Failed to load peer review periods")
      setPeerReviewPeriods([])
    } finally {
      setPeriodsLoading(false)
    }
  }, [])

  const loadAvailableEmployees = useCallback(async () => {
    setAvailableEmployeesLoading(true)
    setAvailableEmployeesError("")
    try {
      const res = await fetch("/api/employee/me/peer-reviews/available-employees")
      const data = await res.json().catch(() => [])
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load employees")
      }
      setAvailableEmployees(Array.isArray(data) ? data : [])
    } catch (err) {
      setAvailableEmployeesError(err instanceof Error ? err.message : "Failed to load employees")
      setAvailableEmployees([])
    } finally {
      setAvailableEmployeesLoading(false)
    }
  }, [])

  const loadSubmittedResults = useCallback(async (periodId: number) => {
    setSubmittedResultsLoading(true)
    setSubmittedResultsError("")
    try {
      const res = await fetch(`/api/employee/me/peer-reviews/periods/${periodId}/results`, {
        cache: "no-store",
      })

      if (res.status === 404) {
        setSubmittedResults(null)
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load peer review results")
      }
      setSubmittedResults(data as PeerReviewSelfResultsResponse)
    } catch (err) {
      setSubmittedResultsError(
        err instanceof Error ? err.message : "Failed to load peer review results"
      )
      setSubmittedResults(null)
    } finally {
      setSubmittedResultsLoading(false)
    }
  }, [])

  const loadAdminReview = useCallback(async (periodId: number) => {
    setAdminReviewLoading(true)
    setAdminReviewError("")
    try {
      const res = await fetch(`/api/employee/me/peer-reviews/periods/${periodId}/admin-review`, {
        cache: "no-store",
      })

      if (res.status === 404) {
        setAdminReview(null)
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load admin feedback")
      }
      setAdminReview(data as AdminPeerReviewResponse)
    } catch (err) {
      setAdminReviewError(err instanceof Error ? err.message : "Failed to load admin feedback")
      setAdminReview(null)
    } finally {
      setAdminReviewLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPeerReviewPeriods()
    if (view === "new") {
      loadPrinciples()
      loadAvailableEmployees()
    }
  }, [loadAvailableEmployees, loadPeerReviewPeriods, loadPrinciples, view])

  useEffect(() => {
    if (view !== "new" || activePrinciples.length === 0) return
    setRatings((prev) => {
      const next = { ...prev }
      activePrinciples.forEach((principle) => {
        if (!next[principle.id]) {
          next[principle.id] = { rating: "MEETS_THE_BAR", comment: "" }
        }
      })
      return next
    })
  }, [activePrinciples])

  useEffect(() => {
    if (view !== "new") return
    if (newPeriods.length > 0 && !newPeriods.some((period) => period.id === selectedNewPeriodId)) {
      setSelectedNewPeriodId(newPeriods[0]!.id)
    }
  }, [newPeriods, selectedNewPeriodId, view])

  useEffect(() => {
    if (view !== "new") return
    if (
      availableEmployees.length > 0 &&
      !availableEmployees.some((employee) => employee.id === selectedRevieweeId)
    ) {
      setSelectedRevieweeId(availableEmployees[0]!.id)
    }
  }, [availableEmployees, selectedRevieweeId, view])

  useEffect(() => {
    if (resultsModalOpen && selectedSubmittedPeriodId) {
      loadSubmittedResults(selectedSubmittedPeriodId)
      loadAdminReview(selectedSubmittedPeriodId)
      return
    }

    if (!resultsModalOpen) {
      setSubmittedResults(null)
      setSubmittedResultsError("")
      setAdminReview(null)
      setAdminReviewError("")
    }
  }, [loadAdminReview, loadSubmittedResults, resultsModalOpen, selectedSubmittedPeriodId])

  const openResultsModal = useCallback((periodId: number) => {
    setSelectedSubmittedPeriodId(periodId)
    setSubmittedResults(null)
    setSubmittedResultsError("")
    setAdminReview(null)
    setAdminReviewError("")
    setResultsModalOpen(true)
  }, [])

  const normalizedResults = useMemo(
    () => normalizePeerReviewSelfResults(submittedResults),
    [submittedResults]
  )

  const leadershipScore = normalizedResults?.leadershipScore ?? null
  const leadershipScoreSafe =
    typeof leadershipScore === "number" ? clamp(leadershipScore, 0, 100) : null

  const principleChartData = useMemo(() => {
    if (!normalizedResults) return []

    const data = normalizedResults.principleAverages
      .map((principle) => {
        const avg = principle.averageRating
        if (typeof avg !== "number" || !Number.isFinite(avg)) return null

        return {
          principle: principle.principleName,
          average: Number(avg.toFixed(2)),
          ratingCount:
            typeof principle.ratingCount === "number" && Number.isFinite(principle.ratingCount)
              ? principle.ratingCount
              : 0,
        }
      })
      .filter(
        (row): row is { principle: string; average: number; ratingCount: number } =>
          Boolean(row)
      )

    data.sort((a, b) => b.average - a.average)
    return data
  }, [normalizedResults])

  const totalRatings = useMemo(() => {
    if (!normalizedResults) return 0
    return normalizedResults.principleAverages.reduce(
      (sum, entry) => sum + (entry.ratingCount ?? 0),
      0
    )
  }, [normalizedResults])

  const averagePrincipleRating = useMemo(() => {
    if (!normalizedResults || normalizedResults.principleAverages.length === 0) return null

    const valid = normalizedResults.principleAverages
      .map((entry) => entry.averageRating)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))

    if (valid.length === 0) return null

    const sum = valid.reduce((acc, v) => acc + v, 0)
    return sum / valid.length
  }, [normalizedResults])

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")
    if (!selectedNewPeriod) {
      setSubmitError("Select a peer review period.")
      return
    }
    if (!selectedRevieweeId) {
      setSubmitError("Select an employee to review.")
      return
    }
    const payloadRatings = activePrinciples
      .map((principle) => {
        const entry = ratings[principle.id]
        if (!entry) return null
        const comment = entry.comment.trim()
        return {
          principleId: principle.id,
          rating: entry.rating,
          comment: comment ? comment : undefined,
        }
      })
      .filter((entry): entry is { principleId: number; rating: PeerReviewRatingValue; comment?: string } =>
        Boolean(entry)
      )

    if (payloadRatings.length === 0) {
      setSubmitError("Provide at least one rating before submitting.")
      return
    }

    setSubmitLoading(true)
    try {
      const res = await fetch("/api/employee/me/peer-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revieweeId: selectedRevieweeId,
          periodStart: selectedNewPeriod.periodStart,
          periodEnd: selectedNewPeriod.periodEnd,
          ratings: payloadRatings,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to submit peer review")
      }
      setSubmitSuccess("Peer review submitted successfully.")
      setRatings((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => {
          next[Number(key)] = { ...next[Number(key)], comment: "" }
        })
        return next
      })
      loadPeerReviewPeriods()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit peer review")
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-[#e78a53]" />
            <h2 className="text-lg font-semibold text-white">Peer Reviews</h2>
          </div>
          <div className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-400">
            {peerReviewTab === "new"
              ? `New (${newPeriods.length})`
              : `My scores (${scorePeriods.length})`}
          </div>
        </div>
        

        {periodsError && <p className="mt-3 text-sm text-red-400">{periodsError}</p>}

        {periodsLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin text-[#e78a53]" />
            Loading peer review periods...
          </div>
        ) : peerReviewTab === "new" ? (
          newPeriods.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No new peer review periods available.</p>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleSubmitReview}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Period</Label>
                  <select
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                    value={selectedNewPeriodId ?? ""}
                    onChange={(e) => setSelectedNewPeriodId(Number(e.target.value) || null)}
                  >
                    {newPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name ? `${period.name}` : ""}
                        {/*{period.periodStart} → {period.periodEnd}*/}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Reviewee</Label>
                  {availableEmployeesLoading ? (
                    <div className="text-sm text-zinc-500">Loading employees...</div>
                  ) : availableEmployees.length === 0 ? (
                    <div className="text-sm text-zinc-500">No employees available for review.</div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                      value={selectedRevieweeId ?? ""}
                      onChange={(e) => setSelectedRevieweeId(Number(e.target.value) || null)}
                    >
                      {availableEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} · {employee.role} · {employee.department}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableEmployeesError && (
                    <p className="text-xs text-red-400">{availableEmployeesError}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
                <p className="font-semibold text-white">Selected period</p>
                <p className="mt-1">
                  {selectedNewPeriod
                    ? `${selectedNewPeriod.name ? `${selectedNewPeriod.name} ` : ""}`
                    : "—"}
                </p>
                {/*<p className="mt-2 font-semibold text-white">Reviewing</p>
                <p className="mt-1">
                  {selectedReviewee
                    ? `${selectedReviewee.name} · ${selectedReviewee.role} · ${selectedReviewee.department}`
                    : "—"}
                </p>*/}
              </div>

              {activePrinciples.length === 0 ? (
                <p className="text-sm text-zinc-500">No active principles available.</p>
              ) : (
                <div className="space-y-3">
                  {activePrinciples.map((principle) => {
                    const entry = ratings[principle.id]
                    return (
                      <div key={principle.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                        <div className="flex flex-col gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{principle.name}</p>
                            <p className="text-xs text-zinc-500">{principle.description}</p>
                          </div>
                          <select
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                            value={entry?.rating ?? "MEETS_THE_BAR"}
                            onChange={(e) =>
                              setRatings((prev) => ({
                                ...prev,
                                [principle.id]: {
                                  rating: e.target.value as PeerReviewRatingValue,
                                  comment: prev[principle.id]?.comment ?? "",
                                },
                              }))
                            }
                          >
                            {ratingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <textarea
                            rows={2}
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                            placeholder="Optional comment"
                            value={entry?.comment ?? ""}
                            onChange={(e) =>
                              setRatings((prev) => ({
                                ...prev,
                                [principle.id]: {
                                  rating: prev[principle.id]?.rating ?? "MEETS_THE_BAR",
                                  comment: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {submitError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  {submitSuccess}
                </p>
              )}

              <Button
                type="submit"
                disabled={
                  submitLoading ||
                  activePrinciples.length === 0 ||
                  !selectedNewPeriod ||
                  !selectedRevieweeId
                }
                className="w-full bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              >
                {submitLoading ? "Submitting..." : "Submit review"}
              </Button>
            </form>
          )
        ) : scorePeriods.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No peer review periods available yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {scorePeriods
              .slice()
              .sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1))
              .map((period) => (
                <div
                  key={period.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {period.name || `Period ${period.id}`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {period.periodStart} → {period.periodEnd}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {period.submitted ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                        Submitted
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
                        Not submitted
                      </span>
                    )}
                    <Button
                      type="button"
                      className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                      onClick={() => openResultsModal(period.id)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <Dialog.Root open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[10001] w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            aria-describedby={undefined}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Dialog.Title className="text-xl font-semibold text-white">
                  Peer review results
                </Dialog.Title>
                <p className="mt-1 text-sm text-zinc-400">
                  {(selectedScorePeriod?.name || normalizedResults?.periodName || "Selected period")}
                  {selectedScorePeriod ? (
                    <> · {selectedScorePeriod.periodStart} → {selectedScorePeriod.periodEnd}</>
                  ) : normalizedResults ? (
                    <> · {normalizedResults.periodStart} → {normalizedResults.periodEnd}</>
                  ) : null}
                </p>
              </div>
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

            {submittedResultsLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="size-4 animate-spin text-[#e78a53]" />
                Loading results...
              </div>
            ) : submittedResultsError ? (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {submittedResultsError}
              </p>
            ) : !normalizedResults ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-6 text-sm text-zinc-400">
                No results yet for this period.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Leadership score
                    </p>
                    <div className="mt-4 grid place-items-center">
                      {leadershipScoreSafe === null ? (
                        <p className="text-sm text-zinc-400">—</p>
                      ) : (
                        <div className="relative h-40 w-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                dataKey="value"
                                data={[
                                  { name: "Score", value: leadershipScoreSafe },
                                  { name: "Remaining", value: 100 - leadershipScoreSafe },
                                ]}
                                startAngle={90}
                                endAngle={-270}
                                innerRadius={52}
                                outerRadius={74}
                                paddingAngle={2}
                                stroke="transparent"
                              >
                                <Cell fill="#e78a53" />
                                <Cell fill="rgba(255,255,255,0.08)" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 grid place-items-center">
                            <div className="text-center">
                              <p className={`text-2xl font-semibold ${scoreTone(leadershipScoreSafe)}`}>
                                {formatPercent(leadershipScoreSafe)}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">Leadership</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          Principles breakdown
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {normalizedResults.employeeName
                            ? `Employee: ${normalizedResults.employeeName}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/30 px-3 py-1 text-xs text-zinc-300">
                        <BarChart3 className="size-4 text-[#e78a53]" />
                        Avg: {averagePrincipleRating === null ? "—" : averagePrincipleRating.toFixed(2)} · Ratings: {totalRatings}
                      </div>
                    </div>

                    {principleChartData.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-500">No aggregated principles yet.</p>
                    ) : (
                      <div className="mt-4 h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={principleChartData}
                            layout="vertical"
                            margin={{ top: 4, right: 18, bottom: 4, left: 90 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.07)"
                            />
                            <XAxis
                              type="number"
                              domain={[0, 3]}
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                            />
                            <YAxis
                              type="category"
                              dataKey="principle"
                              tick={{ fill: "#e4e4e7", fontSize: 12 }}
                              width={90}
                              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                            />
                            <Tooltip
                              cursor={{ fill: "rgba(231,138,83,0.10)" }}
                              contentStyle={{
                                background: "rgba(24,24,27,0.98)",
                                border: "1px solid rgba(63,63,70,1)",
                                borderRadius: 12,
                              }}
                              labelStyle={{ color: "#e4e4e7" }}
                              formatter={(
                                value: unknown,
                                _name: string,
                                props: { payload?: { ratingCount?: number } },
                              ) => {
                                const avg = typeof value === "number" ? value : Number(value)
                                const count = props.payload?.ratingCount
                                const countLabel =
                                  typeof count === "number"
                                    ? ` (${count} rating${count === 1 ? "" : "s"})`
                                    : ""
                                return [`${avg.toFixed(2)}${countLabel}`, "Avg rating"]
                              }}
                            />
                            <Bar
                              dataKey="average"
                              fill="#e78a53"
                              radius={[0, 10, 10, 0]}
                              isAnimationActive={false}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Manager feedback</p>
                    {adminReview?.updatedAt ? (
                      <span className="text-xs text-zinc-500">
                        {new Date(adminReview.updatedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  {adminReviewError ? (
                    <p className="mt-2 text-sm text-red-300">{adminReviewError}</p>
                  ) : adminReviewLoading ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="size-4 animate-spin text-[#e78a53]" />
                      Loading admin feedback...
                    </div>
                  ) : adminReview ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-zinc-400">
                    
                        {(adminReview.rating ?? "—").replace(/_/g, " ")}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-zinc-200">
                       Feedback: "{adminReview.feedback || ""}"
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">No admin feedback yet.</p>
                  )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
