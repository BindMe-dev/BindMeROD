import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { generateMonthlyInvoice, calculatePlatformRevenue } from "@/lib/billing-engine"

/**
 * Get billing information and invoices
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))

    // Calculate platform revenue
    const revenue = await calculatePlatformRevenue(year, month)

    return NextResponse.json({
      revenue,
      period: `${year}-${String(month).padStart(2, "0")}`,
    })
  } catch (error) {
    console.error("Error fetching billing data:", error)
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}

/**
 * Generate invoice for a law firm
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { firmId, year, month } = body

    if (!firmId || !year || !month) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const invoice = await generateMonthlyInvoice(firmId, year, month)

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}

