import { NextRequest, NextResponse } from "next/server"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/

/** No-login interviewer feedback link: forwards to the API, which checks the token. */
async function proxy(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "This feedback link is invalid or has already been used" }, { status: 404 })
  }
  try {
    const isPost = request.method === "POST"
    const res = await fetch(`${CMS_BASE_URL}/interview-feedback/${token}`, {
      method: request.method,
      headers: isPost ? { "Content-Type": "application/json" } : undefined,
      body: isPost ? await request.text() : undefined,
      cache: "no-store",
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    if (!res.ok) {
      return NextResponse.json({ error: (data as { message?: string }).message ?? "Request failed" }, { status: res.status })
    }
    return isPost ? new NextResponse(null, { status: 204 }) : NextResponse.json(data)
  } catch (err) {
    console.error("Interview feedback proxy error:", err)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}

export { proxy as GET, proxy as POST }
