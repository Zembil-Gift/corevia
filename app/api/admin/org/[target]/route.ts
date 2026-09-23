import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { buildMultipartBody } from "@/lib/multipart"
import { postRaw } from "@/lib/raw-http"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"]
const MAX_BYTES = 5 * 1024 * 1024
const TARGETS: Record<string, string> = {
  logo: "/manager/org/logo",
  cover: "/manager/org/cover",
  "email-logo": "/manager/email-templates/logo",
  "blog-cover": "/manager/blogs/cover-image",
  "event-cover": "/manager/events/cover-image",
}

// POST a company logo, cover image, email logo or blog/event cover (multipart). Forwards to the matching TARGETS path.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ target: string }> }
) {
  const token = getAdminToken(request.headers.get("cookie"))
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { target } = await params
  if (!Object.hasOwn(TARGETS, target)) {
    return NextResponse.json({ error: "Unknown upload target" }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const files = [...formData.getAll("file")]
    if (files.length !== 1 || !(files[0] instanceof File)) {
      return NextResponse.json({ error: "A single image file is required" }, { status: 400 })
    }

    const file = files[0]
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, GIF, WEBP, and SVG files are allowed" },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be 5 MB or smaller" }, { status: 400 })
    }

    const { body, contentType } = await buildMultipartBody({ file })

    const res = await postRaw({
      url: `${CMS_BASE_URL}${TARGETS[target]}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
      },
      body,
    })

    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(res.bodyText || "{}")
    } catch {
      data = {}
    }
    if (res.status < 200 || res.status >= 300) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Failed to upload image" },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Manager org image upload error:", err)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
