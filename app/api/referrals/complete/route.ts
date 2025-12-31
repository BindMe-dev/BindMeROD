import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { completeReferral } from "@/lib/referrals"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, refereeId } = await request.json()

    if (!code || !refereeId) {
      return NextResponse.json(
        { error: "Referral code and referee ID required" },
        { status: 400 }
      )
    }

    // Complete the referral and award rewards
    await completeReferral(code, refereeId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing referral:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete referral" },
      { status: 500 }
    )
  }
}

