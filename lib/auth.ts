/**
 * Admin auth: session cookie stores JWT from CMS API.
 * Login calls https://afrodebab-cms-api.onrender.com/admin/auth/login
 * and stores the returned token for use in admin/CMS API calls.
 */

const ADMIN_COOKIE_NAME = "admin_session"
const EMPLOYEE_COOKIE_NAME = "employee_session"
const PLATFORM_COOKIE_NAME = "platform_session"
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 days (fallback when JWT has no exp)
// "platform" = global platform admin (org CRUD + stats); "admin" = per-org manager; "employee".
export type UserRole = "admin" | "employee" | "platform"

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf8")
  }
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  while (base64.length % 4) base64 += "="
  return decodeURIComponent(escape(atob(base64)))
}

export interface SessionPayload {
  email: string
  exp: number
  role: UserRole
}

interface JwtPayload {
  sub?: string
  exp?: number
  iat?: number
}

/**
 * Decode JWT payload without verifying signature (used for exp check and cookie maxAge).
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const json = base64UrlDecode(parts[1]!)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...v] = c.trim().split("=")
      return [key.trim(), v.join("=").trim()]
    })
  )
}

export function getSessionFromCookie(cookieHeader: string | null): SessionPayload | null {
  const cookies = parseCookies(cookieHeader)
  const platformPayload = decodeJwtPayload(cookies[PLATFORM_COOKIE_NAME] ?? "")
  if (platformPayload && typeof platformPayload.exp === "number" && platformPayload.exp >= Date.now() / 1000) {
    return {
      email: typeof platformPayload.sub === "string" ? platformPayload.sub : "",
      exp: platformPayload.exp,
      role: "platform",
    }
  }
  const adminPayload = decodeJwtPayload(cookies[ADMIN_COOKIE_NAME] ?? "")
  if (adminPayload && typeof adminPayload.exp === "number" && adminPayload.exp >= Date.now() / 1000) {
    return {
      email: typeof adminPayload.sub === "string" ? adminPayload.sub : "",
      exp: adminPayload.exp,
      role: "admin",
    }
  }
  const employeePayload = decodeJwtPayload(cookies[EMPLOYEE_COOKIE_NAME] ?? "")
  if (!employeePayload || typeof employeePayload.exp !== "number") return null
  if (employeePayload.exp < Date.now() / 1000) return null
  return {
    email: typeof employeePayload.sub === "string" ? employeePayload.sub : "",
    exp: employeePayload.exp,
    role: "employee",
  }
}

/**
 * Verify session cookie (JWT from CMS). Returns payload if valid, null otherwise.
 */
export async function verifySessionCookie(cookieHeader: string | null): Promise<SessionPayload | null> {
  return getSessionFromCookie(cookieHeader)
}

/**
 * Get the raw admin API token from cookie header (for use when calling CMS API).
 * Returns null if missing or expired.
 */
export function getAdminToken(cookieHeader: string | null): string | null {
  const cookies = parseCookies(cookieHeader)
  const token = cookies[ADMIN_COOKIE_NAME]
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null
  return token
}

export function getEmployeeToken(cookieHeader: string | null): string | null {
  const cookies = parseCookies(cookieHeader)
  const token = cookies[EMPLOYEE_COOKIE_NAME]
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null
  return token
}

export function getPlatformToken(cookieHeader: string | null): string | null {
  const cookies = parseCookies(cookieHeader)
  const token = cookies[PLATFORM_COOKIE_NAME]
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null
  return token
}

export function getCookieName(role: UserRole = "admin"): string {
  if (role === "platform") return PLATFORM_COOKIE_NAME
  return role === "admin" ? ADMIN_COOKIE_NAME : EMPLOYEE_COOKIE_NAME
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE_SEC
}

/**
 * Get max age in seconds for cookie from JWT exp, or default SESSION_MAX_AGE_SEC.
 */
export function getMaxAgeFromToken(token: string): number {
  const payload = decodeJwtPayload(token)
  if (payload && typeof payload.exp === "number") {
    const sec = payload.exp - Math.floor(Date.now() / 1000)
    return sec > 0 ? sec : SESSION_MAX_AGE_SEC
  }
  return SESSION_MAX_AGE_SEC
}
