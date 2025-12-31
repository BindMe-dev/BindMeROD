import { randomBytes, createHash, timingSafeEqual } from "crypto"
import { NextRequest } from "next/server"

// Account lockout tracking
const accountLockouts = new Map<string, { attempts: number; lockedUntil: Date; lastAttempt: Date }>()
const ipAttempts = new Map<string, { attempts: number; lastAttempt: Date }>()

// Security configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  MAX_IP_ATTEMPTS: 20,
  IP_LOCKOUT_DURATION: 60 * 60 * 1000, // 1 hour
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  TOKEN_ENTROPY_BITS: 256,
  CSRF_TOKEN_LENGTH: 32
}

export interface SecurityCheck {
  allowed: boolean
  reason?: string
  remainingAttempts?: number
  lockedUntil?: Date
}

// Generate cryptographically secure tokens
export function generateSecureToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex')
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return randomBytes(SECURITY_CONFIG.CSRF_TOKEN_LENGTH).toString('hex')
}

// Validate CSRF token with timing-safe comparison
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false
  }
  
  const tokenBuffer = Buffer.from(token, 'hex')
  const expectedBuffer = Buffer.from(expectedToken, 'hex')
  
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false
  }
  
  return timingSafeEqual(tokenBuffer, expectedBuffer)
}

// Check account lockout status
export function checkAccountLockout(identifier: string): SecurityCheck {
  const lockout = accountLockouts.get(identifier)
  
  if (!lockout) {
    return { allowed: true }
  }
  
  const now = new Date()
  
  // Check if lockout has expired
  if (lockout.lockedUntil && now > lockout.lockedUntil) {
    accountLockouts.delete(identifier)
    return { allowed: true }
  }
  
  // Check if account is locked
  if (lockout.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    return {
      allowed: false,
      reason: "Account temporarily locked due to too many failed attempts",
      lockedUntil: lockout.lockedUntil
    }
  }
  
  return {
    allowed: true,
    remainingAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - lockout.attempts
  }
}

// Record failed login attempt
export function recordFailedAttempt(identifier: string, ip: string): void {
  const now = new Date()
  
  // Record account-specific attempt
  const accountLockout = accountLockouts.get(identifier) || { attempts: 0, lockedUntil: new Date(0), lastAttempt: new Date(0) }
  accountLockout.attempts += 1
  accountLockout.lastAttempt = now
  
  if (accountLockout.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    accountLockout.lockedUntil = new Date(now.getTime() + SECURITY_CONFIG.LOCKOUT_DURATION)
  }
  
  accountLockouts.set(identifier, accountLockout)
  
  // Record IP-specific attempt
  const ipAttempt = ipAttempts.get(ip) || { attempts: 0, lastAttempt: new Date(0) }
  ipAttempt.attempts += 1
  ipAttempt.lastAttempt = now
  ipAttempts.set(ip, ipAttempt)
  
  // Log security event
  console.warn(`[SECURITY] Failed login attempt for ${identifier} from ${ip}. Attempts: ${accountLockout.attempts}`)
}

// Record successful login (reset counters)
export function recordSuccessfulLogin(identifier: string, ip: string): void {
  accountLockouts.delete(identifier)
  
  // Reset IP attempts for this IP
  const ipAttempt = ipAttempts.get(ip)
  if (ipAttempt) {
    ipAttempt.attempts = 0
  }
  
  console.log(`[SECURITY] Successful login for ${identifier} from ${ip}`)
}

// Check IP-based rate limiting
export function checkIPRateLimit(ip: string): SecurityCheck {
  const attempt = ipAttempts.get(ip)
  
  if (!attempt) {
    return { allowed: true }
  }
  
  const now = new Date()
  const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime()
  
  // Reset if enough time has passed
  if (timeSinceLastAttempt > SECURITY_CONFIG.IP_LOCKOUT_DURATION) {
    ipAttempts.delete(ip)
    return { allowed: true }
  }
  
  if (attempt.attempts >= SECURITY_CONFIG.MAX_IP_ATTEMPTS) {
    return {
      allowed: false,
      reason: "Too many attempts from this IP address",
      lockedUntil: new Date(attempt.lastAttempt.getTime() + SECURITY_CONFIG.IP_LOCKOUT_DURATION)
    }
  }
  
  return { allowed: true }
}

// Extract client IP with proper header handling
export function getClientIP(request: NextRequest): string {
  // Check various headers in order of preference
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip',       // Nginx
    'x-forwarded-for', // Standard proxy header
    'x-client-ip',     // Some proxies
    'x-forwarded',     // Some proxies
    'forwarded-for',   // Some proxies
    'forwarded'        // RFC 7239
  ]
  
  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // Handle comma-separated IPs (take the first one)
      const ip = value.split(',')[0].trim()
      if (isValidIP(ip)) {
        return ip
      }
    }
  }
  
  // Fallback to remote address or unknown
  return 'unknown'
}

// Validate IP address format
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Generate session fingerprint
export function generateSessionFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  const ip = getClientIP(request)
  
  const fingerprint = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`
  return createHash('sha256').update(fingerprint).digest('hex')
}

// Validate session fingerprint
export function validateSessionFingerprint(request: NextRequest, storedFingerprint: string): boolean {
  const currentFingerprint = generateSessionFingerprint(request)
  return timingSafeEqual(
    Buffer.from(currentFingerprint, 'hex'),
    Buffer.from(storedFingerprint, 'hex')
  )
}

// Clean up expired lockouts (call periodically)
export function cleanupExpiredLockouts(): void {
  const now = new Date()
  
  // Clean account lockouts
  for (const [identifier, lockout] of accountLockouts.entries()) {
    if (lockout.lockedUntil && now > lockout.lockedUntil) {
      accountLockouts.delete(identifier)
    }
  }
  
  // Clean IP attempts
  for (const [ip, attempt] of ipAttempts.entries()) {
    const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime()
    if (timeSinceLastAttempt > SECURITY_CONFIG.IP_LOCKOUT_DURATION) {
      ipAttempts.delete(ip)
    }
  }
}

// Get security metrics
export function getSecurityMetrics() {
  return {
    accountLockouts: accountLockouts.size,
    ipAttempts: ipAttempts.size,
    config: SECURITY_CONFIG
  }
}

// Detect suspicious patterns
export function detectSuspiciousActivity(identifier: string, ip: string): string[] {
  const warnings: string[] = []
  
  const accountLockout = accountLockouts.get(identifier)
  const ipAttempt = ipAttempts.get(ip)
  
  if (accountLockout && accountLockout.attempts > 2) {
    warnings.push(`Multiple failed attempts for account: ${accountLockout.attempts}`)
  }
  
  if (ipAttempt && ipAttempt.attempts > 10) {
    warnings.push(`High number of attempts from IP: ${ipAttempt.attempts}`)
  }
  
  // Check for rapid attempts
  if (accountLockout) {
    const timeSinceLastAttempt = Date.now() - accountLockout.lastAttempt.getTime()
    if (timeSinceLastAttempt < 1000) { // Less than 1 second
      warnings.push("Rapid successive attempts detected")
    }
  }
  
  return warnings
}

// Initialize cleanup interval
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredLockouts, 5 * 60 * 1000) // Clean every 5 minutes
}