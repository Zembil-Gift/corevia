import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import { viceManagerFromApi, viceManagerToApi } from "@/lib/sub-orgs-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/vice-managers`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch vice managers" },
        { status: res.status }
      )
    }
    return NextResponse.json(Array.isArray(data) ? data.map(viceManagerFromApi) : data)
  } catch (err) {
    console.error("Fetch vice managers error:", err)
    return NextResponse.json({ error: "Failed to fetch vice managers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/vice-managers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...viceManagerToApi(body), email: body.email }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to create vice manager" },
        { status: res.status }
      )
    }
    return NextResponse.json(viceManagerFromApi(data))
  } catch (err) {
    console.error("Create vice manager error:", err)
    return NextResponse.json({ error: "Failed to create vice manager" }, { status: 500 })
  }
}
