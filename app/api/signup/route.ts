import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Public: forwards a "Start free" submission to the backend. No auth — anyone can request a workspace.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${CMS_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to submit signup request" },
        { status: res.status }
      )
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error("Signup submit error:", err)
    return NextResponse.json({ error: "Failed to submit signup request" }, { status: 500 })
  }
}
