import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { verificationSubmissions, admins } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const submission = await db.query.verificationSubmissions.findFirst({
      where: eq(verificationSubmissions.id, params.id),
    })

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("[ADMIN_VERIFICATION_DETAIL]", error)
    return NextResponse.json({ error: "Failed to load verification" }, { status: 500 })
  }
}
