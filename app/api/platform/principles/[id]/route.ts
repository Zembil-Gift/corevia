import { NextRequest } from "next/server"
import { forwardPrinciples } from "../proxy"

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  return forwardPrinciples(request, `/${encodeURIComponent(id)}`, "PUT")
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  return forwardPrinciples(request, `/${encodeURIComponent(id)}`, "DELETE")
}
