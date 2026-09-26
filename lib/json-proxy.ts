import { NextRequest, NextResponse } from "next/server"
import { cmsFetch } from "@/lib/cms-fetch"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const SEGMENT = /^[A-Za-z0-9_-]+$/

/**
 * Forwards a JSON request to `${backendBase}/${path}` with the caller's token, keeping the
 * method, body and query string. Paths are limited to plain segments so callers can't
 * traverse to other backend routes.
 */
export async function proxyJson(
  request: NextRequest,
  token: string | null,
  backendBase: string,
  path: string[] = [],
  fallbackError = "Request failed",
) {
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (path.length > 3 || !path.every((segment) => SEGMENT.test(segment))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const hasBody = request.method === "POST" || request.method === "PUT" || request.method === "PATCH"
    const url = `${CMS_BASE_URL}${backendBase}${path.map((s) => `/${s}`).join("")}${request.nextUrl.search}`
    const res = await cmsFetch(token, url, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? fallbackError },
        { status: res.status },
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error(`Proxy ${backendBase} error:`, err)
    return NextResponse.json({ error: fallbackError }, { status: 500 })
  }
}
