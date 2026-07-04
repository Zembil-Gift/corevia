import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? "afrodebab"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const payload = {
      fullName: typeof body.fullName === "string" ? body.fullName : "",
      email: typeof body.email === "string" ? body.email : "",
      phoneNumber: typeof body.phoneNumber === "string" ? body.phoneNumber : "",
      githubUrl: typeof body.githubUrl === "string" ? body.githubUrl : "",
    }

    const res = await fetch(`${CMS_BASE_URL}/public/${ORG_SLUG}/jobs/${encodeURIComponent(id)}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to submit application" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Job apply error:", err)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    )
  }
}
