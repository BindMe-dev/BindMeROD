import { NextRequest, NextResponse } from "next/server"
import { clearFirmSessionCookie } from "@/lib/firm-auth-helpers"

/**
 * Law Firm Logout
 * POST /api/firm/auth/logout
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.headers.set("Set-Cookie", clearFirmSessionCookie())
  return response
}

