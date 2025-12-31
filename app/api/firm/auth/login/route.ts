import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lawFirms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  verifyPassword,
  generateFirmToken,
  createFirmSessionCookie,
} from "@/lib/firm-auth-helpers"

/**
 * Law Firm Login
 * POST /api/firm/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find firm by email
    const firm = await db.query.lawFirms.findFirst({
      where: eq(lawFirms.email, email.toLowerCase()),
    })

    if (!firm) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if firm has password set
    if (!firm.passwordHash) {
      return NextResponse.json(
        { error: "Please set up your password first. Contact support." },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, firm.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check firm status
    if (firm.status === "suspended") {
      return NextResponse.json(
        { error: "Your account has been suspended. Contact support." },
        { status: 403 }
      )
    }

    // Generate token
    const token = await generateFirmToken(firm.id)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      firm: {
        id: firm.id,
        name: firm.name,
        email: firm.email,
        status: firm.status,
      },
    })

    response.headers.set("Set-Cookie", createFirmSessionCookie(token))

    return response
  } catch (error) {
    console.error("Firm login error:", error)
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    )
  }
}

