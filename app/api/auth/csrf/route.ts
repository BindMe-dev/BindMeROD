import { NextRequest, NextResponse } from "next/server"
import { generateCSRFToken } from "@/lib/security/auth-security"
import { withErrorHandler } from "@/lib/api/error-handler"

export const GET = withErrorHandler(async (request: NextRequest) => {
  const csrfToken = generateCSRFToken()
  
  const response = NextResponse.json({ csrfToken })
  
  // Set CSRF token in cookie for validation
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: false, // Client needs access
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 2 * 60 * 60 // 2 hours
  })
  
  return response
})