import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import { subOrgFromApi, subOrgToApi } from "@/lib/sub-orgs-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/sub-organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch sub-organizations" },
        { status: res.status }
      )
    }
    return NextResponse.json(Array.isArray(data) ? data.map(subOrgFromApi) : data)
  } catch (err) {
    console.error("Fetch sub-organizations error:", err)
    return NextResponse.json({ error: "Failed to fetch sub-organizations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/sub-organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subOrgToApi(body)),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to create sub-organization" },
        { status: res.status }
      )
    }
    return NextResponse.json(subOrgFromApi(data))
  } catch (err) {
    console.error("Create sub-organization error:", err)
    return NextResponse.json({ error: "Failed to create sub-organization" }, { status: 500 })
  }
}
