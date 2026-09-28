import { NextRequest } from "next/server"
import { getPlatformToken } from "@/lib/auth"
import { proxyJson } from "@/lib/json-proxy"

async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return proxyJson(request, getPlatformToken(request.headers.get("cookie")), "/admin/legal", path, "Legal document request failed")
}

export { proxy as GET, proxy as PUT, proxy as DELETE }
