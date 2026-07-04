"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BarChart3, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AdminPeerReviewResponse,
  PeerReviewPeriodEmployeeResult,
  PeerReviewPeriodResponse,
  PeerReviewPeriodResultsResponse,
  PeerReviewRatingValue,
} from "@/lib/metrics-api";

const getToday = () => new Date().toISOString().slice(0, 10);
const getMonthStart = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
};

const ratingOptions: Array<{ value: PeerReviewRatingValue; label: string }> = [
  { value: "EXCEEDS_THE_BAR", label: "Exceeds the bar" },
  { value: "MEETS_THE_BAR", label: "Meets the bar" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs improvement" },
];

const formatPeerReviewRating = (rating: string | null | undefined) => {
  if (!rating) return "—";
  const match = ratingOptions.find((option) => option.value === rating);
  if (match) return match.label;
  return rating.replace(/_/g, " ");
};

const formatScore = (value: number | null | undefined) =>
  typeof value === "number" ? `${value.toFixed(2)}%` : "—";

const formatAverageRating = (value: number | null | undefined) =>
  typeof value === "number" ? value.toFixed(2) : "—";

const scoreTone = (value: number | null | undefined) => {
  if (typeof value !== "number") return "text-zinc-400";
  if (value >= 85) return "text-emerald-400";
  if (value >= 70) return "text-amber-400";
  return "text-rose-400";
};

export default function AdminPeerReviewsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState(getMonthStart);
  const [periodEnd, setPeriodEnd] = useState(getToday);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPeriod, setCreatedPeriod] =
    useState<PeerReviewPeriodResponse | null>(null);

  const [periods, setPeriods] = useState<PeerReviewPeriodResponse[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [periodsError, setPeriodsError] = useState<string | null>(null);

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [periodResults, setPeriodResults] =
    useState<PeerReviewPeriodResultsResponse | null>(null);
  const [periodResultsLoading, setPeriodResultsLoading] = useState(false);
  const [periodResultsError, setPeriodResultsError] = useState<string | null>(
    null,
  );

  const [employeeDetailsOpen, setEmployeeDetailsOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );

  const [adminReview, setAdminReview] = useState<AdminPeerReviewResponse | null>(
    null,
  );
  const [adminReviewLoading, setAdminReviewLoading] = useState(false);
  const [adminReviewError, setAdminReviewError] = useState<string | null>(null);
  const [adminReviewEditing, setAdminReviewEditing] = useState(false);
  const [adminReviewRating, setAdminReviewRating] =
    useState<PeerReviewRatingValue>("MEETS_THE_BAR");
  const [adminReviewFeedback, setAdminReviewFeedback] = useState("");
  const [adminReviewSaving, setAdminReviewSaving] = useState(false);
  const [adminReviewSaveError, setAdminReviewSaveError] = useState<string | null>(
    null,
  );

  const employeesInPeriod = useMemo(
    () => (Array.isArray(periodResults?.employees) ? periodResults!.employees : []),
    [periodResults],
  );

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return (
      employeesInPeriod.find((emp) => emp.employeeId === selectedEmployeeId) ??
      null
    );
  }, [employeesInPeriod, selectedEmployeeId]);

  const aggregates = useMemo(() => {
    const employeesCount = employeesInPeriod.length;
    const scored = employeesInPeriod
      .map((e) => e.leadershipScore)
      .filter((value): value is number => typeof value === "number");
    const averageLeadership =
      scored.length > 0
        ? scored.reduce((sum, value) => sum + value, 0) / scored.length
        : null;

    const principleIds = new Set<number>();
    let totalRatings = 0;
    employeesInPeriod.forEach((employee) => {
      (employee.principleAverages ?? []).forEach((p) => {
        principleIds.add(p.principleId);
        totalRatings += p.ratingCount ?? 0;
      });
    });

    return {
      employeesCount,
      averageLeadership,
      totalRatings,
      principlesCount: principleIds.size,
    };
  }, [employeesInPeriod]);

  const loadPeriods = useCallback(async () => {
    setPeriodsLoading(true);
    setPeriodsError(null);
    try {
      const res = await fetch("/api/admin/metrics/peer-reviews/periods", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Failed to load peer review periods",
        );
      }
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      setPeriodsError(
        err instanceof Error ? err.message : "Failed to load peer review periods",
      );
      setPeriods([]);
    } finally {
      setPeriodsLoading(false);
    }
  }, []);

  const loadPeriodResults = useCallback(async (periodId: number) => {
    setPeriodResultsLoading(true);
    setPeriodResultsError(null);
    try {
      const res = await fetch(
        `/api/admin/metrics/peer-reviews/periods/${periodId}/results`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Failed to load peer review results",
        );
      }
      setPeriodResults(data as PeerReviewPeriodResultsResponse);
    } catch (err) {
      setPeriodResultsError(
        err instanceof Error ? err.message : "Failed to load peer review results",
      );
      setPeriodResults(null);
    } finally {
      setPeriodResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (periods.length === 0) return;
    if (selectedPeriodId && periods.some((p) => p.id === selectedPeriodId)) return;
    setSelectedPeriodId(periods[0]!.id);
  }, [periods, selectedPeriodId]);

  const loadAdminReview = useCallback(
    async (periodId: number, employeeId: number) => {
      setAdminReviewLoading(true);
      setAdminReviewError(null);
      try {
        const res = await fetch(
          `/api/admin/metrics/peer-reviews/periods/${periodId}/admin-reviews/${employeeId}`,
          { cache: "no-store" },
        );
        if (res.status === 404) {
          setAdminReview(null);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (data as { error?: string }).error ??
              "Failed to load admin feedback",
          );
        }
        const review = data as AdminPeerReviewResponse;
        setAdminReview(review);
        if (review.rating) setAdminReviewRating(review.rating);
        setAdminReviewFeedback(review.feedback ?? "");
      } catch (err) {
        setAdminReviewError(
          err instanceof Error ? err.message : "Failed to load admin feedback",
        );
        setAdminReview(null);
      } finally {
        setAdminReviewLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedPeriodId) {
      setPeriodResults(null);
      return;
    }
    loadPeriodResults(selectedPeriodId);
  }, [loadPeriodResults, selectedPeriodId]);

  useEffect(() => {
    if (!employeeDetailsOpen) return;
    if (!selectedPeriodId || !selectedEmployeeId) return;
    setAdminReviewSaveError(null);
    loadAdminReview(selectedPeriodId, selectedEmployeeId);
  }, [employeeDetailsOpen, loadAdminReview, selectedEmployeeId, selectedPeriodId]);

  const handleCreatePeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = periodName.trim();
    if (!trimmedName) {
      setError("Period name is required.");
      return;
    }

    setCreating(true);
    setError(null);
    setCreatedPeriod(null);

    try {
      const res = await fetch("/api/admin/metrics/peer-reviews/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, periodStart, periodEnd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Failed to initiate peer review period",
        );
      }
      setCreatedPeriod(data as PeerReviewPeriodResponse);
      setShowCreateModal(false);
      setPeriodName("");
      await loadPeriods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate peer review period",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleViewEmployee = (employee: PeerReviewPeriodEmployeeResult) => {
    setSelectedEmployeeId(employee.employeeId);
    setAdminReviewEditing(false);
    setAdminReviewSaveError(null);
    setEmployeeDetailsOpen(true);
  };

  const handleSaveAdminReview = async () => {
    if (!selectedPeriodId || !selectedEmployeeId) return;

    const feedback = adminReviewFeedback.trim();
    if (!feedback) {
      setAdminReviewSaveError("Feedback is required.");
      return;
    }

    setAdminReviewSaving(true);
    setAdminReviewSaveError(null);

    try {
      const res = await fetch(
        `/api/admin/metrics/peer-reviews/periods/${selectedPeriodId}/admin-reviews/${selectedEmployeeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: adminReviewRating, feedback }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Failed to save admin feedback",
        );
      }
      const saved = data as AdminPeerReviewResponse;
      setAdminReview(saved);
      if (saved.rating) setAdminReviewRating(saved.rating);
      setAdminReviewFeedback(saved.feedback ?? "");
      setAdminReviewEditing(false);
    } catch (err) {
      setAdminReviewSaveError(
        err instanceof Error ? err.message : "Failed to save admin feedback",
      );
    } finally {
      setAdminReviewSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Peer Reviews</h1>
          <p className="mt-1 text-zinc-400">
            Select a review period to see its aggregated results and employee
            breakdown.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300">
          <BarChart3 className="size-4 text-[#e78a53]" />
          Peer review analytics
        </div>
      </div>

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Create review period</h2>
            <p className="text-sm text-zinc-400">
              Open a named period so employees can submit peer reviews.
            </p>
          </div>
          <Button
            type="button"
            className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
            onClick={() => {
              setError(null);
              setShowCreateModal(true);
            }}
          >
            Create review period
          </Button>
        </div>

        {error && !showCreateModal && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {createdPeriod && (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4" />
              Period created
            </div>
            <p className="mt-2">
              {createdPeriod.name ?? `#${createdPeriod.id}`} ·{" "}
              {createdPeriod.periodStart} → {createdPeriod.periodEnd}
            </p>
            <p className="mt-1 text-xs text-emerald-200/80">
              Created at {new Date(createdPeriod.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Initiated periods</h2>
            <p className="text-sm text-zinc-400">
              Click a period to load aggregated results.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            onClick={loadPeriods}
            disabled={periodsLoading}
          >
            Refresh
          </Button>
        </div>

        {periodsError && <p className="mb-4 text-sm text-red-400">{periodsError}</p>}

        {periodsLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin text-[#e78a53]" />
            Loading periods...
          </div>
        ) : periods.length === 0 ? (
          <p className="text-sm text-zinc-500">No periods have been initiated yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Period</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((item) => {
                  const active = item.id === selectedPeriodId;
                  return (
                    <tr
                      key={item.id}
                      className={`cursor-pointer border-b border-zinc-800/80 last:border-0 hover:bg-zinc-800/30 ${
                        active ? "bg-zinc-800/40" : ""
                      }`}
                      onClick={() => setSelectedPeriodId(item.id)}
                    >
                      <td className="px-4 py-3 text-zinc-200">
                        {item.name ?? `#${item.id}`}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {item.periodStart} → {item.periodEnd}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Period results</h2>
          <p className="text-sm text-zinc-400">
            Aggregated values for the selected review period.
          </p>
        </div>

        {periodResultsError && (
          <p className="mb-4 text-sm text-red-400">{periodResultsError}</p>
        )}

        {periodResultsLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin text-[#e78a53]" />
            Loading results...
          </div>
        ) : !periodResults ? (
          <p className="text-sm text-zinc-500">Select a period to load results.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-semibold text-white">
                {periodResults.periodName ?? `Period #${periodResults.periodId}`}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {periodResults.periodStart} → {periodResults.periodEnd}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Employees reviewed
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {aggregates.employeesCount}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Avg leadership score
                </p>
                <p
                  className={`mt-2 text-2xl font-semibold ${scoreTone(
                    aggregates.averageLeadership,
                  )}`}
                >
                  {formatScore(aggregates.averageLeadership)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Total ratings
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {aggregates.totalRatings}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Principles
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {aggregates.principlesCount}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  Employees ({employeesInPeriod.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  onClick={() => selectedPeriodId && loadPeriodResults(selectedPeriodId)}
                  disabled={periodResultsLoading || !selectedPeriodId}
                >
                  Refresh
                </Button>
              </div>

              {employeesInPeriod.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No employee results found for this period.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900">
                      <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Leadership</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesInPeriod.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="border-b border-zinc-800/80 last:border-0"
                        >
                          <td className="px-4 py-3 text-zinc-200">
                            {employee.employeeName}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {employee.department}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{employee.role}</td>
                          <td className={`px-4 py-3 ${scoreTone(employee.leadershipScore)}`}>
                            {formatScore(employee.leadershipScore)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                              onClick={() => handleViewEmployee(employee)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <Dialog.Root
        open={employeeDetailsOpen}
        onOpenChange={(open) => {
          if (open) {
            setEmployeeDetailsOpen(true);
            return;
          }
          setEmployeeDetailsOpen(false);
          setSelectedEmployeeId(null);
          setAdminReview(null);
          setAdminReviewError(null);
          setAdminReviewEditing(false);
          setAdminReviewSaveError(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[10001] w-[min(900px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl outline-none max-h-[85vh]">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-4 rounded-md border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-200 hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>

            <div className="mb-5 flex items-start justify-between gap-3 pr-12">
              <div>
                <Dialog.Title className="text-lg font-semibold text-white">
                  Employee peer review
                </Dialog.Title>
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedEmployee?.employeeName ?? "Selected employee"}
                </p>
              </div>

              {selectedEmployee ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  onClick={() => {
                    setAdminReviewSaveError(null);
                    setAdminReviewEditing((prev) => !prev);
                  }}
                >
                  {adminReview?.feedback ? "Edit feedback" : "Give feedback"}
                </Button>
              ) : null}
            </div>

            {!selectedEmployee ? (
              <p className="text-sm text-zinc-500">No employee selected.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {selectedEmployee.employeeName}
                    </p>
                    <p
                      className={`text-sm font-semibold ${scoreTone(
                        selectedEmployee.leadershipScore,
                      )}`}
                    >
                      Leadership: {formatScore(selectedEmployee.leadershipScore)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {selectedEmployee.department} · {selectedEmployee.role} ·{" "}
                    {selectedEmployee.employmentType}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Admin feedback</p>
                    {adminReview ? (
                      <span className="text-xs text-zinc-400">
                        {new Date(adminReview.updatedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  {adminReviewError && (
                    <p className="mt-2 text-sm text-red-400">{adminReviewError}</p>
                  )}

                  {adminReviewLoading ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="size-4 animate-spin text-[#e78a53]" />
                      Loading admin feedback...
                    </div>
                  ) : adminReview ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-zinc-400">
                        {adminReview.reviewerName ?? "Admin"} ·{" "}
                        <span className="font-medium text-zinc-200">
                          {formatPeerReviewRating(adminReview.rating)}
                        </span>
                      </p>
                      <p className="text-sm text-zinc-200">{adminReview.feedback}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">No admin feedback yet.</p>
                  )}

                  {adminReviewEditing ? (
                    <div className="mt-4 space-y-3">
                      {adminReviewSaveError && (
                        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                          {adminReviewSaveError}
                        </p>
                      )}
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Rating</Label>
                          <select
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                            value={adminReviewRating}
                            onChange={(e) =>
                              setAdminReviewRating(
                                e.target.value as PeerReviewRatingValue,
                              )
                            }
                          >
                            {ratingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-zinc-300">Feedback</Label>
                        <textarea
                          rows={4}
                          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                          value={adminReviewFeedback}
                          onChange={(e) => setAdminReviewFeedback(e.target.value)}
                          placeholder="Write feedback..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          onClick={() => setAdminReviewEditing(false)}
                          disabled={adminReviewSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                          onClick={handleSaveAdminReview}
                          disabled={adminReviewSaving}
                        >
                          {adminReviewSaving ? "Saving..." : "Save feedback"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {Array.isArray(selectedEmployee.principleAverages) &&
                selectedEmployee.principleAverages.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.principleAverages.map((principle) => (
                      <div
                        key={principle.principleId}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">
                            {principle.principleName}
                          </p>
                          <span className="text-xs text-zinc-400">
                            {principle.ratingCount} rating
                            {principle.ratingCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">
                          Average rating: {formatAverageRating(principle.averageRating)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No aggregated principle results found for this employee.
                  </p>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create review period</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (creating) return;
                  setShowCreateModal(false);
                  setError(null);
                }}
              >
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Period name</Label>
                <Input
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="2026 Q2"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Period start</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Period end</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create period"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  onClick={() => {
                    if (creating) return;
                    setShowCreateModal(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
