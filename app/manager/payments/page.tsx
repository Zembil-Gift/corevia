"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang, pick } from "@/lib/i18n"
import type { EmployeePaymentApi } from "@/lib/employees-api"

const t = {
  payroll: { en: "Payroll", am: "ደመወዝ" },
  due: { en: "Due", am: "የሚከፈል" },
  paid: { en: "Paid", am: "የተከፈለ" },
  month: { en: "Month", am: "ወር" },
  clear: { en: "Clear", am: "አጽዳ" },
  noDue: { en: "No due payments found.", am: "የሚከፈል ክፍያ አልተገኘም።" },
  noPaid: { en: "No paid payrolls found.", am: "የተከፈለ ደመወዝ አልተገኘም።" },
  employee: { en: "Employee", am: "ሰራተኛ" },
  cycle: { en: "Cycle", am: "ዑደት" },
  dueDate: { en: "Due date", am: "የሚከፈልበት ቀን" },
  gross: { en: "Gross", am: "ጠቅላላ" },
  incomeTax: { en: "Income tax", am: "የገቢ ግብር" },
  pension7: { en: "Pension 7%", am: "ጡረታ 7%" },
  employer11: { en: "Employer 11%", am: "አሰሪ 11%" },
  retirement: { en: "Retirement", am: "ጡረታ ቁጠባ" },
  net: { en: "Net", am: "ተጣራ" },
  status: { en: "Status", am: "ሁኔታ" },
  markPaidCol: { en: "Mark paid", am: "እንደተከፈለ ምልክት" },
  paidAmount: { en: "Paid amount", am: "የተከፈለ መጠን" },
  transactionRef: { en: "Transaction ref", am: "የግብይት ማጣቀሻ" },
  paidAt: { en: "Paid at", am: "የተከፈለበት ጊዜ" },
  txRefPlaceholder: { en: "Transaction reference", am: "የግብይት ማጣቀሻ" },
  paidAmountPlaceholder: { en: "Paid amount (minor)", am: "የተከፈለ መጠን (ትንሽ)" },
  saving: { en: "Saving", am: "በማስቀመጥ ላይ" },
  markPaid: { en: "Mark Paid", am: "እንደተከፈለ ምልክት አድርግ" },
  txRefRequired: { en: "Transaction reference is required for", am: "የግብይት ማጣቀሻ ያስፈልጋል ለ" },
  failedDue: { en: "Failed to load due payments", am: "የሚከፈሉ ክፍያዎችን መጫን አልተሳካም" },
  failedPaid: { en: "Failed to load paid payrolls", am: "የተከፈሉ ደመወዞችን መጫን አልተሳካም" },
  failedMark: { en: "Failed to mark payment as paid", am: "ክፍያውን እንደተከፈለ ምልክት ማድረግ አልተሳካም" },
}

type PayrollTab = "due" | "paid"

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export default function AdminPaymentsPage() {
  const { lang } = useLang()
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
        throw new Error((data as { error?: string }).error ?? pick(lang, t.failedDue))
      }
      const data = await res.json()
      setDuePayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(lang, t.failedDue))
      setDuePayments([])
    } finally {
      setLoading(false)
    }
  }, [lang])

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
        throw new Error((data as { error?: string }).error ?? pick(lang, t.failedPaid))
      }
      const data = await res.json()
      setPaidPayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(lang, t.failedPaid))
      setPaidPayments([])
    } finally {
      setLoading(false)
    }
  }, [lang])

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
      : `${new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amountMinor / 100)} ETB`

  const handleMarkPaid = async (payment: EmployeePaymentApi) => {
    const transactionReference = (transactionRefs[payment.id] ?? "").trim()
    if (!transactionReference) {
      setError(`${pick(lang, t.txRefRequired)} ${payment.employeeName}`)
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
        throw new Error((data as { error?: string }).error ?? pick(lang, t.failedMark))
      }
      await fetchDuePayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(lang, t.failedMark))
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{pick(lang, t.payroll)}</h1>

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
          {pick(lang, t.due)}
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
          {pick(lang, t.paid)}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {activeTab === "paid" && (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="paid-filter-month" className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">
              {pick(lang, t.month)}
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
            {pick(lang, t.clear)}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : activeTab === "due" && duePayments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          {pick(lang, t.noDue)}
        </div>
      ) : activeTab === "paid" && paidPayments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          {pick(lang, t.noPaid)}
        </div>
      ) : activeTab === "due" ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.employee)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.cycle)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.dueDate)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.gross)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.incomeTax)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.pension7)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.employer11)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.retirement)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.net)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.status)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.markPaidCol)}</th>
              </tr>
            </thead>
            <tbody>
              {duePayments.map((payment) => (
                <tr key={payment.id} className="border-b border-zinc-800/80 align-top last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{payment.employeeName}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.cycleStartDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.dueDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.grossAmountMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.incomeTaxMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.employeePensionMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.employerPensionMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.retirementSavingMinor)}</td>
                  <td className="px-4 py-3 font-medium text-white">{formatMoney(payment.amountMinor)}</td>
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
                        placeholder={pick(lang, t.txRefPlaceholder)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Input
                        value={paidAmounts[payment.id] ?? ""}
                        onChange={(e) => setPaidAmounts((prev) => ({ ...prev, [payment.id]: e.target.value }))}
                        type="number"
                        min={1}
                        step={1}
                        placeholder={pick(lang, t.paidAmountPlaceholder)}
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
                            {pick(lang, t.saving)}
                          </>
                        ) : (
                          pick(lang, t.markPaid)
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
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.employee)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.cycle)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.dueDate)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.gross)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.incomeTax)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.pension7)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.employer11)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.retirement)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.net)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.paidAmount)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.status)}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {pick(lang, t.transactionRef)}
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.paidAt)}</th>
              </tr>
            </thead>
            <tbody>
              {paidPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-zinc-800/80 align-top last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{payment.employeeName}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.cycleStartDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{payment.dueDate}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.grossAmountMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.incomeTaxMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.employeePensionMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.employerPensionMinor)}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(payment.retirementSavingMinor)}</td>
                  <td className="px-4 py-3 font-medium text-white">{formatMoney(payment.amountMinor)}</td>
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
