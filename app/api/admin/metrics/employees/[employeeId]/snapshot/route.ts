import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function POST(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodStart = searchParams.get("periodStart")
  const periodEnd = searchParams.get("periodEnd")
  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 }
    )
  }

  const paramsSearch = new URLSearchParams()
  paramsSearch.set("periodStart", periodStart)
  paramsSearch.set("periodEnd", periodEnd)

  try {
    const res = await fetch(
      `${CMS_BASE_URL}/manager/metrics/employees/${encodeURIComponent(
        params.employeeId
      )}/snapshot?${paramsSearch.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to refresh snapshot" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin snapshot refresh error:", err)
    return NextResponse.json({ error: "Failed to refresh snapshot" }, { status: 500 })
  }
}
