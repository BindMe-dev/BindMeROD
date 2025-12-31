import { z } from "zod"

// Base agreement schema
export const baseAgreementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  type: z.enum(["one-time", "recurring", "deadline", "bet"], {
    errorMap: () => ({ message: "Invalid agreement type" })
  }),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "Too many tags").optional(),
  isPublic: z.boolean().default(false),
  isShared: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  confidentialityLevel: z.enum(["public", "standard", "confidential", "restricted"]).default("standard"),
})

// Date validation helpers
const dateString = z.string().refine((date) => {
  const parsed = new Date(date)
  return !isNaN(parsed.getTime()) && parsed > new Date("1900-01-01")
}, "Invalid date format")

const futureDateString = z.string().refine((date) => {
  const parsed = new Date(date)
  return !isNaN(parsed.getTime()) && parsed > new Date()
}, "Date must be in the future")

// Type-specific schemas
export const oneTimeAgreementSchema = baseAgreementSchema.extend({
  type: z.literal("one-time"),
  targetDate: dateString.optional(),
  effectiveDate: dateString.default(() => new Date().toISOString().split("T")[0]),
})

export const recurringAgreementSchema = baseAgreementSchema.extend({
  type: z.literal("recurring"),
  recurrenceFrequency: z.enum(["daily", "weekly", "monthly", "yearly"], {
    errorMap: () => ({ message: "Invalid recurrence frequency" })
  }),
  startDate: dateString,
  endDate: dateString.optional(),
  autoRenewal: z.boolean().default(false),
  renewalPeriod: z.number().positive().optional(),
})

export const deadlineAgreementSchema = baseAgreementSchema.extend({
  type: z.literal("deadline"),
  deadline: futureDateString,
  reminderDays: z.array(z.number().positive()).max(5, "Too many reminder days").default([7, 3, 1]),
})

export const betAgreementSchema = baseAgreementSchema.extend({
  type: z.literal("bet"),
  betStake: z.string().min(1, "Bet stake is required"),
  betAmount: z.string().optional(),
  betOdds: z.string().optional(),
  betOpponentName: z.string().min(1, "Opponent name is required"),
  betOpponentEmail: z.string().email("Invalid opponent email"),
  betSettlementDate: futureDateString,
  betTerms: z.string().max(1000, "Bet terms too long").optional(),
})

// Shared participant schema
export const sharedParticipantSchema = z.object({
  role: z.enum(["counterparty", "witness"]).default("counterparty"),
  userId: z.string().optional(),
  userName: z.string().min(1, "Participant name is required"),
  userEmail: z.string().email("Invalid participant email"),
  joinedAt: z.string().default(() => new Date().toISOString()),
})

// Legal signature schema
export const legalSignatureSchema = z.object({
  signedByEmail: z.string().email("Invalid signer email"),
  signedByName: z.string().min(1, "Signer name is required"),
  signatureData: z.string().min(1, "Signature data is required"),
  role: z.enum(["creator", "counterparty", "witness"]).default("creator"),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.string().optional(),
})

// Main agreement creation schema with discriminated union
export const createAgreementSchema = z.discriminatedUnion("type", [
  oneTimeAgreementSchema,
  recurringAgreementSchema,
  deadlineAgreementSchema,
  betAgreementSchema,
]).and(z.object({
  templateId: z.string().min(1, "Template ID is required").optional(),
  templateValues: z.record(z.string(), z.any()).default({}),
  sharedWith: z.array(sharedParticipantSchema).max(10, "Too many participants").optional(),
  signature: legalSignatureSchema.optional(),
  legal: z.object({
    legalIntentAccepted: z.boolean().default(false),
    termsAcceptedVersion: z.string().default("1.0.0"),
    jurisdictionClause: z.string().default("United Kingdom"),
    witnessRequired: z.boolean().default(false),
  }).optional(),
}))

// Update agreement schema (partial)
export const updateAgreementSchema = z.object({
  id: z.string().uuid("Invalid agreement ID"),
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().min(1, "Description is required").max(2000, "Description too long").optional(),
  type: z.enum(["one-time", "recurring", "deadline", "bet"], {
    errorMap: () => ({ message: "Invalid agreement type" })
  }).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "Too many tags").optional(),
  isPublic: z.boolean().optional(),
  isShared: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  confidentialityLevel: z.enum(["public", "standard", "confidential", "restricted"]).optional(),

  // one-time
  targetDate: dateString.optional(),
  effectiveDate: dateString.optional(),

  // recurring
  recurrenceFrequency: z.enum(["daily", "weekly", "monthly", "yearly"], {
    errorMap: () => ({ message: "Invalid recurrence frequency" })
  }).optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  autoRenewal: z.boolean().optional(),
  renewalPeriod: z.number().positive().optional(),

  // deadline
  deadline: futureDateString.optional(),
  reminderDays: z.array(z.number().positive()).max(5, "Too many reminder days").optional(),

  // bet
  betStake: z.string().min(1, "Bet stake is required").optional(),
  betAmount: z.string().optional(),
  betOdds: z.string().optional(),
  betOpponentName: z.string().min(1, "Opponent name is required").optional(),
  betOpponentEmail: z.string().email("Invalid opponent email").optional(),
  betSettlementDate: futureDateString.optional(),
  betTerms: z.string().max(1000, "Bet terms too long").optional(),

  // shared participants/signatures/legal
  sharedWith: z.array(sharedParticipantSchema).max(10, "Too many participants").optional(),
  signature: legalSignatureSchema.partial().optional(),
  legal: z.object({
    legalIntentAccepted: z.boolean().default(false),
    termsAcceptedVersion: z.string().default("1.0.0"),
    jurisdictionClause: z.string().default("United Kingdom"),
    witnessRequired: z.boolean().default(false),
  }).partial().optional(),
  templateId: z.string().min(1).optional(),
  templateValues: z.record(z.string(), z.any()).optional(),
})

// Agreement completion schema
export const completeAgreementSchema = z.object({
  agreementId: z.string().uuid("Invalid agreement ID"),
  completionNotes: z.string().max(500, "Completion notes too long").optional(),
  evidence: z.array(z.object({
    type: z.enum(["image", "document", "link"]),
    url: z.string().url("Invalid evidence URL"),
    description: z.string().max(200, "Evidence description too long").optional(),
  })).max(5, "Too many evidence items").optional(),
})

// Agreement rejection schema
export const rejectAgreementSchema = z.object({
  agreementId: z.string().uuid("Invalid agreement ID"),
  rejectionReason: z.string().min(1, "Rejection reason is required").max(1000, "Rejection reason too long"),
  evidence: z.array(z.object({
    type: z.enum(["image", "document", "link"]),
    url: z.string().url("Invalid evidence URL"),
    description: z.string().max(200, "Evidence description too long").optional(),
  })).max(5, "Too many evidence items").optional(),
})

// Export types
export type CreateAgreementInput = z.infer<typeof createAgreementSchema>
export type UpdateAgreementInput = z.infer<typeof updateAgreementSchema>
export type CompleteAgreementInput = z.infer<typeof completeAgreementSchema>
export type RejectAgreementInput = z.infer<typeof rejectAgreementSchema>
export type SharedParticipant = z.infer<typeof sharedParticipantSchema>
export type LegalSignature = z.infer<typeof legalSignatureSchema>
