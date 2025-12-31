import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreementPartners, users } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const userId = await getUserIdFromRequest()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

  const { name, email } = await request.json()
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 })
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await getAgreementForUser(params.id, userId, user.email)
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.insert(agreementPartners).values({
    id: randomUUID(),
    agreementId: params.id,
    name,
    email,
  })

  const agreement = await getAgreementById(params.id)

  triggerAgreementRefresh(params.id)
  return NextResponse.json({ agreement: agreement ? mapAgreement(agreement) : null })
}
