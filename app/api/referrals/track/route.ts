import { NextRequest, NextResponse } from "next/server"
import { trackReferralClick } from "@/lib/referrals"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 })
    }

    await trackReferralClick(code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking referral:", error)
    return NextResponse.json({ error: "Failed to track referral" }, { status: 500 })
  }
}

