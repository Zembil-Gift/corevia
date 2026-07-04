"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BarChart3, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GithubEmployeeReportResponse } from "@/lib/github-stats-api";
import type { TelegramSupportReportResponse } from "@/lib/telegram-support-api";
import type { TrelloEmployeeReportResponse } from "@/lib/trello-stats-api";
import type {
  EmployeeMetricSummaryPage,
  EmployeeMetricSummaryResponse,
  EmployeeTimeSpentResponse,
  PeerReviewResponse,
  PeerReviewSummaryEmployeeResponse,
} from "@/lib/metrics-api";
import {
  getCurrentUTCMonth,
  getTodayUTCISODate,
  periodFromMonth,
} from "@/lib/period";

type TimeSpentState = {
  daily?: EmployeeTimeSpentResponse;
  weekly?: EmployeeTimeSpentResponse;
  monthly?: EmployeeTimeSpentResponse;
};

const formatScore = (value: number | null | undefined) =>
  typeof value === "number" ? `${value.toFixed(2)}%` : "—";

const scoreTone = (value: number | null | undefined) => {
  if (typeof value !== "number") return "text-zinc-400";
  if (value >= 85) return "text-emerald-400";
  if (value >= 70) return "text-amber-400";
  return "text-rose-400";
};

const progressTone = (value: number | null | undefined) => {
  if (typeof value !== "number") return "bg-zinc-700";
  if (value >= 90) return "bg-emerald-500";
  if (value >= 75) return "bg-amber-500";
  return "bg-rose-500";
};

const formatMinutes = (minutes: number | null | undefined) => {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.abs(minutes % 60);
  return `${hrs}h ${mins}m`;
};

const formatDurationMs = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const totalMinutes = Math.floor(value / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const isMissingTelegramUsername = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("telegram") && normalized.includes("not set");
};

