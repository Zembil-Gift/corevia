import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") ?? "0"
    const size = searchParams.get("size") ?? "10"
    const sortBy = searchParams.get("sortBy") ?? "name"
    const direction = searchParams.get("direction") ?? "asc"

    const params = new URLSearchParams()
    params.set("page", page)
    params.set("size", size)
    params.set("sortBy", sortBy)
    params.set("direction", direction)

    const res = await fetch(
      `${CMS_BASE_URL}/manager/employees/with-telegram?${params.toString()}`,
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
            "Failed to fetch employees",
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin employees with telegram error:", err)
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}
