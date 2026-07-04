import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { paymentId } = await params
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const paidAmountMinor =
      typeof body.paidAmountMinor === "number" && Number.isFinite(body.paidAmountMinor)
        ? Math.trunc(body.paidAmountMinor)
        : undefined
    if (typeof paidAmountMinor === "number" && paidAmountMinor <= 0) {
      return NextResponse.json({ error: "Paid amount must be greater than zero" }, { status: 400 })
    }

    const payload = {
      transactionReference:
        typeof body.transactionReference === "string" ? body.transactionReference.trim() : "",
      paidAmountMinor,
    }

    if (!payload.transactionReference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 })
    }

    const res = await fetch(`${CMS_BASE_URL}/manager/payments/${encodeURIComponent(paymentId)}/mark-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to mark payment as paid" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin mark payment paid error:", err)
    return NextResponse.json({ error: "Failed to mark payment as paid" }, { status: 500 })
  }
}
