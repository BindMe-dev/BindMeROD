import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreementPartners, users } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

export async function DELETE(_: Request, context: { params: Promise<{ id: string; partnerId: string }> }) {
  const params = await context.params
  const userId = await getUserIdFromRequest()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await getAgreementForUser(params.id, userId, user.email)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(agreementPartners).where(eq(agreementPartners.id, params.partnerId))

  const agreement = await getAgreementById(params.id)

  triggerAgreementRefresh(params.id)
  return NextResponse.json({ agreement: agreement ? mapAgreement(agreement) : null })
}
