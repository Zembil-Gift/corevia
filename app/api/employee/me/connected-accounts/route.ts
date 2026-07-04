import { NextRequest, NextResponse } from "next/server"
import { getEmployeeToken } from "@/lib/auth"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(request: NextRequest) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await fetch(`${CMS_BASE_URL}/employee/me/connected-accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch connected accounts" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Employee connected accounts error:", err)
    return NextResponse.json({ error: "Failed to fetch connected accounts" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const token = getEmployeeToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload: Record<string, string | null> = {}
    if (body.githubUsername !== undefined) payload.githubUsername = body.githubUsername
    if (body.trelloUsername !== undefined) payload.trelloUsername = body.trelloUsername
    if (body.telegramUsername !== undefined) payload.telegramUsername = body.telegramUsername

    const res = await fetch(`${CMS_BASE_URL}/employee/me/connected-accounts`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update connected accounts" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Employee update connected accounts error:", err)
    return NextResponse.json({ error: "Failed to update connected accounts" }, { status: 500 })
  }
}
