import { and, eq, inArray, or, sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  agreements,
  agreementPartners,
  auditLogs,
  completions,
  legalSignatures,
  notifications,
  participantCompletions,
  sharedParticipants,
  supportMessages,
  users,
} from "@/lib/db/schema"
import type { Agreement } from "@/lib/agreement-types"

export const agreementWithRelations = {
  completions: true,
  sharedWith: {
    with: {
      completions: true,
    },
  },
  partners: true,
  supportMessages: true,
  legalSignatures: true,
  auditLogs: true,
  user: true,
} as const

export type AgreementWithRelations = InferSelectModel<typeof agreements> & {
  completions: InferSelectModel<typeof completions>[]
  sharedWith: (InferSelectModel<typeof sharedParticipants> & {
    completions: InferSelectModel<typeof participantCompletions>[]
  })[]
  partners: InferSelectModel<typeof agreementPartners>[]
  messages: InferSelectModel<typeof supportMessages>[]
  legalSignatures: InferSelectModel<typeof legalSignatures>[]
  auditLogs: InferSelectModel<typeof auditLogs>[]
  user?: InferSelectModel<typeof users> | null
}

export function mapAgreement(agreement: any): Agreement {
  return {
    ...agreement,
    sharedWith: agreement.sharedWith || [],
    completions: agreement.completions || [],
    partners: agreement.partners || [],
    messages: agreement.supportMessages || [],
    legalSignatures: agreement.legalSignatures || [],
    auditLogs: agreement.auditLogs || [],
    user: agreement.user || null,
  }
}

export async function getAgreementById(id: string) {
  return await db.query.agreements.findFirst({
    where: eq(agreements.id, id),
    with: {
      user: true, // This ensures creator info is included
      completions: true,
      sharedWith: {
        with: {
          completions: true,
        },
      },
      partners: true,
      supportMessages: true,
      legalSignatures: true,
      auditLogs: true,
    },
  })
}

export async function ensureAgreementAccess(agreementId: string, userId: string, userEmail?: string | null) {
  const conditions = [eq(agreements.userId, userId), eq(sharedParticipants.userId, userId)]
  if (userEmail) {
    const emailLower = userEmail.toLowerCase()
    conditions.push(
      eq(sharedParticipants.userEmail, userEmail),
      sql`lower("SharedParticipant"."userEmail") = ${emailLower}`,
    )
  }

  const rows = await db
    .select({ id: agreements.id })
    .from(agreements)
    .leftJoin(sharedParticipants, eq(sharedParticipants.agreementId, agreements.id))
    .where(and(eq(agreements.id, agreementId), or(...conditions)))
    .limit(1)

  return rows[0]?.id ?? null
}

export async function getAgreementForUser(agreementId: string, userId: string, userEmail?: string | null) {
  const allowed = await ensureAgreementAccess(agreementId, userId, userEmail)
  if (!allowed) return null
  return getAgreementById(agreementId)
}

export async function getAccessibleAgreementIds(userId: string, userEmail?: string | null) {
  const conditions = [eq(agreements.userId, userId), eq(sharedParticipants.userId, userId)]
  if (userEmail) {
    conditions.push(eq(sharedParticipants.userEmail, userEmail))
  }

  const rows = await db
    .select({ id: agreements.id })
    .from(agreements)
    .leftJoin(sharedParticipants, eq(sharedParticipants.agreementId, agreements.id))
    .where(or(...conditions))

  const ids = new Set<string>()
  rows.forEach((row) => {
    if (row.id) ids.add(row.id)
  })
  return ids
}

export async function listAgreementsForUser(userId: string, userEmail?: string | null) {
  const ids = await getAccessibleAgreementIds(userId, userEmail)
  if (ids.size === 0) return []

  return db.query.agreements.findMany({
    where: inArray(agreements.id, Array.from(ids)),
    with: agreementWithRelations,
    orderBy: (agreements, { desc }) => desc(agreements.createdAt),
  })
}

export async function createNotificationBatch(data: Array<InferInsertModel<typeof notifications>>) {
  if (data.length === 0) return
  await db.insert(notifications).values(data)
}




