import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: { periodId: string } }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await fetch(
      `${CMS_BASE_URL}/manager/metrics/peer-reviews/periods/${encodeURIComponent(
        params.periodId
      )}/results`,
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
        { error: (data as { message?: string }).message ?? "Failed to fetch peer review results" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin peer review results error:", err)
    return NextResponse.json({ error: "Failed to fetch peer review results" }, { status: 500 })
  }
}
