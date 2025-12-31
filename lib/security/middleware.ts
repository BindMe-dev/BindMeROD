import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest, validateCSRFToken } from "@/lib/server-auth"
import { 
  checkRateLimit, 
  AuthenticationError, 
  AuthorizationError, 
  RateLimitError 
} from "@/lib/api/error-handler"
import { 
  getClientIP, 
  checkAccountLockout, 
  checkIPRateLimit,
  recordFailedAttempt,
  recordSuccessfulLogin,
  detectSuspiciousActivity
} from "@/lib/security/auth-security"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Rate limiting middleware
export async function requireRateLimit(
  request: NextRequest,
  maxRequests: number,
  windowMs: number,
  keyPrefix: string = 'api'
): Promise<void> {
  const ip = getClientIP(request)
  const key = `${keyPrefix}:${ip}`
  
  if (!checkRateLimit(key, maxRequests, windowMs)) {
    console.warn(`[SECURITY] Rate limit exceeded for ${ip} on ${request.url}`)
    throw new RateLimitError(`Too many requests. Please try again later.`)
  }
}

// Authentication middleware
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserIdFromRequest(request)
  
  if (!userId) {
    throw new AuthenticationError("Authentication required")
  }
  
  return userId
}

// Enhanced authentication with security checks
export async function requireSecureAuth(request: NextRequest): Promise<{ userId: string; user: any }> {
  const ip = getClientIP(request)
  
  // Check IP-based rate limiting first
  const ipCheck = checkIPRateLimit(ip)
  if (!ipCheck.allowed) {
    console.warn(`[SECURITY] IP blocked: ${ip} - ${ipCheck.reason}`)
    throw new RateLimitError(ipCheck.reason || "Too many requests from this IP")
  }
  
  const userId = await getUserIdFromRequest(request)
  
  if (!userId) {
    throw new AuthenticationError("Authentication required")
  }
  
  // Get user details for additional checks
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })
  
  if (!user) {
    throw new AuthenticationError("Invalid session")
  }
  
  // Check account lockout
  const accountCheck = checkAccountLockout(user.email)
  if (!accountCheck.allowed) {
    console.warn(`[SECURITY] Account locked: ${user.email} - ${accountCheck.reason}`)
    throw new AuthorizationError(accountCheck.reason || "Account temporarily locked")
  }
  
  // Detect suspicious activity
  const warnings = detectSuspiciousActivity(user.email, ip)
  if (warnings.length > 0) {
    console.warn(`[SECURITY] Suspicious activity detected for ${user.email}:`, warnings)
  }
  
  return { userId, user }
}

// CSRF protection middleware
export async function requireCSRF(request: NextRequest): Promise<void> {
  // Skip CSRF for GET requests (they should be idempotent)
  if (request.method === 'GET') {
    return
  }
  
  // Allow disabling ONLY in development with explicit env var
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
    return
  }
  
  const isValid = await validateCSRFToken(request)
  if (!isValid) {
    console.warn(`[SECURITY] CSRF token validation failed for ${getClientIP(request)}`)
    throw new AuthorizationError("Invalid CSRF token")
  }
}

// Admin authorization middleware
export async function requireAdmin(request: NextRequest): Promise<{ userId: string; user: any }> {
  const { userId, user } = await requireSecureAuth(request)
  
  // Check if user has admin role (you'll need to add this to your user schema)
  if (!user.isAdmin && user.email !== 'admin@bindme.co.uk') {
    throw new AuthorizationError("Admin access required")
  }
  
  return { userId, user }
}

// Email verification middleware
export async function requireVerifiedEmail(request: NextRequest): Promise<{ userId: string; user: any }> {
  const { userId, user } = await requireSecureAuth(request)
  
  if (!user.isVerified) {
    throw new AuthorizationError("Email verification required")
  }
  
  return { userId, user }
}

// Content-Type validation middleware
export function requireJSON(request: NextRequest): void {
  const contentType = request.headers.get('content-type') || ''
  
  if (!contentType.includes('application/json')) {
    throw new Error('Content-Type must be application/json')
  }
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust as needed
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Prevent caching of sensitive responses
  if (response.status === 401 || response.status === 403) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }
  
  return response
}

// Login attempt tracking
export async function trackLoginAttempt(
  identifier: string,
  ip: string,
  success: boolean,
  request: NextRequest
): Promise<void> {
  if (success) {
    recordSuccessfulLogin(identifier, ip)
    console.log(`[AUTH] Successful login: ${identifier} from ${ip}`)
  } else {
    recordFailedAttempt(identifier, ip)
    
    // Log additional details for failed attempts
    const userAgent = request.headers.get('user-agent') || 'unknown'
    console.warn(`[SECURITY] Failed login attempt: ${identifier} from ${ip}`, {
      userAgent,
      timestamp: new Date().toISOString(),
      url: request.url
    })
    
    // Check if this triggers any alerts
    const warnings = detectSuspiciousActivity(identifier, ip)
    if (warnings.length > 0) {
      console.error(`[SECURITY_ALERT] Multiple security warnings for ${identifier}:`, warnings)
    }
  }
}

// Validate request origin
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Base allowed origins
  const allowedOrigins = [
    'https://bindme.co.uk',
    'https://www.bindme.co.uk'
  ]
  
  // Add development origins in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://192.168.1.230:3000',
      'http://192.168.1.230:3001'
    )
  }
  
  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    return true // Allow same-origin requests
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    return true
  }
  
  if (referer) {
    const refererOrigin = new URL(referer).origin
    return allowedOrigins.includes(refererOrigin)
  }
  
  return false
}

// Request size validation
export function validateRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): void {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new Error('Request payload too large')
  }
}

// Honeypot field validation (add to forms to catch bots)
export function validateHoneypot(body: any): void {
  // If honeypot field is filled, it's likely a bot
  if (body.website || body.url || body.homepage) {
    console.warn(`[SECURITY] Honeypot triggered from ${getClientIP}`)
    throw new Error('Invalid request')
  }
}