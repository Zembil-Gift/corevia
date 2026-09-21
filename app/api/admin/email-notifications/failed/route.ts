import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

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
    const sortBy = searchParams.get("sortBy") ?? "createdAt"
    const direction = searchParams.get("direction") ?? "desc"

    const params = new URLSearchParams()
    params.set("page", page)
    params.set("size", size)
    params.set("sortBy", sortBy)
    params.set("direction", direction)

    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/email-notifications/failed?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch failed email notifications" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin failed email notifications error:", err)
    return NextResponse.json({ error: "Failed to fetch failed email notifications" }, { status: 500 })
  }
}
