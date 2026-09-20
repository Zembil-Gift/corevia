import { NextRequest, NextResponse } from "next/server"
import { getEmployeeToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodId = searchParams.get("periodId")
  const targetUrl = periodId
    ? `${CMS_BASE_URL}/employee/me/peer-reviews/available-employees?periodId=${encodeURIComponent(periodId)}`
    : `${CMS_BASE_URL}/employee/me/peer-reviews/available-employees`

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch available employees" },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("Employee available employees error:", err)
    return NextResponse.json({ error: "Failed to fetch available employees" }, { status: 500 })
  }
}
