import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await fetch(`${CMS_BASE_URL}/manager/metrics/peer-reviews/periods`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch peer review periods" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin peer review periods error:", err)
    return NextResponse.json({ error: "Failed to fetch peer review periods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const res = await fetch(`${CMS_BASE_URL}/manager/metrics/peer-reviews/periods`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to initiate peer review period" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin peer review period create error:", err)
    return NextResponse.json({ error: "Failed to initiate peer review period" }, { status: 500 })
  }
}
