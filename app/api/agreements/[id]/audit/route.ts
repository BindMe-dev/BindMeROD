import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auditLogs, users } from "@/lib/db/schema"
import { getAgreementById, ensureAgreementAccess, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params
    const agreementId = params?.id
    if (!agreementId) return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })

    const userId = await getUserIdFromRequest()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 })

    const { action, details } = body
    if (!action) return NextResponse.json({ error: "Action is required" }, { status: 400 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

    const allowed = await ensureAgreementAccess(agreementId, userId, user?.email)
    if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.insert(auditLogs).values({
      id: randomUUID(),
      agreementId,
      action,
      details: details || "",
      performedBy: userId,
      performedByEmail: user?.email,
    })

    const agreement = await getAgreementById(agreementId)

    if (!agreement) {
      return NextResponse.json({ error: "Failed to add audit log" }, { status: 500 })
    }

    triggerAgreementRefresh(agreementId)
    return NextResponse.json({ agreement: mapAgreement(agreement) })
  } catch (error) {
    console.error("[AUDIT_LOG]", error)
    return NextResponse.json({ error: "Failed to add audit log" }, { status: 500 })
  }
}
