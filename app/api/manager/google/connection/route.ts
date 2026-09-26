import { NextRequest } from "next/server"
import { getAdminToken } from "@/lib/auth"
import { proxyJson } from "@/lib/json-proxy"

// Manager's own Google connection: GET status, POST connect (oauth code), DELETE disconnect.
async function proxy(request: NextRequest) {
  return proxyJson(request, getAdminToken(request.headers.get("cookie")), "/manager/google/connection", [], "Google request failed")
}

export { proxy as GET, proxy as POST, proxy as DELETE }
