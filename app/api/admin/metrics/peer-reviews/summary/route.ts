import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
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

  const params = new URLSearchParams()
  params.set("periodStart", periodStart)
  params.set("periodEnd", periodEnd)
  const revieweeId = searchParams.get("revieweeId")
  if (revieweeId) params.set("revieweeId", revieweeId)

  try {
    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/metrics/peer-reviews/summary?${params.toString()}`,
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
        {
          error:
            (data as { message?: string }).message ??
            "Failed to fetch peer review summary",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin peer review summary error:", err)
    return NextResponse.json(
      { error: "Failed to fetch peer review summary" },
      { status: 500 }
    )
  }
}
