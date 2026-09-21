import { NextRequest } from "next/server"
import { forwardPrinciples } from "./proxy"

// Read-only: principles are platform-wide and edited under /platform/principles.
export const GET = (request: NextRequest) => forwardPrinciples(request, "", "GET")
