import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import { subOrgFromApi } from "@/lib/sub-orgs-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/sub-organizations/${encodeURIComponent(id)}/rename`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to rename sub-organization" },
        { status: res.status }
      )
    }
    return NextResponse.json(subOrgFromApi(data))
  } catch (err) {
    console.error("Rename sub-org error:", err)
    return NextResponse.json({ error: "Failed to rename sub-organization" }, { status: 500 })
  }
}
