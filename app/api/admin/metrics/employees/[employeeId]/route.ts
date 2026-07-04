import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
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
  const persistSnapshot = searchParams.get("persistSnapshot")
  if (persistSnapshot) paramsSearch.set("persistSnapshot", persistSnapshot)

  try {
    const res = await fetch(
      `${CMS_BASE_URL}/manager/metrics/employees/${encodeURIComponent(
        params.employeeId
      )}?${paramsSearch.toString()}`,
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
        { error: (data as { message?: string }).message ?? "Failed to fetch employee metrics" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin metrics employee error:", err)
    return NextResponse.json({ error: "Failed to fetch employee metrics" }, { status: 500 })
  }
}
