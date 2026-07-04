import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionCookie } from "@/lib/auth"

// Manager dashboard lives at /manager in the browser. The session cookie role is still
// "admin" (admin_session) — that's an internal role name, not the URL.
const ADMIN_PREFIX = "/manager"
const EMPLOYEE_PREFIX = "/employee"
const PLATFORM_PREFIX = "/platform"
const LOGIN_PATH = "/login"
const AUTH_API_PREFIX = "/api/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API auth routes (login, logout)
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next()
  }

  const cookieHeader = request.headers.get("cookie")
  const session = await verifySessionCookie(cookieHeader)

  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl")

  // Protect platform: only platform admins
  if (pathname.startsWith(PLATFORM_PREFIX)) {
    if (!session || session.role !== "platform") {
      const loginUrl = new URL(LOGIN_PATH, request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Protect admin: only admin users
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!session || session.role !== "admin") {
      const loginUrl = new URL(LOGIN_PATH, request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Protect employee: only employee users
  if (pathname.startsWith(EMPLOYEE_PREFIX)) {
    if (!session || session.role !== "employee") {
      const loginUrl = new URL(LOGIN_PATH, request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // If already logged in and visiting login, redirect by role
  if (pathname === LOGIN_PATH && session) {
    if (session.role === "platform") {
      const redirectTarget =
        callbackUrl && callbackUrl.startsWith(PLATFORM_PREFIX) ? callbackUrl : PLATFORM_PREFIX
      return NextResponse.redirect(new URL(redirectTarget, request.url))
    }
    if (session.role === "admin") {
      const redirectTarget =
        callbackUrl && callbackUrl.startsWith(ADMIN_PREFIX) ? callbackUrl : ADMIN_PREFIX
      return NextResponse.redirect(new URL(redirectTarget, request.url))
    }
    const redirectTarget =
      callbackUrl && callbackUrl.startsWith(EMPLOYEE_PREFIX) ? callbackUrl : EMPLOYEE_PREFIX
    return NextResponse.redirect(new URL(redirectTarget, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/platform",
    "/platform/:path*",
    "/manager",
    "/manager/:path*",
    "/employee",
    "/employee/:path*",
    "/login",
    "/api/auth/:path*",
  ],
}
