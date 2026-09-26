import { NextRequest } from "next/server"
import { getEmployeeToken } from "@/lib/auth"
import { proxyJson } from "@/lib/json-proxy"

export async function GET(request: NextRequest) {
  return proxyJson(request, getEmployeeToken(request.headers.get("cookie")), "/employee/me/organization", [], "Failed to load organization")
}
