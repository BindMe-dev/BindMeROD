import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, userPreferences } from "@/lib/db/schema"
import { createSessionToken, setSessionCookie } from "@/lib/server-auth"
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/user-types"
import bcrypt from "bcryptjs"

function sanitizeUser(user: any, prefs: any | null) {
  let parsedAddress: any = {}
  if (user.verifiedAddress) {
    try {
      parsedAddress = JSON.parse(user.verifiedAddress)
    } catch {
      parsedAddress = { streetAddress: user.verifiedAddress }
    }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    publicProfile: user.publicProfile || DEFAULT_PUBLIC_PROFILE,
    isVerified: user.isVerified ?? false,
    verifiedAt: user.verifiedAt,
    verificationType: user.verificationType,
    dateOfBirth: user.dateOfBirth,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    address: parsedAddress.streetAddress || "",
    city: parsedAddress.city || "",
    county: parsedAddress.county || "",
    postcode: parsedAddress.postcode || "",
    country: parsedAddress.country || "",
    preferences: prefs
      ? {
          ...prefs,
          agreementNotificationSettings: prefs.agreementNotificationSettings || {},
        }
      : null,
    agreementCount: user.agreementCount ?? 0,
    createdAt: user.createdAt,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, identifier, password } = body
    
    // Basic validation
    const loginIdentifier = (identifier || email || "").trim().toLowerCase()
    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, loginIdentifier),
    })
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const prefs = await db.query.userPreferences.findFirst({ 
      where: (userPreferences, { eq }) => eq(userPreferences.userId, user.id) 
    })

    // Verify password
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    const { token, csrfToken } = createSessionToken(user.id, request)
    await setSessionCookie(token, csrfToken, request)

    console.log("[LOGIN] Session created successfully for user:", user.email)
    console.log("[LOGIN] Environment:", process.env.NODE_ENV)
    console.log("[LOGIN] Cookie will be set as secure:", process.env.NODE_ENV === "production")

    return NextResponse.json({ 
      user: sanitizeUser(user, prefs),
      csrfToken
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
