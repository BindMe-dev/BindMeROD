import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { withErrorHandler } from "@/lib/api/error-handler"
import { requireRateLimit } from "@/lib/security/middleware"

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    // Rate limit: 20 checks per 10 minutes per IP
    await requireRateLimit(request, 20, 10 * 60000)

    const { searchParams } = new URL(request.url)
    const email = (searchParams.get("email") || "").trim().toLowerCase()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
    
    // In production, we might want to return 'available: true' always to prevent enumeration,
    // but this endpoint is specifically for UX (real-time validation).
    // We balance this by strict rate limiting.
    return NextResponse.json({ available: !existing })
  } catch (error) {
    if (error instanceof Error && error.name === 'RateLimitError') {
      throw error
    }
    console.error("[CHECK_EMAIL]", error)
    return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
  }
})
