import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { getUserConsent, updateUserConsent } from "@/lib/gdpr-service"

/**
 * Get user consent preferences
 * GET /api/gdpr/consent
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const consent = await getUserConsent(userId)

    return NextResponse.json({ consent })
  } catch (error) {
    console.error("Error fetching consent:", error)
    return NextResponse.json(
      { error: "Failed to fetch consent" },
      { status: 500 }
    )
  }
}

/**
 * Update user consent preferences
 * POST /api/gdpr/consent
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { marketing, analytics, thirdParty } = body

    await updateUserConsent(userId, {
      marketing,
      analytics,
      thirdParty,
    })

    return NextResponse.json({
      success: true,
      message: "Consent preferences updated",
    })
  } catch (error) {
    console.error("Error updating consent:", error)
    return NextResponse.json(
      { error: "Failed to update consent" },
      { status: 500 }
    )
  }
}

