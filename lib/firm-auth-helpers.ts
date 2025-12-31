/**
 * Law Firm Authentication Helpers
 * Handles authentication for law firm portal
 */

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { lawFirms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SignJWT, jwtVerify } from "jose"
import { hashPassword as hashPasswordSecure } from "@/lib/security/password-security"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

const FIRM_TOKEN_COOKIE = "firm_auth_token"

/**
 * Generate JWT token for law firm
 */
export async function generateFirmToken(firmId: string): Promise<string> {
  const token = await new SignJWT({ firmId, type: "firm" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify JWT token and extract firm ID
 */
export async function verifyFirmToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    if (payload.type !== "firm" || typeof payload.firmId !== "string") {
      return null
    }

    return payload.firmId
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

/**
 * Get firm ID from request cookies
 */
export async function getFirmIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get(FIRM_TOKEN_COOKIE)?.value

    if (!token) {
      return null
    }

    return await verifyFirmToken(token)
  } catch (error) {
    console.error("Error getting firm ID from request:", error)
    return null
  }
}

/**
 * Get authenticated firm from request
 */
export async function getAuthenticatedFirm(request: NextRequest) {
  const firmId = await getFirmIdFromRequest(request)

  if (!firmId) {
    return null
  }

  const firm = await db.query.lawFirms.findFirst({
    where: eq(lawFirms.id, firmId),
  })

  return firm || null
}

/**
 * Detect if a hash is SHA-256 (legacy) or bcrypt (current)
 */
function isLegacySHA256Hash(hash: string): boolean {
  // SHA-256 produces 64 character hex strings
  return /^[a-f0-9]{64}$/i.test(hash)
}

/**
 * Legacy SHA-256 hash for comparison only (DO NOT USE FOR NEW PASSWORDS)
 */
async function legacySHA256Hash(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Hash password using bcrypt (SECURE)
 */
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordSecure(password)
}

/**
 * Verify password with auto-migration from SHA-256 to bcrypt
 * Returns { valid: boolean, needsRehash: boolean, newHash?: string }
 */
export async function verifyPassword(
  password: string, 
  hash: string
): Promise<{ valid: boolean; needsRehash: boolean; newHash?: string }> {
  // Check if this is a legacy SHA-256 hash
  if (isLegacySHA256Hash(hash)) {
    const legacyHash = await legacySHA256Hash(password)
    const valid = legacyHash === hash
    
    if (valid) {
      // Password is correct - generate new bcrypt hash for migration
      const newHash = await hashPassword(password)
      return { valid: true, needsRehash: true, newHash }
    }
    
    // Add artificial delay to prevent timing attacks
    await bcrypt.compare("dummy", "$2b$10$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxxxxxxxxxxxxxxxxx")
    return { valid: false, needsRehash: false }
  }
  
  // Modern bcrypt verification
  const valid = await bcrypt.compare(password, hash)
  return { valid, needsRehash: false }
}

/**
 * Create firm session cookie
 */
export function createFirmSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
  
  return `${FIRM_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
}

/**
 * Clear firm session cookie
 */
export function clearFirmSessionCookie(): string {
  return `${FIRM_TOKEN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

