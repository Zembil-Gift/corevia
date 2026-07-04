"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EmployeePaymentApi } from "@/lib/employees-api"

type PayrollTab = "due" | "paid"

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<PayrollTab>("due")
  const [duePayments, setDuePayments] = useState<EmployeePaymentApi[]>([])
  const [paidPayments, setPaidPayments] = useState<EmployeePaymentApi[]>([])
  const [paidFilterMonth, setPaidFilterMonth] = useState(getCurrentMonthValue())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [transactionRefs, setTransactionRefs] = useState<Record<number, string>>({})
  const [paidAmounts, setPaidAmounts] = useState<Record<number, string>>({})

  const fetchDuePayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/payments/due", { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to load due payments")
      }
      const data = await res.json()
      setDuePayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load due payments")
      setDuePayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPaidPayments = useCallback(async (monthValue?: string) => {
    setLoading(true)
    setError(null)
    try {
      let url = "/api/admin/payments/paid"
      if (monthValue) {
        const [year, month] = monthValue.split("-")
        if (year && month) {
          const params = new URLSearchParams({ year, month: String(Number(month)) })
          url = `/api/admin/payments/paid/filter?${params.toString()}`
        }
      }

      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to load paid payrolls")
      }
      const data = await res.json()
      setPaidPayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load paid payrolls")
      setPaidPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDuePayments()
  }, [fetchDuePayments])

  useEffect(() => {
    if (activeTab === "paid") {
      fetchPaidPayments(paidFilterMonth)
    }
  }, [activeTab, fetchPaidPayments, paidFilterMonth])

  const formatMoney = (amountMinor: number | null) =>
    amountMinor === null
      ? "-"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(amountMinor / 100)

  const handleMarkPaid = async (payment: EmployeePaymentApi) => {
    const transactionReference = (transactionRefs[payment.id] ?? "").trim()
    if (!transactionReference) {
      setError(`Transaction reference is required for ${payment.employeeName}`)
      return
    }

    setSubmittingId(payment.id)
    setError(null)
    try {
      const paidAmountRaw = (paidAmounts[payment.id] ?? "").trim()
      const payload: { transactionReference: string; paidAmountMinor?: number } = {
        transactionReference,
      }
      if (paidAmountRaw) {
        payload.paidAmountMinor = Number(paidAmountRaw)
      }

      const res = await fetch(`/api/admin/payments/${payment.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to mark payment as paid")
      }
      await fetchDuePayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark payment as paid")
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Payroll</h1>
        <p className="mt-1 text-zinc-400">Review due and paid payrolls.</p>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          onClick={() => setActiveTab("due")}
          className={
            activeTab === "due"
              ? "bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }
        >
          Due
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTab("paid")}
          className={
            activeTab === "paid"
              ? "bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }
        >
          Paid
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {activeTab === "paid" && (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="paid-filter-month" className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">
              Month
            </label>
            <Input
              id="paid-filter-month"
              type="month"
              value={paidFilterMonth}
              onChange={(e) => setPaidFilterMonth(e.target.value)}
              className="w-48 border-zinc-700 bg-zinc-800 text-white"
            />
          </div>
          {/* <Button
            type="button"
            onClick={() => fetchPaidPayments(paidFilterMonth)}
            className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
          >
            Apply Filter
          </Button> */}
          <Button
            type="button"
            onClick={() => {
              setPaidFilterMonth("")
              fetchPaidPayments()
            }}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Clear
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : activeTab === "due" && duePayments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          No due payments found.
        </div>
      ) : activeTab === "paid" && paidPayments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          No paid payrolls found.
        </div>
      ) : activeTab === "due" ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Employee</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Cycle</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Due date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Mark paid</th>
              </tr>
            </thead>
            <tbody>
              {duePayments.map((payment) => (
                <tr key={payment.id} className="border-b border-zinc-800/80 align-top last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{payment.employeeName}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.cycleStartDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.dueDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.amountMinor)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-72 gap-2">
                      <Input
                        value={transactionRefs[payment.id] ?? ""}
                        onChange={(e) =>
                          setTransactionRefs((prev) => ({ ...prev, [payment.id]: e.target.value }))
                        }
                        placeholder="Transaction reference"
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Input
                        value={paidAmounts[payment.id] ?? ""}
                        onChange={(e) => setPaidAmounts((prev) => ({ ...prev, [payment.id]: e.target.value }))}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Paid amount (minor)"
                        className="w-44 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Button
                        type="button"
                        disabled={submittingId === payment.id}
                        onClick={() => handleMarkPaid(payment)}
                        className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                      >
                        {submittingId === payment.id ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Saving
                          </>
                        ) : (
                          "Mark Paid"
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Employee</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Cycle</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Due date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Paid amount</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Transaction ref
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Paid at</th>
              </tr>
            </thead>
            <tbody>
              {paidPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-zinc-800/80 align-top last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{payment.employeeName}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.cycleStartDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.dueDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.amountMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.paidAmountMinor)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{payment.transactionReference ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
