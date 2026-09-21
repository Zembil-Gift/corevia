import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import { subOrgFromApi, subOrgToApi } from "@/lib/sub-orgs-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/sub-organizations/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch sub-organization" },
        { status: res.status }
      )
    }
    return NextResponse.json(subOrgFromApi(data))
  } catch (err) {
    console.error("Fetch sub-org error:", err)
    return NextResponse.json({ error: "Failed to fetch sub-organization" }, { status: 500 })
  }
}

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
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/sub-organizations/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subOrgToApi(body)),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update sub-organization" },
        { status: res.status }
      )
    }
    return NextResponse.json(subOrgFromApi(data))
  } catch (err) {
    console.error("Update sub-org error:", err)
    return NextResponse.json({ error: "Failed to update sub-organization" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/sub-organizations/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to delete sub-organization" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete sub-org error:", err)
    return NextResponse.json({ error: "Failed to delete sub-organization" }, { status: 500 })
  }
}
