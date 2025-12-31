import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportMessages, users } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const userId = await getUserIdFromRequest()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

  const { partnerId, partnerName, message } = await request.json()
  if (!partnerName || !message) {
    return NextResponse.json({ error: "Message and partner name required" }, { status: 400 })
  }

  const allowed = await getAgreementForUser(params.id, userId, user?.email)
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.insert(supportMessages).values({
    id: randomUUID(),
    agreementId: params.id,
    partnerId: partnerId || null,
    partnerName,
    message,
    userId,
  })

  const agreement = await getAgreementById(params.id)

  triggerAgreementRefresh(params.id)
  return NextResponse.json({ agreement: agreement ? mapAgreement(agreement) : null })
}
