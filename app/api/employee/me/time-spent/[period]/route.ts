import { NextRequest, NextResponse } from "next/server"
import { getEmployeeToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ALLOWED_PERIODS = new Set(["daily", "weekly", "monthly"])

export async function GET(
  request: NextRequest,
  { params }: { params: { period: string } }
) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const period = await params.period
  if (!ALLOWED_PERIODS.has(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${CMS_BASE_URL}/employee/me/time-spent/${period}?date=${encodeURIComponent(date)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch time spent" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Employee time spent error:", err)
    return NextResponse.json({ error: "Failed to fetch time spent" }, { status: 500 })
  }
}
