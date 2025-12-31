import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { admins } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.userId, userId),
    })

    return NextResponse.json({ isAdmin: !!admin })
  } catch (error) {
    console.error("[ADMIN_CHECK]", error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
