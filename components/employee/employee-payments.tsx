"use client"

import { useCallback, useEffect, useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EmployeePaymentApi } from "@/lib/employees-api"

export function EmployeePayments() {
  const [payments, setPayments] = useState<EmployeePaymentApi[]>([])
  const [paidPayments, setPaidPayments] = useState<EmployeePaymentApi[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState("")
  const [paymentTab, setPaymentTab] = useState<"all" | "paid">("all")

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true)
    setPaymentsError("")
    try {
      const [allRes, paidRes] = await Promise.all([
        fetch("/api/employee/me/payments"),
        fetch("/api/employee/me/payments/paid"),
      ])

      const allData = await allRes.json().catch(() => [])
      const paidData = await paidRes.json().catch(() => [])

      if (!allRes.ok) {
        throw new Error((allData as { error?: string }).error ?? "Failed to fetch payments")
      }
      if (!paidRes.ok) {
        throw new Error((paidData as { error?: string }).error ?? "Failed to fetch paid payments")
      }

      setPayments(Array.isArray(allData) ? allData : [])
      setPaidPayments(Array.isArray(paidData) ? paidData : [])
    } catch (err) {
      setPaymentsError(err instanceof Error ? err.message : "Failed to fetch payments")
    } finally {
      setPaymentsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const paymentRows = paymentTab === "all" ? payments : paidPayments
  const formatMoney = (amountMinor: number | null) =>
    amountMinor === null
      ? "-"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(amountMinor / 100)

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-[#e78a53]" />
          <h2 className="text-lg font-semibold text-white">Payments</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={paymentTab === "all" ? "default" : "outline"}
            onClick={() => setPaymentTab("all")}
            className={
              paymentTab === "all"
                ? "bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }
          >
            All
          </Button>
          <Button
            variant={paymentTab === "paid" ? "default" : "outline"}
            onClick={() => setPaymentTab("paid")}
            className={
              paymentTab === "paid"
                ? "bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }
          >
            Paid
          </Button>
        </div>
      </div>

      {paymentsError && (
        <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {paymentsError}
        </p>
      )}

      {paymentsLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin text-[#e78a53]" />
          <span className="text-zinc-400">Loading payments...</span>
        </div>
      ) : paymentRows.length === 0 ? (
        <p className="text-sm text-zinc-500">No payment records found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900">
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-zinc-400">No.</th>
                <th className="px-3 py-2 text-zinc-400">Cycle</th>
                <th className="px-3 py-2 text-zinc-400">Due</th>
                <th className="px-3 py-2 text-zinc-400">Amount</th>
                <th className="px-3 py-2 text-zinc-400">Status</th>
                <th className="px-3 py-2 text-zinc-400">Tx-Ref</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((payment, index) => (
                <tr
                  key={payment.id}
                  className="border-b border-zinc-800/80 last:border-0"
                >
                  <td className="px-3 py-2 text-zinc-300">{index + 1}</td>
                  <td className="px-3 py-2 text-zinc-300">
                    {payment.cycleStartDate}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{payment.dueDate}</td>
                  <td className="px-3 py-2 text-zinc-300">
                    {formatMoney(payment.amountMinor)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        payment.status === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  {payment.transactionReference ? (
                    <td className="px-3 py-2 text-zinc-300">
                      {payment.transactionReference}
                    </td>
                  ) : (
                    <td className="px-3 py-2 text-zinc-300">-</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
