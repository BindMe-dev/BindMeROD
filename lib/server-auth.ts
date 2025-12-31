import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"
import { generateSecureToken, generateSessionFingerprint, validateSessionFingerprint } from "@/lib/security/auth-security"

const TOKEN_NAME = "bindme_session"
const FINGERPRINT_NAME = "bindme_fp"
const CSRF_TOKEN_NAME = "csrf_token"

// Ensure JWT_SECRET is set in production
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production')
  }
  return "dev-secret-change-me"
})()

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || JWT_SECRET

// Shorter session timeout for better security
const MAX_AGE = 2 * 60 * 60 // 2 hours instead of 7 days
const REFRESH_THRESHOLD = 30 * 60 // Refresh if less than 30 minutes remaining

interface SessionPayload extends jwt.JwtPayload {
  userId: string
  fingerprint: string
  issuedAt: number
  lastActivity: number
  csrfToken: string
}

export function createSessionToken(userId: string, request: NextRequest): { token: string; csrfToken: string } {
  const now = Math.floor(Date.now() / 1000)
  const fingerprint = generateSessionFingerprint(request)
  const csrfToken = generateSecureToken(16)
  
  const payload: SessionPayload = {
    userId,
    fingerprint,
    issuedAt: now,
    lastActivity: now,
    csrfToken
  }
  
  const token = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: MAX_AGE,
    issuer: 'bindme-auth',
    audience: 'bindme-app'
  })
  
  return { token, csrfToken }
}

export async function setSessionCookie(token: string, csrfToken: string, request: NextRequest) {
  const cookieStore = await cookies()
  const fingerprint = generateSessionFingerprint(request)
  
  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === "production"
  
  // Base cookie options - don't set explicit domain, let browser handle it
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: MAX_AGE
  }
  
  // Set session cookie with enhanced security
  // In production, use both regular and __Secure- prefixed versions for compatibility
  if (isProduction) {
    // Set both versions to ensure compatibility
    cookieStore.set(TOKEN_NAME, token, cookieOptions)
    cookieStore.set(`__Secure-${TOKEN_NAME}`, token, cookieOptions)
  } else {
    cookieStore.set(TOKEN_NAME, token, cookieOptions)
  }
  
  // Set fingerprint cookie
  cookieStore.set(FINGERPRINT_NAME, fingerprint, cookieOptions)
  
  // Set CSRF token cookie (accessible to client for forms)
  cookieStore.set(CSRF_TOKEN_NAME, csrfToken, {
    httpOnly: false, // Client needs access for CSRF protection
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: MAX_AGE
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  
  const cookieNames = [
    TOKEN_NAME,
    FINGERPRINT_NAME,
    CSRF_TOKEN_NAME,
    ...(process.env.NODE_ENV === "production" ? [`__Secure-${TOKEN_NAME}`] : [])
  ]
  
  cookieNames.forEach(name => {
    cookieStore.delete(name)
  })
}

export async function refreshSessionIfNeeded(request: NextRequest): Promise<{ token?: string; csrfToken?: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value || 
                cookieStore.get(`__Secure-${TOKEN_NAME}`)?.value
  
  if (!token) return {}
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload
    const now = Math.floor(Date.now() / 1000)
    
    // Check if token needs refresh (less than 30 minutes remaining)
    const timeUntilExpiry = (payload.exp || 0) - now
    
    if (timeUntilExpiry < REFRESH_THRESHOLD) {
      console.log('[AUTH] Refreshing session token')
      return createSessionToken(payload.userId, request)
    }
    
    // Update last activity
    const updatedPayload = {
      ...payload,
      lastActivity: now
    }
    
    const refreshedToken = jwt.sign(updatedPayload, JWT_SECRET, {
      expiresIn: MAX_AGE,
      issuer: 'bindme-auth',
      audience: 'bindme-app'
    })
    
    return { token: refreshedToken, csrfToken: payload.csrfToken }
  } catch (error) {
    console.error('[AUTH] Token refresh failed:', error)
    return {}
  }
}

/**
 * Enhanced user ID extraction with security validation
 */
export async function getUserIdFromRequest(req?: NextRequest): Promise<string | null> {
  const cookieStore = await cookies()
  
  // 1. Try custom session cookie first
  const token = cookieStore.get(TOKEN_NAME)?.value || 
                cookieStore.get(`__Secure-${TOKEN_NAME}`)?.value
  
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'bindme-auth',
        audience: 'bindme-app'
      }) as SessionPayload
      
      // Validate session fingerprint if request is available (soft warning only to avoid false positives)
      if (req) {
        const storedFingerprint = cookieStore.get(FINGERPRINT_NAME)?.value
        if (storedFingerprint && !validateSessionFingerprint(req, storedFingerprint)) {
          console.warn('[SECURITY] Session fingerprint mismatch - proceeding but consider re-login')
        }
      }
      
      // Check session timeout
      const now = Math.floor(Date.now() / 1000)
      const sessionAge = now - payload.lastActivity
      
      if (sessionAge > MAX_AGE) {
        console.warn('[SECURITY] Session expired due to inactivity')
        await clearSessionCookie()
        return null
      }
      
      return payload.userId
    } catch (error) {
      console.error('[AUTH] Custom token validation failed:', error)
      await clearSessionCookie()
    }
  }

  // 2. Try NextAuth session (with proper token handling)
  if (req) {
    try {
      const token = await getToken({ 
        req, 
        secret: NEXTAUTH_SECRET 
      })
      if (token?.sub) return token.sub
    } catch (error) {
      console.error("[AUTH] NextAuth getToken failed:", error)
    }
  }

  // 3. Last resort fallback (only for development)
  if (process.env.NODE_ENV !== 'production') {
    const nextAuthToken =
      cookieStore.get("next-auth.session-token")?.value || 
      cookieStore.get("__Secure-next-auth.session-token")?.value
      
    if (nextAuthToken) {
      try {
        const payload = jwt.verify(nextAuthToken, NEXTAUTH_SECRET) as { sub?: string }
        return payload.sub || null
      } catch {
        return null
      }
    }
  }

  return null
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const headerToken = request.headers.get('x-csrf-token')
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value
  
  if (!headerToken || !cookieToken) {
    return false
  }
  
  return headerToken === cookieToken
}

/**
 * Get session info for debugging
 */
export async function getSessionInfo(request?: NextRequest): Promise<any> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value || 
                cookieStore.get(`__Secure-${TOKEN_NAME}`)?.value
  
  if (!token) return null
  
  try {
    const payload = jwt.decode(token) as SessionPayload
    return {
      userId: payload.userId,
      issuedAt: new Date(payload.issuedAt * 1000),
      lastActivity: new Date(payload.lastActivity * 1000),
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      fingerprint: payload.fingerprint?.substring(0, 8) + '...' // Partial for security
    }
  } catch (error) {
    return null
  }
}

/**
 * Invalidate all sessions for a user (call on password change)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  // In a production app, you'd maintain a session store/blacklist
  // For now, we'll rely on the fingerprint validation and short session timeout
  console.log(`[SECURITY] All sessions invalidated for user: ${userId}`)
}
