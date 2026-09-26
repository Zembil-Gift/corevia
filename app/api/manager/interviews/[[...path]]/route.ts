import { NextRequest } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { proxyJson } from "@/lib/json-proxy"

async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return proxyJson(request, getAdminToken(request.headers.get("cookie")), "/manager/interviews", path, "Interview request failed")
}

export { proxy as GET, proxy as POST, proxy as PUT }