export default function AdminMetricsPage() {
  const [reportMonth, setReportMonth] = useState(getCurrentUTCMonth);
  const { periodStart, periodEnd } = useMemo(
    () => periodFromMonth(reportMonth, { capToToday: true }),
    [reportMonth],
  );

  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [persistSnapshot, setPersistSnapshot] = useState(false);
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(0);
  const [metrics, setMetrics] = useState<EmployeeMetricSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailSummary, setDetailSummary] =
    useState<EmployeeMetricSummaryResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [timeSpentDate, setTimeSpentDate] = useState(getTodayUTCISODate);
  const [timeSpent, setTimeSpent] = useState<TimeSpentState>({});
  const [timeSpentError, setTimeSpentError] = useState("");

  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [githubReport, setGithubReport] =
    useState<GithubEmployeeReportResponse | null>(null);

  const [trelloLoading, setTrelloLoading] = useState(false);
  const [trelloError, setTrelloError] = useState("");
  const [trelloReport, setTrelloReport] =
    useState<TrelloEmployeeReportResponse | null>(null);

  const [employeesWithTelegram, setEmployeesWithTelegram] = useState<
    Set<number>
  >(new Set());

  const [connectedAccountsMap, setConnectedAccountsMap] = useState<
    Record<number, { githubUsername?: string | null; trelloUsername?: string | null; telegramUsername?: string | null }>
  >({});
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [telegramReport, setTelegramReport] =
    useState<TelegramSupportReportResponse | null>(null);

  const [peerReviews, setPeerReviews] = useState<PeerReviewResponse[]>([]);
  const [peerReviewsError, setPeerReviewsError] = useState("");
  const [peerReviewSummaryByEmployeeId, setPeerReviewSummaryByEmployeeId] =
    useState<Record<number, PeerReviewSummaryEmployeeResponse>>({});
  const [peerReviewSummaryError, setPeerReviewSummaryError] = useState("");

  const [githubSyncLoading, setGithubSyncLoading] = useState(false);
  const [githubSyncMessage, setGithubSyncMessage] = useState("");
  const [trelloSyncLoading, setTrelloSyncLoading] = useState(false);
  const [trelloSyncMessage, setTrelloSyncMessage] = useState("");

  const averageOverall = useMemo(() => {
    const scored = metrics
      .map((m) => m.overallScore)
      .filter((score): score is number => typeof score === "number");
    if (scored.length === 0) return null;
    const total = scored.reduce((sum, score) => sum + score, 0);
    return total / scored.length;
  }, [metrics]);

  const telegramRange = useMemo(() => {
    if (!periodStart || !periodEnd) return null;
    return {
      from: `${periodStart}T00:00:00.000Z`,
      to: `${periodEnd}T23:59:59.999Z`,
    };
  }, [periodEnd, periodStart]);

  const loadEmployeesWithTelegram = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/employees/with-telegram?size=1000");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const ids = new Set<number>();
      const content = (data as { content?: Array<{ id: number }> }).content;
      if (Array.isArray(content)) {
        content.forEach((emp) => {
          if (typeof emp.id === "number") ids.add(emp.id);
        });
      }
      setEmployeesWithTelegram(ids);
    } catch {
      // silently fail, telegram reports will just not be available
    }
  }, []);

  const loadConnectedAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/employees/connected-accounts?size=1000");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const map: Record<number, { githubUsername?: string | null; trelloUsername?: string | null; telegramUsername?: string | null }> = {};
      const content = (data as { content?: Array<{ employeeId: number; githubUsername?: string | null; trelloUsername?: string | null; telegramUsername?: string | null }> }).content;
      if (Array.isArray(content)) {
        content.forEach((emp) => {
          if (typeof emp.employeeId === "number") {
            map[emp.employeeId] = {
              githubUsername: emp.githubUsername,
              trelloUsername: emp.trelloUsername,
              telegramUsername: emp.telegramUsername,
            };
          }
        });
      }
      setConnectedAccountsMap(map);
    } catch {
      // silently fail
    }
  }, []);

  const buildMetricsParams = useCallback(
    (pageValue: number) => {
      const params = new URLSearchParams();
      params.set("periodStart", periodStart);
      params.set("periodEnd", periodEnd);
      params.set("page", String(pageValue));
      params.set("size", String(size));
      params.set("sortBy", "createdAt");
      params.set("direction", "desc");
      if (department.trim()) params.set("department", department.trim());
      if (role.trim()) params.set("role", role.trim());
      if (persistSnapshot) params.set("persistSnapshot", "true");
      return params;
    },
    [department, periodEnd, periodStart, persistSnapshot, role, size],
  );

  const loadMetrics = useCallback(
    async (pageValue: number) => {
      if (!periodStart || !periodEnd) {
        setError("Select a month.");
        return;
      }
      setLoading(true);
      setError("");
      setPeerReviewSummaryError("");
      try {
        const params = buildMetricsParams(pageValue);
        const metricsRes = await fetch(
          `/api/admin/metrics/employees?${params.toString()}`,
        );

        if (!metricsRes.ok) {
          const data = await metricsRes.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ?? "Failed to load metrics",
          );
        }

        const data = (await metricsRes.json()) as EmployeeMetricSummaryPage;
        setMetrics(Array.isArray(data.content) ? data.content : []);
        setTotalPages(
          typeof data.totalPages === "number" ? data.totalPages : 0,
        );
        setTotalElements(
          typeof data.totalElements === "number" ? data.totalElements : 0,
        );
        setPage(typeof data.number === "number" ? data.number : pageValue);

        try {
          const summaryParams = new URLSearchParams({ periodStart, periodEnd });
          const peerSummaryRes = await fetch(
            `/api/admin/metrics/peer-reviews/summary?${summaryParams.toString()}`,
          );
          const peerSummaryData = await peerSummaryRes.json().catch(() => []);

          if (!peerSummaryRes.ok) {
            setPeerReviewSummaryError(
              (peerSummaryData as { error?: string }).error ??
                "Failed to load peer review summary",
            );
            setPeerReviewSummaryByEmployeeId({});
          } else {
            const map: Record<number, PeerReviewSummaryEmployeeResponse> = {};
            (Array.isArray(peerSummaryData) ? peerSummaryData : []).forEach(
              (item) => {
                const entry = item as Partial<PeerReviewSummaryEmployeeResponse>;
                if (typeof entry.employeeId === "number") {
                  map[entry.employeeId] =
                    item as PeerReviewSummaryEmployeeResponse;
                }
              },
            );
            setPeerReviewSummaryByEmployeeId(map);
          }
        } catch (err) {
          setPeerReviewSummaryError(
            err instanceof Error
              ? err.message
              : "Failed to load peer review summary",
          );
          setPeerReviewSummaryByEmployeeId({});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metrics");
        setMetrics([]);
        setTotalPages(0);
        setTotalElements(0);
        setPeerReviewSummaryByEmployeeId({});
      } finally {
        setLoading(false);
      }
    },
    [buildMetricsParams, periodEnd, periodStart],
  );

  const loadDetails = useCallback(
    async (employeeId: number) => {
      if (!periodStart || !periodEnd) return;
      setDetailLoading(true);
      setDetailError("");
      setPeerReviewsError("");
      try {
        const params = new URLSearchParams();
        params.set("periodStart", periodStart);
        params.set("periodEnd", periodEnd);
        if (persistSnapshot) params.set("persistSnapshot", "true");
        const [summaryRes, reviewsRes] = await Promise.all([
          fetch(
            `/api/admin/metrics/employees/${employeeId}?${params.toString()}`,
          ),
          fetch(
            `/api/admin/metrics/peer-reviews?${new URLSearchParams({
              periodStart,
              periodEnd,
              revieweeId: String(employeeId),
            }).toString()}`,
          ),
        ]);
        if (!summaryRes.ok) {
          const data = await summaryRes.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ??
              "Failed to load employee metrics",
          );
        }
        const summaryData =
          (await summaryRes.json()) as EmployeeMetricSummaryResponse;
        setDetailSummary(summaryData);

        const reviewsData = await reviewsRes.json().catch(() => []);
        if (!reviewsRes.ok) {
          setPeerReviewsError(
            (reviewsData as { error?: string }).error ??
              "Failed to load peer reviews",
          );
          setPeerReviews([]);
        } else {
          setPeerReviews(Array.isArray(reviewsData) ? reviewsData : []);
        }
      } catch (err) {
        setDetailError(
          err instanceof Error
            ? err.message
            : "Failed to load employee metrics",
        );
        setDetailSummary(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [periodEnd, periodStart, persistSnapshot],
  );

  const loadTimeSpent = useCallback(
    async (employeeId: number) => {
      if (!timeSpentDate) {
        setTimeSpentError("Pick a date to load time spent.");
        return;
      }
      setTimeSpentError("");
      try {
        const dateParams = new URLSearchParams({ date: timeSpentDate });
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          fetch(
            `/api/admin/metrics/employees/${employeeId}/time-spent/daily?${dateParams.toString()}`,
          ),
          fetch(
            `/api/admin/metrics/employees/${employeeId}/time-spent/weekly?${dateParams.toString()}`,
          ),
          fetch(
            `/api/admin/metrics/employees/${employeeId}/time-spent/monthly?${dateParams.toString()}`,
          ),
        ]);
        const dailyData = await dailyRes.json().catch(() => ({}));
        const weeklyData = await weeklyRes.json().catch(() => ({}));
        const monthlyData = await monthlyRes.json().catch(() => ({}));
        if (!dailyRes.ok || !weeklyRes.ok || !monthlyRes.ok) {
          const message =
            (dailyData as { error?: string }).error ||
            (weeklyData as { error?: string }).error ||
            (monthlyData as { error?: string }).error ||
            "Failed to load time spent";
          setTimeSpentError(message);
          setTimeSpent({});
          return;
        }
        setTimeSpent({
          daily: dailyData as EmployeeTimeSpentResponse,
          weekly: weeklyData as EmployeeTimeSpentResponse,
          monthly: monthlyData as EmployeeTimeSpentResponse,
        });
      } catch (err) {
        setTimeSpentError(
          err instanceof Error ? err.message : "Failed to load time spent",
        );
        setTimeSpent({});
      }
    },
    [timeSpentDate],
  );

  const loadGithubReport = useCallback(async (employeeId: number) => {
    if (!connectedAccountsMap[employeeId]?.githubUsername) {
      setGithubReport(null);
      return;
    }
    setGithubLoading(true);
    setGithubError("");
    try {
      const res = await fetch(`/api/admin/github/report/${employeeId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to load GitHub stats",
        );
      }
      setGithubReport(data as GithubEmployeeReportResponse);
    } catch (err) {
      setGithubError(
        err instanceof Error ? err.message : "Failed to load GitHub stats",
      );
      setGithubReport(null);
    } finally {
      setGithubLoading(false);
    }
  }, [connectedAccountsMap]);

  const loadTrelloReport = useCallback(async (employeeId: number) => {
    if (!connectedAccountsMap[employeeId]?.trelloUsername) {
      setTrelloReport(null);
      return;
    }
    setTrelloLoading(true);
    setTrelloError("");
    try {
      const res = await fetch(`/api/admin/trello/report/${employeeId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to load Trello stats",
        );
      }
      setTrelloReport(data as TrelloEmployeeReportResponse);
    } catch (err) {
      setTrelloError(
        err instanceof Error ? err.message : "Failed to load Trello stats",
      );
      setTrelloReport(null);
    } finally {
      setTrelloLoading(false);
    }
  }, [connectedAccountsMap]);

  const loadTelegramReport = useCallback(
    async (employeeId: number) => {
      if (!telegramRange) {
        setTelegramError("Select a month to load Telegram support stats.");
        return;
      }
      if (!employeesWithTelegram.has(employeeId) || !connectedAccountsMap[employeeId]?.telegramUsername) {
        setTelegramReport(null);
        return;
      }
      setTelegramLoading(true);
      setTelegramError("");
      try {
        const params = new URLSearchParams();
        params.set("from", telegramRange.from);
        params.set("to", telegramRange.to);
        const res = await fetch(
          `/api/admin/telegram/support/report/${employeeId}?${params.toString()}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errorMessage =
            (data as { error?: string }).error ??
            "Failed to load Telegram support stats";
          if (res.status === 400 && isMissingTelegramUsername(errorMessage)) {
            setTelegramReport(null);
            setTelegramError("");
            return;
          }
          throw new Error(errorMessage);
        }
        setTelegramReport(data as TelegramSupportReportResponse);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load Telegram support stats";
        if (isMissingTelegramUsername(message)) {
          setTelegramReport(null);
          setTelegramError("");
          return;
        }
        setTelegramError(message);
        setTelegramReport(null);
      } finally {
        setTelegramLoading(false);
      }
    },
    [telegramRange, employeesWithTelegram, connectedAccountsMap],
  );

  const handleSearch = () => {
    loadMetrics(0);
    if (selectedEmployeeId) {
      loadDetails(selectedEmployeeId);
      loadTimeSpent(selectedEmployeeId);
      loadGithubReport(selectedEmployeeId);
      loadTrelloReport(selectedEmployeeId);
    }
  };

  useEffect(() => {
    loadMetrics(0);
  }, [loadMetrics]);

  useEffect(() => {
    loadEmployeesWithTelegram();
    loadConnectedAccounts();
  }, [loadEmployeesWithTelegram, loadConnectedAccounts]);

  const handleSelect = (summary: EmployeeMetricSummaryResponse) => {
    setSelectedEmployeeId(summary.employeeId);
    setSelectedEmployeeName(summary.employeeName);
    setDetailsOpen(true);

    setDetailSummary(null);
    setDetailError("");
    setPeerReviews([]);
    setPeerReviewsError("");
    setTimeSpent({});
    setTimeSpentError("");

    setGithubReport(null);
    setGithubError("");
    setTrelloReport(null);
    setTrelloError("");
    setTelegramReport(null);
    setTelegramError("");

    loadDetails(summary.employeeId);
    loadTimeSpent(summary.employeeId);
    loadGithubReport(summary.employeeId);
    loadTrelloReport(summary.employeeId);
    loadTelegramReport(summary.employeeId);
  };

  const handleSnapshotRefresh = async () => {
    if (!selectedEmployeeId) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      const params = new URLSearchParams({ periodStart, periodEnd });
      const res = await fetch(
        `/api/admin/metrics/employees/${selectedEmployeeId}/snapshot?${params.toString()}`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to refresh snapshot",
        );
      }
      setDetailSummary(data as EmployeeMetricSummaryResponse);
      setMetrics((prev) =>
        prev.map((item) =>
          item.employeeId === selectedEmployeeId
            ? (data as EmployeeMetricSummaryResponse)
            : item,
        ),
      );
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Failed to refresh snapshot",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGithubSync = async () => {
    setGithubSyncLoading(true);
    setGithubSyncMessage("");
    try {
      const res = await fetch("/api/admin/github/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to sync GitHub",
        );
      }
      const payload = data as { message?: string; syncedCount?: number };
      const count =
        typeof payload.syncedCount === "number"
          ? ` (${payload.syncedCount})`
          : "";
      setGithubSyncMessage(
        `${payload.message ?? "GitHub sync triggered"}${count}`,
      );
    } catch (err) {
      setGithubSyncMessage(
        err instanceof Error ? err.message : "Failed to sync GitHub",
      );
    } finally {
      setGithubSyncLoading(false);
    }
  };

  const handleTrelloSync = async () => {
    setTrelloSyncLoading(true);
    setTrelloSyncMessage("");
    try {
      const res = await fetch("/api/admin/trello/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to sync Trello",
        );
      }
      const payload = data as { message?: string; syncedCount?: number };
      const count =
        typeof payload.syncedCount === "number"
          ? ` (${payload.syncedCount})`
          : "";
      setTrelloSyncMessage(
        `${payload.message ?? "Trello sync triggered"}${count}`,
      );
    } catch (err) {
      setTrelloSyncMessage(
        err instanceof Error ? err.message : "Failed to sync Trello",
      );
    } finally {
      setTrelloSyncLoading(false);
    }
  };

  const renderTimeSpentCard = (
    label: string,
    data?: EmployeeTimeSpentResponse,
  ) => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-semibold text-white">
          {data ? `${data.completionPercent.toFixed(1)}%` : "—"}
        </span>
        <span className="text-xs text-zinc-400">
          {data ? `${data.periodStart} → ${data.periodEnd}` : ""}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${progressTone(data?.completionPercent ?? null)}`}
          style={{
            width: `${Math.min(Math.max(data?.completionPercent ?? 0, 0), 100)}%`,
          }}
        />
      </div>
      <div className="mt-3 grid gap-1 text-xs text-zinc-400">
        <span>Worked: {data ? formatMinutes(data.workedMinutes) : "—"}</span>
        <span>
          Required: {data ? formatMinutes(data.requiredMinutes) : "—"}
        </span>
        <span>
          Remaining: {data ? formatMinutes(data.remainingMinutes) : "—"}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Metrics Report</h1>
          <p className="mt-1 text-zinc-400">
            Track employee performance scores, attendance insights, and peer
            feedback.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300">
            <BarChart3 className="size-4 text-[#e78a53]" />
            Insights dashboard
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={handleGithubSync}
              disabled={githubSyncLoading}
            >
              {githubSyncLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Sync GitHub
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={handleTrelloSync}
              disabled={trelloSyncLoading}
            >
              {trelloSyncLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Sync Trello
            </Button>
          </div>
        </div>
      </div>

      {(githubSyncMessage || trelloSyncMessage) && (
        <div className="mb-4 flex flex-col gap-2 text-sm text-zinc-300">
          {githubSyncMessage && (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              {githubSyncMessage}
            </p>
          )}
          {trelloSyncMessage && (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              {trelloSyncMessage}
            </p>
          )}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label className="text-zinc-300">Month</Label>
            <Input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
            />
            {/*<p className="text-xs text-zinc-500">
              Period: {periodStart} → {periodEnd}
            </p>*/}
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Department</Label>
            <Input
              placeholder="e.g. ENGINEERING"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Role</Label>
            <Input
              placeholder="e.g. DEVELOPER"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Page size</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={size}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSize(
                  Number.isFinite(next) && next > 0
                    ? Math.min(Math.floor(next), 100)
                    : 10,
                );
              }}
            />
          </div>
          <div className="flex flex-col justify-end gap-2">
            {/*<div className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                id="persist-snapshot"
                type="checkbox"
                checked={persistSnapshot}
                onChange={(e) => setPersistSnapshot(e.target.checked)}
                className="accent-[#e78a53]"
              />
              <label htmlFor="persist-snapshot">Persist snapshot</label>
            </div>*/}
            <Button
              className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              onClick={handleSearch}
            >
              Load report
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Employees in report
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {totalElements ? totalElements : metrics.length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Average overall
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${scoreTone(averageOverall)}`}
          >
            {averageOverall ? `${averageOverall.toFixed(2)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Snapshot mode
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
            <Sparkles className="size-4 text-[#e78a53]" />
            {persistSnapshot ? "Persisting snapshots" : "Live metrics"}
          </p>
        </div>
      </section>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {peerReviewSummaryError && (
        <p className="mb-4 text-sm text-red-400">{peerReviewSummaryError}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
          No metrics data yet. Pick a period and load the report.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900">
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Overall</th>
                {/*<th className="px-4 py-3">Leadership</th>
                <th className="px-4 py-3">Peer review</th>*/}
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Support</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((summary) => {
                const isActive = selectedEmployeeId === summary.employeeId;
                const peerSummary =
                  peerReviewSummaryByEmployeeId[summary.employeeId];
                return (
                  <tr
                    key={summary.employeeId}
                    className={`border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/30 ${
                      isActive ? "bg-zinc-800/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {summary.employeeName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {summary.periodStart} → {summary.periodEnd}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{summary.role}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {summary.department}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${scoreTone(summary.overallScore)}`}
                    >
                      {formatScore(summary.overallScore)}
                    </td>
                    {/*<td
                      className={`px-4 py-3 ${scoreTone(summary.leadershipScore)}`}
                    >
                      {formatScore(summary.leadershipScore)}
                    </td>
                    <td
                      className={`px-4 py-3 ${scoreTone(peerSummary?.leadershipScore)}`}
                    >
                      <div className="flex flex-col">
                        <span>{formatScore(peerSummary?.leadershipScore)}</span>
                        {peerSummary && (
                          <span className="text-xs text-zinc-500">
                            {peerSummary.ratingCount} rating
                            {peerSummary.ratingCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </td>*/}
                    <td
                      className={`px-4 py-3 ${scoreTone(summary.attendanceScore)}`}
                    >
                      {formatScore(summary.attendanceScore)}
                    </td>
                    <td className={`px-4 py-3 ${scoreTone(summary.taskScore)}`}>
                      {formatScore(summary.taskScore)}
                    </td>
                    <td
                      className={`px-4 py-3 ${scoreTone(summary.supportScore)}`}
                    >
                      {formatScore(summary.supportScore)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                        onClick={() => handleSelect(summary)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              disabled={page <= 0}
              onClick={() => loadMetrics(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              disabled={page >= totalPages - 1}
              onClick={() => loadMetrics(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog.Root
        open={detailsOpen}
        onOpenChange={(open) => {
          if (open) {
            setDetailsOpen(true);
            return;
          }
          setDetailsOpen(false);
          setSelectedEmployeeId(null);
          setSelectedEmployeeName("");
          setDetailSummary(null);
          setDetailError("");
          setPeerReviews([]);
          setPeerReviewsError("");
          setTimeSpent({});
          setTimeSpentError("");
          setGithubReport(null);
          setGithubError("");
          setGithubLoading(false);
          setTrelloReport(null);
          setTrelloError("");
          setTrelloLoading(false);
          setTelegramReport(null);
          setTelegramError("");
          setTelegramLoading(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[10001] w-[min(1200px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl outline-none max-h-[85vh]">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-4 rounded-md border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-200 hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>

            <div className="mb-5 pr-12">
              <Dialog.Title className="text-lg font-semibold text-white">
                Employee Report
              </Dialog.Title>
              <p className="mt-1 text-sm text-zinc-400">
                {selectedEmployeeName ||
                  detailSummary?.employeeName ||
                  "Selected employee"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Period: {periodStart} → {periodEnd}
              </p>
            </div>

            {selectedEmployeeId ? (
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-zinc-400">Metrics</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                      onClick={handleSnapshotRefresh}
                      disabled={detailLoading}
                    >
                      <RefreshCw className="size-4" />
                      Refresh snapshot
                    </Button>
                  </div>

                  {detailError && (
                    <p className="mb-4 text-sm text-red-400">{detailError}</p>
                  )}

                  {detailLoading && !detailSummary ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="size-4 animate-spin text-[#e78a53]" />
                      Loading employee metrics...
                    </div>
                  ) : detailSummary ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          {
                            label: "Overall",
                            value: detailSummary.overallScore,
                          },
                          {
                            label: "Leadership",
                            value: detailSummary.leadershipScore,
                          },
                          {
                            label: "Attendance",
                            value: detailSummary.attendanceScore,
                          },
                          { label: "Task", value: detailSummary.taskScore },
                          {
                            label: "Support",
                            value: detailSummary.supportScore,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4"
                          >
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              {item.label}
                            </p>
                            <p
                              className={`mt-2 text-2xl font-semibold ${scoreTone(item.value)}`}
                            >
                              {formatScore(item.value)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Strength
                          </p>
                          <p className="mt-2 text-sm text-zinc-200">
                            {detailSummary.strengthSummary ||
                              "No summary available yet."}
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Improvement
                          </p>
                          <p className="mt-2 text-sm text-zinc-200">
                            {detailSummary.improvementSummary ||
                              "No summary available yet."}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No employee metrics loaded.
                    </p>
                  )}

                  {selectedEmployeeId && connectedAccountsMap[selectedEmployeeId]?.githubUsername ? (
                    <div className="mt-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Github Stats
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Commits, PRs, reviews, and issues.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          onClick={() =>
                            selectedEmployeeId && loadGithubReport(selectedEmployeeId)
                          }
                          disabled={!selectedEmployeeId || githubLoading}
                        >
                          {githubLoading ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 size-4" />
                          )}
                          Reload
                        </Button>
                      </div>

                      {githubError && (
                        <p className="mb-3 text-sm text-red-400">{githubError}</p>
                      )}

                      {githubLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-7 animate-spin text-[#e78a53]" />
                        </div>
                      ) : githubReport ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Commits
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.totalCommits}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              PRs Opened
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.prsOpened}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              PRs Merged
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.prsMerged}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              PRs Closed
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.prsClosed}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              PR Reviews
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.prReviews}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Issues Opened
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.issuesOpened}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Issues Closed
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {githubReport.issuesClosed}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          GitHub stats are not available for this employee.
                        </p>
                      )}
                    </div>
                  ) : selectedEmployeeId ? (
                    <div className="mt-8">
                      <h3 className="text-base font-semibold text-white">Github Stats</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        GitHub is not connected for this employee.
                      </p>
                    </div>
                  ) : null}

                  {selectedEmployeeId && connectedAccountsMap[selectedEmployeeId]?.trelloUsername ? (
                    <div className="mt-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Trello Stats
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Cards, comments, and checklist activity.
                          </p>
                          {trelloReport?.trelloUsername && (
                            <p className="text-xs text-zinc-500">
                              @{trelloReport.trelloUsername}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          onClick={() =>
                            selectedEmployeeId &&
                            loadTrelloReport(selectedEmployeeId)
                          }
                          disabled={!selectedEmployeeId || trelloLoading}
                        >
                          {trelloLoading ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 size-4" />
                          )}
                          Reload
                        </Button>
                      </div>

                      {trelloError && (
                        <p className="mb-3 text-sm text-red-400">{trelloError}</p>
                      )}

                      {trelloLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-7 animate-spin text-[#e78a53]" />
                        </div>
                      ) : trelloReport ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Cards Created
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {trelloReport.cardsCreated}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Cards Moved
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {trelloReport.cardsMoved}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Cards Archived
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {trelloReport.cardsArchived}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Comments Added
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {trelloReport.commentsAdded}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Check Items Done
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {trelloReport.checkItemsCompleted}
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Attachments Added
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {trelloReport.attachmentsAdded}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          Trello stats are not available for this employee.
                        </p>
                      )}
                    </div>
                  ) : selectedEmployeeId ? (
                    <div className="mt-8">
                      <h3 className="text-base font-semibold text-white">Trello Stats</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        Trello is not connected for this employee.
                      </p>
                    </div>
                  ) : null}

                  {selectedEmployeeId && connectedAccountsMap[selectedEmployeeId]?.telegramUsername ? (
                    <div className="mt-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Telegram Support
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Ticket totals and resolution timing.
                          </p>
                          {telegramReport?.telegramUsername && (
                            <p className="text-xs text-zinc-500">
                              @{telegramReport.telegramUsername}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          onClick={() =>
                            selectedEmployeeId &&
                            loadTelegramReport(selectedEmployeeId)
                          }
                          disabled={!selectedEmployeeId || telegramLoading}
                        >
                          {telegramLoading ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 size-4" />
                          )}
                          Reload
                        </Button>
                      </div>

                      {telegramError && (
                        <p className="mb-3 text-sm text-red-400">
                          {telegramError}
                        </p>
                      )}

                      {!employeesWithTelegram.has(
                        selectedEmployeeId,
                      ) ? (
                        <p className="text-sm text-zinc-500">
                          Telegram is not configured for this employee.
                        </p>
                      ) : telegramLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-7 animate-spin text-[#e78a53]" />
                        </div>
                      ) : telegramReport ? (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-500">
                                Pending
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-white">
                                {telegramReport.totals.pending}
                              </p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-500">
                                In Progress
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-white">
                                {telegramReport.totals.inProgress}
                              </p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-500">
                                Resolved
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-white">
                                {telegramReport.totals.resolved}
                              </p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-500">
                                Total
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-white">
                                {telegramReport.totals.total}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-500">
                                First Status → Resolved
                              </p>
                              <p className="mt-2 text-xl font-semibold text-white">
                                {formatDurationMs(
                                  telegramReport.averages
                                    .msFromFirstStatusChangeToResolved,
                                )}
                              </p>
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-500">
                                Created → Resolved
                              </p>
                              <p className="mt-2 text-xl font-semibold text-white">
                                {formatDurationMs(
                                  telegramReport.averages
                                    .msFromCreatedAtToResolved,
                                )}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          Telegram support stats are not available.
                        </p>
                      )}
                    </div>
                  ) : selectedEmployeeId ? (
                    <div className="mt-8">
                      <h3 className="text-base font-semibold text-white">Telegram Support</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        Telegram is not connected for this employee.
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-8">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Time Spent
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Daily, weekly, and monthly attendance totals.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-zinc-400">Date</Label>
                        <Input
                          type="date"
                          value={timeSpentDate}
                          onChange={(e) => setTimeSpentDate(e.target.value)}
                          className="w-40"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          onClick={() =>
                            selectedEmployeeId &&
                            loadTimeSpent(selectedEmployeeId)
                          }
                        >
                          Reload
                        </Button>
                      </div>
                    </div>
                    {timeSpentError && (
                      <p className="mb-3 text-sm text-red-400">
                        {timeSpentError}
                      </p>
                    )}
                    <div className="grid gap-4 md:grid-cols-3">
                      {renderTimeSpentCard("Daily", timeSpent.daily)}
                      {renderTimeSpentCard("Weekly", timeSpent.weekly)}
                      {renderTimeSpentCard("Monthly", timeSpent.monthly)}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <h3 className="text-base font-semibold text-white">
                    Peer Reviews
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Feedback collected for the selected period.
                  </p>
                  {peerReviewsError && (
                    <p className="mt-3 text-sm text-red-400">
                      {peerReviewsError}
                    </p>
                  )}
                  <div className="mt-4 space-y-3">
                    {peerReviews.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No peer reviews found for this period.
                      </p>
                    ) : (
                      peerReviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">
                              {review.principleName}
                            </p>
                            <span
                              className={`text-xs font-medium ${scoreTone(
                                review.rating === "EXCEEDS_THE_BAR"
                                  ? 90
                                  : review.rating === "MEETS_THE_BAR"
                                    ? 75
                                    : 50,
                              )}`}
                            >
                              {review.rating.replace(/_/g, " ")}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm text-zinc-300">
                              {review.comment}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-500">
                            {new Date(review.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Select an employee to view the detailed report.
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
