"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GithubEmployeeReportResponse } from "@/lib/github-stats-api";
import type { TelegramSupportReportResponse } from "@/lib/telegram-support-api";
import type { TrelloEmployeeReportResponse } from "@/lib/trello-stats-api";
import type {
  EmployeeMetricSummaryResponse,
  EmployeeTimeSpentResponse,
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

const emptyTelegramReport: TelegramSupportReportResponse = {
  employeeId: 0,
  employeeName: "",
  telegramUsername: "",
  totals: {
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0,
  },
  averages: {
    msFromFirstStatusChangeToResolved: 0,
    msFromCreatedAtToResolved: 0,
  },
  countsByIssueType: [],
  recentTickets: [],
};

const isMissingTelegramUsername = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("telegram") && normalized.includes("not set");
};

export function EmployeeReport() {
  const [reportMonth, setReportMonth] = useState(getCurrentUTCMonth);
  const { periodStart, periodEnd } = useMemo(
    () => periodFromMonth(reportMonth, { capToToday: true }),
    [reportMonth],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<EmployeeMetricSummaryResponse | null>(
    null,
  );
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

  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [telegramReport, setTelegramReport] =
    useState<TelegramSupportReportResponse | null>(null);

  const [peerReviewScore, setPeerReviewScore] = useState<number | null | undefined>(undefined);
  const [peerReviewScoreLoading, setPeerReviewScoreLoading] = useState(false);

  const [connectedAccounts, setConnectedAccounts] = useState<{
    githubUsername?: string | null
    trelloUsername?: string | null
    telegramUsername?: string | null
  } | null>(null);
  const hasGithub = !!connectedAccounts?.githubUsername
  const hasTrello = !!connectedAccounts?.trelloUsername
  const hasTelegram = !!connectedAccounts?.telegramUsername

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/me/connected-accounts")
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return
      setConnectedAccounts(data)
    } catch {
      // silently fail
    }
  }, []);

  const telegramRange = useMemo(() => {
    if (!periodStart || !periodEnd) return null;
    return {
      from: `${periodStart}T00:00:00.000Z`,
      to: `${periodEnd}T23:59:59.999Z`,
    };
  }, [periodEnd, periodStart]);
  const telegramErrorToShow =
    telegramError && !isMissingTelegramUsername(telegramError) ? telegramError : "";

  const loadReport = useCallback(
    async (persistSnapshot: boolean = false) => {
      if (!periodStart || !periodEnd) {
        setError("Select a month.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("periodStart", periodStart);
        params.set("periodEnd", periodEnd);
        if (persistSnapshot) params.set("persistSnapshot", "true");
        const summaryRes = await fetch(
          `/api/employee/me/metrics?${params.toString()}`,
        );
        const summaryData = await summaryRes.json().catch(() => ({}));
        if (!summaryRes.ok) {
          throw new Error(
            (summaryData as { error?: string }).error ??
              "Failed to load metrics",
          );
        }
        setSummary(summaryData as EmployeeMetricSummaryResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [periodEnd, periodStart],
  );

  const loadTimeSpent = useCallback(async () => {
    if (!timeSpentDate) return;
    setTimeSpentError("");
    try {
      const params = new URLSearchParams({ date: timeSpentDate });
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        fetch(`/api/employee/me/time-spent/daily?${params.toString()}`),
        fetch(`/api/employee/me/time-spent/weekly?${params.toString()}`),
        fetch(`/api/employee/me/time-spent/monthly?${params.toString()}`),
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
  }, [timeSpentDate]);

  const loadGithubReport = useCallback(async () => {
    setGithubLoading(true);
    setGithubError("");
    try {
      const res = await fetch("/api/employee/me/github/report");
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
  }, []);

  const loadTrelloReport = useCallback(async () => {
    setTrelloLoading(true);
    setTrelloError("");
    try {
      const res = await fetch("/api/employee/me/trello/report");
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
  }, []);

  const loadTelegramReport = useCallback(async () => {
    if (!telegramRange) {
      setTelegramError("Select a month to load Telegram support stats.");
      return;
    }
    setTelegramLoading(true);
    setTelegramError("");
    try {
      const params = new URLSearchParams();
      params.set("from", telegramRange.from);
      params.set("to", telegramRange.to);
      const res = await fetch(
        `/api/employee/me/telegram/support/report?${params.toString()}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMessage =
          (data as { error?: string }).error ??
          "Failed to load Telegram support stats";
        if (res.status === 400) {
          setTelegramReport(emptyTelegramReport);
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
      setTelegramError(message);
      setTelegramReport(null);
    } finally {
      setTelegramLoading(false);
    }
  }, [telegramRange]);

  const loadPeerReviewLeadershipScore = useCallback(async () => {
    if (!periodStart || !periodEnd) {
      setPeerReviewScore(undefined);
      return;
    }
    setPeerReviewScoreLoading(true);
    setPeerReviewScore(undefined);
    try {
      const periodsRes = await fetch("/api/employee/me/peer-reviews/periods", {
        cache: "no-store",
      });
      if (!periodsRes.ok) return;
      const periods = await periodsRes.json().catch(() => []);
      if (!Array.isArray(periods)) return;

      const match = (
        periods as Array<{
          id: number;
          periodStart: string;
          periodEnd: string;
        }>
      ).find(
        (p) => p.periodStart === periodStart && p.periodEnd === periodEnd,
      );
      if (!match) return;

      const res = await fetch(
        `/api/employee/me/peer-reviews/periods/${match.id}/results`,
        { cache: "no-store" },
      );
      if (res.status === 404) return;
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));

      const score: number | null | undefined =
        (data as { employee?: { leadershipScore?: number | null } })?.employee
          ?.leadershipScore ??
        (data as { leadershipScore?: number | null })?.leadershipScore ??
        null;
      setPeerReviewScore(score);
    } catch {
      // silently fail
    } finally {
      setPeerReviewScoreLoading(false);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    fetchConnectedAccounts()
  }, [fetchConnectedAccounts])

  useEffect(() => {
    loadReport(false);
  }, [loadReport]);

  useEffect(() => {
    loadTimeSpent();
  }, [loadTimeSpent]);

  useEffect(() => {
    if (hasGithub) loadGithubReport()
  }, [loadGithubReport, hasGithub]);

  useEffect(() => {
    if (hasTrello) loadTrelloReport()
  }, [loadTrelloReport, hasTrello]);

  useEffect(() => {
    if (hasTelegram) loadTelegramReport()
  }, [loadTelegramReport, hasTelegram]);

  useEffect(() => {
    loadPeerReviewLeadershipScore();
  }, [loadPeerReviewLeadershipScore]);

  const renderScoreCard = (label: string, value: number | null | undefined) => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className={`text-2xl font-semibold ${scoreTone(value)}`}>
          {formatScore(value)}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${progressTone(value)}`}
          style={{ width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }}
        />
      </div>
    </div>
  );

  const renderTimeSpentCard = (
    label: string,
    data?: EmployeeTimeSpentResponse,
  ) => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
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
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Performance Report
            </h2>
            <p className="text-sm text-zinc-400">
              Track your progress and time spent in one place.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-xs text-zinc-300">
            <BarChart3 className="size-4 text-[#e78a53]" />
            Insights overview
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
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
          <div className="flex items-end gap-2">
            <Button
              className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              onClick={() => loadReport(false)}
            >
              Load report
            </Button>
            {/*<Button
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={() => loadReport(true)}
            >
              <Sparkles className="size-4" />
              Refresh snapshot
            </Button>*/}
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-7 animate-spin text-[#e78a53]" />
        </div>
      ) : summary ? (
        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4  lg:grid-cols-4">
              {renderScoreCard("Overall", summary.overallScore)}
              {/*{renderScoreCard("Leadership", peerReviewScoreLoading ? summary.leadershipScore : (peerReviewScore ?? summary.leadershipScore))}*/}
              {renderScoreCard("Attendance", summary.attendanceScore)}
              {/*{renderScoreCard("Task", summary.taskScore)}*/}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Task</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {summary.taskScore}
                </p>
                {/*<p className="mt-1 text-xs text-zinc-500">Resolved tickets</p>*/}
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Support</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {telegramReport?.totals?.resolved ?? "—"}
                </p>
                {/*<p className="mt-1 text-xs text-zinc-500">Resolved tickets</p>*/}
              </div>
            </div>
            {/*<div className="grid gap-4 md:grid-cols-2">*/}
              {/*<div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Strengths
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  {summary.strengthSummary || "No highlights yet."}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Opportunities
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  {summary.improvementSummary || "No areas flagged yet."}
                </p>
              </div>*/}
            {/*</div>*/}
          </div>
          {/*<div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Profile
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.employeeName}
            </p>
            <p className="text-sm text-zinc-400">
              {summary.role} · {summary.department}
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Status: {summary.employeeStatus}
            </p>
            <p className="text-sm text-zinc-400">
              Employment: {summary.employmentType}
            </p>
          </div>*/}
        </section>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
          Select a period and load your report.
        </div>
      )}

      {hasGithub ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Github Stats</h3>
              <p className="text-sm text-zinc-400">
                Your commits, PRs, reviews, and issues.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={loadGithubReport}
              disabled={githubLoading}
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
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Commits</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.totalCommits}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">PRs Opened</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.prsOpened}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">PRs Merged</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.prsMerged}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">PR Reviews</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.prReviews}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">PRs Closed</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.prsClosed}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Issues Opened</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.issuesOpened}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Issues Closed</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {githubReport.issuesClosed}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
              GitHub stats are not available for your account.
            </div>
          )}
        </section>
      ) : null}

      {hasTelegram ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
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
              onClick={loadTelegramReport}
              disabled={telegramLoading}
            >
              {telegramLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Reload
            </Button>
          </div>

          {telegramErrorToShow && (
            <p className="mb-3 text-sm text-red-400">{telegramErrorToShow}</p>
          )}

          {telegramLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-7 animate-spin text-[#e78a53]" />
            </div>
          ) : telegramReport ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Pending
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {telegramReport.totals.pending}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    In Progress
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {telegramReport.totals.inProgress}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Resolved
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {telegramReport.totals.resolved}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Total
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {telegramReport.totals.total}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    First Status → Resolved
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatDurationMs(
                      telegramReport.averages.msFromFirstStatusChangeToResolved,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Created → Resolved
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatDurationMs(
                      telegramReport.averages.msFromCreatedAtToResolved,
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
              Telegram support stats are not available for your account.
            </div>
          )}
        </section>
      ) : null}

      {hasTrello ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Trello Stats</h3>
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
              onClick={loadTrelloReport}
              disabled={trelloLoading}
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
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Cards Created
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {trelloReport.cardsCreated}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Cards Moved
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {trelloReport.cardsMoved}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Cards Archived
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {trelloReport.cardsArchived}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Comments Added
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {trelloReport.commentsAdded}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Check Items Done
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {trelloReport.checkItemsCompleted}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Attachments Added
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {trelloReport.attachmentsAdded}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
              Trello stats are not available for your account.
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Time Spent</h3>
            <p className="text-sm text-zinc-400">
              Daily, weekly, and monthly totals.
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
          </div>
        </div>
        {timeSpentError && (
          <p className="mb-3 text-sm text-red-400">{timeSpentError}</p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {renderTimeSpentCard("Daily", timeSpent.daily)}
          {renderTimeSpentCard("Weekly", timeSpent.weekly)}
          {renderTimeSpentCard("Monthly", timeSpent.monthly)}
        </div>
      </section>
    </div>
  );
}
