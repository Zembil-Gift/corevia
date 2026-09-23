import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(_request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing blog id" }, { status: 400 })
  }

  try {
    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/blogs/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 204 || res.ok) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (data as { message?: string }).message ?? "Failed to delete blog" },
      { status: res.status }
    )
  } catch (err) {
    console.error("Admin delete blog error:", err)
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    )
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
  if (!id) {
    return NextResponse.json({ error: "Missing blog id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const payload = {
      title: typeof body.title === "string" ? body.title : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      excerpt: typeof body.excerpt === "string" ? body.excerpt : "",
      content: typeof body.content === "string" ? body.content : "",
      coverImageUrl: typeof body.coverImageUrl === "string" ? body.coverImageUrl : "",
      status: body.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
    }

    const res = await cmsFetch(token, `${CMS_BASE_URL}/manager/blogs/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to update blog" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Admin update blog error:", err)
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    )
  }
}
