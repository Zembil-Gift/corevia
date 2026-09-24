import { NextRequest, NextResponse } from "next/server"
import { buildMultipartBody } from "@/lib/multipart"
import { postRaw } from "@/lib/raw-http"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const SLUG_RE = /^[a-z0-9-]+$/
// Application-form answers: answer.<fieldId> (links/text) and file.<fieldId> (uploads).
const ANSWER_KEY_RE = /^(answer|file)\.[a-z0-9-]{1,40}$/
const MAX_EXTRA_FILE_BYTES = 10 * 1024 * 1024

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 })
  }
  const org = request.nextUrl.searchParams.get("org") ?? ""
  if (!SLUG_RE.test(org)) {
    return NextResponse.json({ error: "Invalid organization" }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const fullName = formData.get("fullName")
    const email = formData.get("email")
    const phoneNumber = formData.get("phoneNumber")
    const githubUrl = formData.get("githubUrl")
    const resume = formData.get("resume")

    if (typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 })
    }
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "Resume is required" }, { status: 400 })
    }

    const fields: Record<string, string> = {
      fullName: fullName.trim(),
      email: email.trim(),
    }
    if (typeof phoneNumber === "string" && phoneNumber.trim()) {
      fields.phoneNumber = phoneNumber.trim()
    }
    if (typeof githubUrl === "string" && githubUrl.trim()) {
      fields.githubUrl = githubUrl.trim()
    }

    // Forward custom answers; the backend validates them against the job's form.
    const files: { fieldName: string; file: File }[] = []
    for (const [key, value] of formData.entries()) {
      if (!ANSWER_KEY_RE.test(key)) continue
      if (key.startsWith("answer.") && typeof value === "string") {
        fields[key] = value
      } else if (key.startsWith("file.") && value instanceof File && value.size > 0) {
        if (value.size > MAX_EXTRA_FILE_BYTES) {
          return NextResponse.json({ error: `"${value.name}" must be 10 MB or smaller` }, { status: 400 })
        }
        files.push({ fieldName: key, file: value })
      }
    }

    const { body, contentType } = await buildMultipartBody({
      fields,
      fileFieldName: "resume",
      file: resume,
      files,
    })

    const res = await postRaw({
      url: `${CMS_BASE_URL}/public/${org}/jobs/${encodeURIComponent(id)}/apply/form`,
      headers: {
        "Content-Type": contentType,
      },
      body,
    })

    let data: { message?: string } | Record<string, unknown> = {}
    try {
      data = JSON.parse(res.bodyText || "{}") as { message?: string }
    } catch {
      data = {}
    }

    if (res.status < 200 || res.status >= 300) {
      return NextResponse.json(
        { error: data.message ?? "Failed to submit application" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Job apply form error:", err)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    )
  }
}
