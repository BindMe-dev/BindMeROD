import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedFirm } from "@/lib/firm-auth-helpers"

/**
 * Get current authenticated law firm
 * GET /api/firm/auth/me
 */
export async function GET(request: NextRequest) {
  try {
    const firm = await getAuthenticatedFirm(request)

    if (!firm) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return firm data (excluding sensitive fields)
    return NextResponse.json({
      firm: {
        id: firm.id,
        name: firm.name,
        email: firm.email,
        phone: firm.phone,
        status: firm.status,
        verified: firm.verified,
        practiceAreas: firm.practiceAreas,
        totalCases: firm.totalCases,
        activeCases: firm.activeCases,
        completedCases: firm.completedCases,
        successRate: firm.successRate,
        userRating: firm.userRating,
        reviewCount: firm.reviewCount,
        subscriptionTier: firm.subscriptionTier,
        subscriptionStatus: firm.subscriptionStatus,
      },
    })
  } catch (error) {
    console.error("Error fetching firm:", error)
    return NextResponse.json(
      { error: "Failed to fetch firm" },
      { status: 500 }
    )
  }
}

