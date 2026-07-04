import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? "afrodebab"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") ?? "0"
    const size = searchParams.get("size") ?? "6"
    const sortBy = searchParams.get("sortBy") ?? "publishedAt"
    const direction = searchParams.get("direction") ?? "desc"

    const params = new URLSearchParams()
    params.set("page", page)
    params.set("size", size)
    params.set("sortBy", sortBy)
    params.set("direction", direction)

    const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/blogs?${params.toString()}`
    const res = await fetch(url, {
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `CMS returned ${res.status}`, details: text },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Blogs API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}
