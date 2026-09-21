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

  const optionalParams = [
    "department",
    "role",
    "page",
    "size",
    "sortBy",
    "direction",
    "persistSnapshot",
    "subOrganizationId",
  ]
  optionalParams.forEach((key) => {
    const value = searchParams.get(key)
    if (value) params.set(key, value)
  })

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/metrics/employees?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch metrics" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin metrics list error:", err)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
