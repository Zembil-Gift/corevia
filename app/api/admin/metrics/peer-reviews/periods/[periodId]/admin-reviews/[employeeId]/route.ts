import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ periodId: string; employeeId: string }> }
) {
  const params = await paramsPromise
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/metrics/peer-reviews/periods/${encodeURIComponent(
        params.periodId
      )}/admin-reviews/${encodeURIComponent(params.employeeId)}`,
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
            "Failed to fetch admin peer review",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin get admin peer review error:", err)
    return NextResponse.json(
      { error: "Failed to fetch admin peer review" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ periodId: string; employeeId: string }> }
) {
  const params = await paramsPromise
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))

    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/metrics/peer-reviews/periods/${encodeURIComponent(
        params.periodId
      )}/admin-reviews/${encodeURIComponent(params.employeeId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data as { message?: string }).message ??
            "Failed to save admin peer review",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin upsert admin peer review error:", err)
    return NextResponse.json(
      { error: "Failed to save admin peer review" },
      { status: 500 }
    )
  }
}
