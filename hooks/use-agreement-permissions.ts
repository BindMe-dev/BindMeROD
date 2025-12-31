import { useMemo } from "react"
import { getAvailableActions, type UserContext } from "@/lib/agreement-actions"
import type { Agreement } from "@/lib/agreement-types"

export function useAgreementPermissions(
  agreement: Agreement | null,
  userId: string,
  userEmail: string
) {
  return useMemo(() => {
    if (!agreement) {
      return {
        actions: null,
        userContext: null,
        signatures: {
          all: [],
          creator: null,
          counterparty: [],
          witness: [],
          hasSignedAsCounterparty: false,
          hasSignedAsWitness: false,
        }
      }
    }

    const allSignatures = agreement.legalSignatures || agreement.legal?.signatures || []
    const counterpartySignatures = allSignatures.filter(s => s.role === "counterparty")
    const witnessSignatures = allSignatures.filter(s => s.role === "witness")
    const creatorSignature = allSignatures.find(s => s.role === "creator")

    const sharedParticipants = agreement.sharedWith || []
    const counterparties = sharedParticipants.filter(p => (p.role ?? "counterparty") === "counterparty")
    const witnesses = sharedParticipants.filter(p => p.role === "witness")
    
    const userEmailLower = userEmail.toLowerCase()
    const isCreator = agreement.userId === userId
    const isCounterparty = 
      counterparties.some(p => p.userId === userId) ||
      counterparties.some(p => (p.userEmail || "").toLowerCase() === userEmailLower)
    const isWitness = 
      witnesses.some(p => p.userId === userId) ||
      witnesses.some(p => (p.userEmail || "").toLowerCase() === userEmailLower)

    const hasSignedAsCounterparty = counterpartySignatures.some(
      s => s.signedBy === userId || s.signedByEmail?.toLowerCase() === userEmailLower
    )
    const hasSignedAsWitness = witnessSignatures.some(
      s => s.signedBy === userId || s.signedByEmail?.toLowerCase() === userEmailLower
    )

    const userContext: UserContext = {
      userId,
      email: userEmail,
      isCreator,
      isCounterparty,
      isWitness,
      hasSignedAsCounterparty,
      hasSignedAsWitness,
      isAdmin: false, // TODO: Implement admin detection from user role/permissions
    }

    const actions = getAvailableActions(agreement, userContext)

    return {
      actions,
      userContext,
      signatures: {
        all: allSignatures,
        creator: creatorSignature,
        counterparty: counterpartySignatures,
        witness: witnessSignatures,
        hasSignedAsCounterparty,
        hasSignedAsWitness,
      },
      participants: {
        counterparties,
        witnesses,
        isCreator,
        isCounterparty,
        isWitness,
      }
    }
  }, [agreement, userId, userEmail])
}
