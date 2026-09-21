import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ employeeId: string }> }
) {
  const params = await paramsPromise
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const employeeId = params.employeeId
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 })
  }

  try {
    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/trello/report/${encodeURIComponent(employeeId)}`,
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
            "Failed to fetch trello report",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin trello report error:", err)
    return NextResponse.json(
      { error: "Failed to fetch trello report" },
      { status: 500 }
    )
  }
}
