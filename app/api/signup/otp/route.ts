import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Public: asks the backend to email a signup verification code.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${CMS_BASE_URL}/signup/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to send verification code" },
        { status: res.status }
      )
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("Signup OTP error:", err)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
