import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

// Emails the logged-in manager a code to confirm a password change.
export async function POST(request: NextRequest) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/me/password/otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
    console.error("Manager password OTP error:", err)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
