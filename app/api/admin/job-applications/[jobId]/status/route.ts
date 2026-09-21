import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function PATCH(
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
    const body = await request.json()
    if (body.status !== "UNDER_REVIEW") {
      return NextResponse.json({ error: "Status must be UNDER_REVIEW" }, { status: 400 })
    }

    const res = await cmsFetch(token,
      `${CMS_BASE_URL}/manager/job-applications/${encodeURIComponent(applicationId)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "UNDER_REVIEW" }),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update application status" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin update application status error:", err)
    return NextResponse.json({ error: "Failed to update application status" }, { status: 500 })
  }
}
