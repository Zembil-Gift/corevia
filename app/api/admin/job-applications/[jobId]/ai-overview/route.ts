import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId: applicationId } = await params
  if (!applicationId) {
    return NextResponse.json({ error: "Missing application id" }, { status: 400 })
  }

  try {
    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/job-applications/${encodeURIComponent(applicationId)}/ai-overview`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to fetch AI overview" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin AI overview error:", err)
    return NextResponse.json({ error: "Failed to fetch AI overview" }, { status: 500 })
  }
}
