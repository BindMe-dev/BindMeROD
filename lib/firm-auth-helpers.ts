/**
 * Law Firm Authentication Helpers
 * Handles authentication for law firm portal
 */

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { lawFirms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SignJWT, jwtVerify } from "jose"

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
 * Hash password (simple implementation - use bcrypt in production)
 */
export async function hashPassword(password: string): Promise<string> {
  // TODO: Use bcrypt or argon2 in production
  // For now, using a simple hash (NOT SECURE FOR PRODUCTION)
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
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

