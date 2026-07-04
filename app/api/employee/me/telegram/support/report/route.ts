import { NextRequest, NextResponse } from "next/server"
import { getEmployeeToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from") ?? ""
    const to = searchParams.get("to") ?? ""

    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    const res = await fetch(
      `${CMS_BASE_URL}/employee/me/telegram/support/report?${params.toString()}`,
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
            "Failed to fetch telegram support report",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Employee telegram support report error:", err)
    return NextResponse.json(
      { error: "Failed to fetch telegram support report" },
      { status: 500 }
    )
  }
}
