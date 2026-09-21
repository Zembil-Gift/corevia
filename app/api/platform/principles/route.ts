import { NextRequest } from "next/server"
import { forwardPrinciples } from "./proxy"

export const GET = (request: NextRequest) => forwardPrinciples(request, "", "GET")
export const POST = (request: NextRequest) => forwardPrinciples(request, "", "POST")
