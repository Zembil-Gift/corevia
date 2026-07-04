import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const yearParam = request.nextUrl.searchParams.get("year")
  const monthParam = request.nextUrl.searchParams.get("month")
  const year = Number(yearParam)
  const month = Number(monthParam)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month query params" }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    })

    const res = await fetch(`${CMS_BASE_URL}/manager/payments/paid/filter?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch filtered paid payrolls" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin paid payrolls filter error:", err)
    return NextResponse.json({ error: "Failed to fetch filtered paid payrolls" }, { status: 500 })
  }
}
