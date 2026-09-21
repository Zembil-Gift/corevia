import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"
import { viceManagerFromApi, viceManagerToApi } from "@/lib/sub-orgs-api"

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
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/vice-managers/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch vice manager" },
        { status: res.status }
      )
    }
    return NextResponse.json(viceManagerFromApi(data))
  } catch (err) {
    console.error("Fetch vice manager error:", err)
    return NextResponse.json({ error: "Failed to fetch vice manager" }, { status: 500 })
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
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/vice-managers/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(viceManagerToApi(body)),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update vice manager" },
        { status: res.status }
      )
    }
    return NextResponse.json(viceManagerFromApi(data))
  } catch (err) {
    console.error("Update vice manager error:", err)
    return NextResponse.json({ error: "Failed to update vice manager" }, { status: 500 })
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
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/vice-managers/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to delete vice manager" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete vice manager error:", err)
    return NextResponse.json({ error: "Failed to delete vice manager" }, { status: 500 })
  }
}
