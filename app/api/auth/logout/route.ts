import { NextResponse } from "next/server"
import { getCookieName } from "@/lib/auth"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  for (const role of ["platform", "admin", "employee"] as const) {
    response.cookies.set({
      name: getCookieName(role),
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  }
  return response
}
