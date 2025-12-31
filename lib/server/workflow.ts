import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { agreements, legalSignatures, sharedParticipants, users } from "@/lib/db/schema"
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/api/error-handler"

export async function getWorkflowContext(agreementId: string, userId: string) {
  const agreement = await db.query.agreements.findFirst({
    where: eq(agreements.id, agreementId),
    with: {
      legalSignatures: true,
      sharedWith: true,
    }
  })

  if (!agreement) {
    throw new NotFoundError("Agreement")
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user) {
    throw new AuthorizationError("User not found")
  }

  const isCreator = agreement.userId === userId
  const participant = agreement.sharedWith.find(p => 
    p.userId === userId || p.userEmail.toLowerCase() === user.email.toLowerCase()
  )
  const isCounterparty = participant?.role === 'counterparty'
  
  if (!isCreator && !isCounterparty) {
    throw new AuthorizationError("Only agreement participants can perform this action")
  }

  const creatorSigned = agreement.legalSignatures.some(s => s.role === 'creator')
  const counterpartySigned = agreement.legalSignatures.some(s => s.role === 'counterparty')
  const bothSigned = creatorSigned && counterpartySigned

  return {
    agreement,
    user,
    userId,
    isCreator,
    isCounterparty,
    bothSigned,
    participant
  }
}

export function assertBothSigned(context: { bothSigned: boolean }) {
  if (!context.bothSigned) {
    throw new ValidationError("Both parties must sign the agreement before this action")
  }
}

export function assertNotSelfAction(actorId: string, targetId: string | null, actionName: string) {
  if (actorId === targetId) {
    throw new ValidationError(`You cannot ${actionName} your own action`)
  }
}
