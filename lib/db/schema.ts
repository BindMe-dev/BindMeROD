import { relations } from "drizzle-orm"
import { pgTable, text, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    firstName: text("firstName").notNull(),
    middleName: text("middleName"),
    lastName: text("lastName").notNull(),
    name: text("name").notNull(), // Full name for display
    dateOfBirth: text("dateOfBirth").notNull(), // YYYY-MM-DD format
    ipAddress: text("ipAddress"),
    publicProfile: jsonb("publicProfile"),
    agreementCount: integer("agreementCount").notNull().default(0),
    isVerified: boolean("isVerified").notNull().default(false),
    verifiedAt: timestamp("verifiedAt", { withTimezone: false }),
    verificationType: text("verificationType"), // 'passport', 'driving_licence', 'ni_letter'
    verifiedName: text("verifiedName"), // Name as it appears on ID
    verifiedAddress: text("verifiedAddress"),
    verifiedDob: text("verifiedDob"),
    documentReference: text("documentReference"), // Document number (not full document)
    // Two-Factor Authentication fields
    twoFactorEnabled: boolean("twoFactorEnabled").default(false),
    twoFactorSecret: text("twoFactorSecret"),
    backupCodes: text("backupCodes"), // JSON array of backup codes
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    emailKey: uniqueIndex("User_email_key").on(table.email),
  }),
)

export const admins = pgTable(
  "Admin",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("Admin_userId_idx").on(table.userId),
  }),
)

export const verificationSubmissions = pgTable(
  "VerificationSubmission",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    documentUrl: text("documentUrl"),
    selfieUrl: text("selfieUrl"),
    extractedName: text("extractedName"),
    extractedDob: text("extractedDob"),
    extractedDocNumber: text("extractedDocNumber"),
    extractedDocType: text("extractedDocType"),
    status: text("status").notNull().default("pending"), // pending, processing, approved, rejected
    reviewerId: text("reviewerId").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    reviewNotes: text("reviewNotes"),
    rejectionReason: text("rejectionReason"),
    verificationType: text("verificationType"),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("VerificationSubmission_userId_idx").on(table.userId),
    statusIdx: index("VerificationSubmission_status_idx").on(table.status),
  }),
)

export const adminAuditLogs = pgTable(
  "AdminAuditLog",
  {
    id: text("id").primaryKey(),
    adminId: text("adminId")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade", onUpdate: "cascade" }),
    action: text("action").notNull(),
    targetType: text("targetType"), // user, agreement, verification, etc.
    targetId: text("targetId"),
    details: jsonb("details").default(sql`'{}'::jsonb`),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    adminIdx: index("AdminAuditLog_adminId_idx").on(table.adminId),
  }),
)

export const lawFirms = pgTable(
  "LawFirm",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    email: text("email").notNull(),
    passwordHash: text("passwordHash"), // For firm portal login
    phone: text("phone"),
    status: text("status").notNull().default("onboarding"), // active | onboarding | suspended
    region: text("region").default("UK"),
    matters: integer("matters").default(0),
    practiceAreas: text("practiceAreas").array().default(sql`ARRAY[]::TEXT[]`),
    regions: text("regions").array().default(sql`ARRAY[]::TEXT[]`),
    interventionSlaMinutes: integer("interventionSlaMinutes").default(120),
    interventionTypes: text("interventionTypes").array().default(sql`ARRAY[]::TEXT[]`),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    // Enhanced marketplace fields
    description: text("description"),
    logo: text("logo"),
    website: text("website"),
    address: text("address"),
    city: text("city"),
    postcode: text("postcode"),
    country: text("country").default("UK"),
    verified: boolean("verified").default(false),
    verifiedAt: timestamp("verifiedAt", { withTimezone: false }),
    featured: boolean("featured").default(false),
    featuredUntil: timestamp("featuredUntil", { withTimezone: false }),
    totalCases: integer("totalCases").default(0),
    activeCases: integer("activeCases").default(0),
    completedCases: integer("completedCases").default(0),
    successRate: integer("successRate").default(0), // 0-100
    avgResponseTimeHours: integer("avgResponseTimeHours").default(0),
    totalRevenue: integer("totalRevenue").default(0), // in pence
    platformCommission: integer("platformCommission").default(0), // in pence
    userRating: integer("userRating").default(0), // 0-50 (multiply by 0.1 for 0-5.0 display)
    reviewCount: integer("reviewCount").default(0),
    // Subscription & billing
    subscriptionTier: text("subscriptionTier").default("basic"), // basic, premium, enterprise
    subscriptionStatus: text("subscriptionStatus").default("active"), // active, past_due, canceled, trialing
    stripeCustomerId: text("stripeCustomerId"),
    stripeAccountId: text("stripeAccountId"), // For Stripe Connect payouts
    subscriptionStartedAt: timestamp("subscriptionStartedAt", { withTimezone: false }),
    subscriptionEndsAt: timestamp("subscriptionEndsAt", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("LawFirm_email_idx").on(table.email),
    statusIdx: index("LawFirm_status_idx").on(table.status),
    verifiedIdx: index("LawFirm_verified_idx").on(table.verified),
    featuredIdx: index("LawFirm_featured_idx").on(table.featured),
  }),
)

export const lawFirmContacts = pgTable(
  "LawFirmContact",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    role: text("role"),
    priority: integer("priority").default(1),
    onCall: boolean("onCall").default(false),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    firmIdx: index("LawFirmContact_firm_idx").on(table.firmId),
    emailIdx: index("LawFirmContact_email_idx").on(table.email),
  }),
)

export const lawFirmInterventions = pgTable(
  "LawFirmIntervention",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    agreementId: text("agreementId"),
    triggeredBy: text("triggeredBy"),
    triggeredAt: timestamp("triggeredAt", { withTimezone: false }).defaultNow().notNull(),
    status: text("status").notNull().default("pending"), // pending, accepted, declined, escalated, closed
    notes: text("notes"),
    evidenceLinks: text("evidenceLinks").array().default(sql`ARRAY[]::TEXT[]`),
    assignedContactId: text("assignedContactId").references(() => lawFirmContacts.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    firmIdx: index("LawFirmIntervention_firm_idx").on(table.firmId),
    statusIdx: index("LawFirmIntervention_status_idx").on(table.status),
  }),
)

export const lawFirmAds = pgTable(
  "LawFirmAd",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    ctaText: text("ctaText"),
    ctaUrl: text("ctaUrl"),
    active: boolean("active").default(true),
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    firmIdx: index("LawFirmAd_firm_idx").on(table.firmId),
    activeIdx: index("LawFirmAd_active_idx").on(table.active),
  }),
)

export const lawFirmAssignments = pgTable(
  "LawFirmAssignment",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    scope: text("scope").default("legal_resolution"),
    active: boolean("active").default(true),
    // Enhanced assignment tracking
    status: text("status").default("pending"), // pending, accepted, in_progress, resolved, declined
    priority: text("priority").default("medium"), // low, medium, high, urgent
    assignedBy: text("assignedBy"),
    acceptedAt: timestamp("acceptedAt", { withTimezone: false }),
    completedAt: timestamp("completedAt", { withTimezone: false }),
    declinedAt: timestamp("declinedAt", { withTimezone: false }),
    declineReason: text("declineReason"),
    outcome: text("outcome"), // settled, won, lost, withdrawn
    agreedFee: integer("agreedFee").default(0), // in pence
    actualFee: integer("actualFee").default(0), // in pence
    platformCommissionRate: integer("platformCommissionRate").default(15), // percentage
    platformCommissionAmount: integer("platformCommissionAmount").default(0), // in pence
    // Payment tracking
    paymentIntentId: text("paymentIntentId"),
    paymentStatus: text("paymentStatus").default("unpaid"), // unpaid, pending, paid, failed, refunded
    paidAt: timestamp("paidAt", { withTimezone: false }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueAssignment: uniqueIndex("LawFirmAssignment_unique").on(table.firmId, table.agreementId, table.scope),
    firmIdx: index("LawFirmAssignment_firm_idx").on(table.firmId),
    agreementIdx: index("LawFirmAssignment_agreement_idx").on(table.agreementId),
    activeIdx: index("LawFirmAssignment_active_idx").on(table.active),
    statusIdx: index("LawFirmAssignment_status_idx").on(table.status),
    priorityIdx: index("LawFirmAssignment_priority_idx").on(table.priority),
  }),
)

// Law Firm Services - packages offered by firms
export const lawFirmServices = pgTable(
  "LawFirmService",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"), // consultation, mediation, litigation, document_review
    price: integer("price").notNull().default(0), // in pence
    currency: text("currency").default("GBP"),
    duration: text("duration"), // e.g., '1 hour', '2-3 weeks'
    active: boolean("active").default(true),
    featured: boolean("featured").default(false),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    firmIdx: index("LawFirmService_firmId_idx").on(table.firmId),
    activeIdx: index("LawFirmService_active_idx").on(table.active),
    categoryIdx: index("LawFirmService_category_idx").on(table.category),
  }),
)

// Law Firm Reviews - user feedback
export const lawFirmReviews = pgTable(
  "LawFirmReview",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    agreementId: text("agreementId").references(() => agreements.id, { onDelete: "set null", onUpdate: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    title: text("title"),
    comment: text("comment"),
    responseTime: integer("responseTime"), // hours
    professionalism: integer("professionalism"), // 1-5
    communication: integer("communication"), // 1-5
    valueForMoney: integer("valueForMoney"), // 1-5
    wouldRecommend: boolean("wouldRecommend"),
    verified: boolean("verified").default(false),
    helpful: integer("helpful").default(0),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    firmIdx: index("LawFirmReview_firmId_idx").on(table.firmId),
    userIdx: index("LawFirmReview_userId_idx").on(table.userId),
    ratingIdx: index("LawFirmReview_rating_idx").on(table.rating),
    verifiedIdx: index("LawFirmReview_verified_idx").on(table.verified),
  }),
)

// Law Firm Consultations - initial consultation requests
export const lawFirmConsultations = pgTable(
  "LawFirmConsultation",
  {
    id: text("id").primaryKey(),
    firmId: text("firmId")
      .notNull()
      .references(() => lawFirms.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    agreementId: text("agreementId").references(() => agreements.id, { onDelete: "set null", onUpdate: "cascade" }),
    serviceId: text("serviceId").references(() => lawFirmServices.id, { onDelete: "set null", onUpdate: "cascade" }),
    status: text("status").default("pending"), // pending, scheduled, completed, declined
    message: text("message"),
    preferredDate: timestamp("preferredDate", { withTimezone: false }),
    scheduledDate: timestamp("scheduledDate", { withTimezone: false }),
    completedAt: timestamp("completedAt", { withTimezone: false }),
    declinedAt: timestamp("declinedAt", { withTimezone: false }),
    declineReason: text("declineReason"),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    firmIdx: index("LawFirmConsultation_firmId_idx").on(table.firmId),
    userIdx: index("LawFirmConsultation_userId_idx").on(table.userId),
    statusIdx: index("LawFirmConsultation_status_idx").on(table.status),
  }),
)

// Agreement lifecycle states:
// - draft: Creator still editing, not sent
// - pending_signature: Sent to counterparty, awaiting signature  
// - active: Both parties signed, legally binding
// - completed: Agreement fulfilled
// - rejected: Counterparty rejected
// - cancelled: Creator withdrew before signature
export const agreements = pgTable(
  "Agreement",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    purpose: text("purpose"),
    keyTerms: text("keyTerms"),
    type: text("type").notNull(),
    status: text("status").notNull(),
    category: text("category"),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::TEXT[]`),
    priority: text("priority").default("medium"), // low, medium, high, urgent
    confidentialityLevel: text("confidentialityLevel").default("standard"), // public, standard, confidential, restricted
    isShared: boolean("isShared").notNull().default(false),
    isPublic: boolean("isPublic").notNull().default(false),
    isTemplate: boolean("isTemplate").notNull().default(false),
    parentAgreementId: text("parentAgreementId"), // For amendments/versions
    version: integer("version").notNull().default(1),
    language: text("language").default("en"),
    currency: text("currency").default("GBP"),
    timezone: text("timezone").default("Europe/London"),
    startDate: text("startDate"),
    deadline: text("deadline"),
    expiresAt: text("expiresAt"), // For pending_signature expiration
    reminderDays: integer("reminderDays").array().default(sql`ARRAY[7, 3, 1]::INTEGER[]`),
    autoRenewal: boolean("autoRenewal").default(false),
    renewalPeriod: integer("renewalPeriod"), // in days
    betStake: text("betStake"),
    betAmount: text("betAmount"),
    betOdds: text("betOdds"),
    betOpponentName: text("betOpponentName"),
    betOpponentEmail: text("betOpponentEmail"),
    betSettlementDate: text("betSettlementDate"),
    betTerms: text("betTerms"),
    notes: text("notes"),
    attachments: jsonb("attachments").default(sql`'[]'::jsonb`),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    legalIntentAccepted: boolean("legalIntentAccepted"),
    termsAcceptedVersion: text("termsAcceptedVersion"),
    jurisdictionClause: text("jurisdictionClause"),
    emailConfirmationSent: boolean("emailConfirmationSent"),
    emailConfirmationTimestamp: timestamp("emailConfirmationTimestamp", { withTimezone: false }),
    witnessRequired: boolean("witnessRequired"),
    witnessStatus: text("witnessStatus"),
    rejectionReason: text("rejectionReason"),
    rejectionType: text("rejectionType"), // 'hard' | 'soft'
    rejectedBy: text("rejectedBy"),
    rejectedAt: timestamp("rejectedAt", { withTimezone: false }),
    rejectionEvidence: jsonb("rejectionEvidence"),
    amendmentRequestedChanges: text("amendmentRequestedChanges"),
    
    // Lifecycle tracking for draft → signature flow
    sentForSignatureAt: timestamp("sentForSignatureAt", { withTimezone: false }),
    sentForSignatureBy: text("sentForSignatureBy"),
    cancelledAt: timestamp("cancelledAt", { withTimezone: false }),
    cancelledBy: text("cancelledBy"),
    cancellationReason: text("cancellationReason"),

    // Agreement locking and amendment workflow
    isLocked: boolean("isLocked").default(false), // Locked when sent for signature
    lockedAt: timestamp("lockedAt", { withTimezone: false }),
    lockedBy: text("lockedBy"),
    amendmentRequestedBy: text("amendmentRequestedBy"), // Who requested the amendment
    amendmentRequestedAt: timestamp("amendmentRequestedAt", { withTimezone: false }),
    amendmentReason: text("amendmentReason"), // Why amendment is needed
    amendmentProposedChanges: jsonb("amendmentProposedChanges"), // What changes are proposed
    amendmentProposedBy: text("amendmentProposedBy"), // Who proposed the amendment
    amendmentStatus: text("amendmentStatus"), // pending, approved, rejected
    amendmentRespondedBy: text("amendmentRespondedBy"), // Who approved/rejected
    amendmentRespondedAt: timestamp("amendmentRespondedAt", { withTimezone: false }),
    amendmentResponse: text("amendmentResponse"), // Response message
    
    // E-signature evidentiary fields
    explicitIntent: boolean("explicitIntent").default(false),
    electronicConsentGiven: boolean("electronicConsentGiven").default(false),
    contentHashAtSignature: text("contentHashAtSignature"),
    otpVerified: boolean("otpVerified").default(false),
    otpSentAt: timestamp("otpSentAt", { withTimezone: false }),
    otpVerifiedAt: timestamp("otpVerifiedAt", { withTimezone: false }),
    
    // Existing dispute fields
    disputeReason: text("disputeReason"),
    disputedBy: text("disputedBy"),
    disputedAt: timestamp("disputedAt", { withTimezone: false }),
    disputeEvidence: jsonb("disputeEvidence"),
    disputeHistory: jsonb("disputeHistory"), // Array of dispute iterations
    disputePhase: text("disputePhase"), // open, conditional_offer, counter_offer, resolved, deadlock
    disputeRejectionAttempts: integer("disputeRejectionAttempts").default(0),
    iterationNumber: integer("iterationNumber").default(0),
    completionRequestedBy: text("completionRequestedBy"),
    completionRequestedAt: timestamp("completionRequestedAt", { withTimezone: false }),
    proposalBy: text("proposalBy"),
    proposalTerms: text("proposalTerms"),
    hasProposedResolution: boolean("hasProposedResolution").default(false),
    breachReportedBy: text("breachReportedBy"), // Who reported the breach
    proposalEvidence: jsonb("proposalEvidence"),
    proposalAt: timestamp("proposalAt", { withTimezone: false }),
    counterProposalBy: text("counterProposalBy"),
    counterProposalTerms: text("counterProposalTerms"),
    counterProposalAt: timestamp("counterProposalAt", { withTimezone: false }),
    refusalBy: text("refusalBy"),
    refusalReason: text("refusalReason"),
    refusalAt: timestamp("refusalAt", { withTimezone: false }),
    resolutionType: text("resolutionType"), // conditional_acceptance, etc.
    resolvedAt: timestamp("resolvedAt", { withTimezone: false }),
    legalResolutionTriggered: boolean("legalResolutionTriggered").default(false),
    legalResolutionTriggeredBy: text("legalResolutionTriggeredBy"),
    legalResolutionTriggeredAt: timestamp("legalResolutionTriggeredAt", { withTimezone: false }),
    friendlyArrangementProposed: boolean("friendlyArrangementProposed").default(false),
    friendlyArrangementProposedBy: text("friendlyArrangementProposedBy"),
    friendlyArrangementProposedAt: timestamp("friendlyArrangementProposedAt", { withTimezone: false }),
    friendlyArrangementTerms: text("friendlyArrangementTerms"),
    friendlyArrangementAccepted: boolean("friendlyArrangementAccepted").default(false),
    friendlyArrangementAcceptedBy: text("friendlyArrangementAcceptedBy"),
    friendlyArrangementAcceptedAt: timestamp("friendlyArrangementAcceptedAt", { withTimezone: false }),
    friendlyArrangementResponse: text("friendlyArrangementResponse"), // "accepted", "conditional", "rejected"
    friendlyArrangementResponseBy: text("friendlyArrangementResponseBy"),
    friendlyArrangementResponseAt: timestamp("friendlyArrangementResponseAt", { withTimezone: false }),
    friendlyArrangementConditions: text("friendlyArrangementConditions"),
    friendlyArrangementNegotiationRound: integer("friendlyArrangementNegotiationRound").default(1),
    friendlyArrangementFinalTerms: text("friendlyArrangementFinalTerms"),
    legalCaseNumber: text("legalCaseNumber"),
    legalNotificationsSent: boolean("legalNotificationsSent").default(false),
    completedBy: text("completedBy"),
    completedAt: timestamp("completedAt", { withTimezone: false }),
    effectiveDate: text("effectiveDate").notNull().default(""),
    endDate: text("endDate"),
    isPermanent: boolean("isPermanent").notNull().default(false),
    targetDate: text("targetDate"),
    recurrenceFrequency: text("recurrenceFrequency"),
    lastViewedAt: timestamp("lastViewedAt", { withTimezone: false }),
    viewCount: integer("viewCount").default(0),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
    templateId: text("templateId"),
    templateValues: jsonb("templateValues").default(sql`'{}'::jsonb`),
  },
)

export const supportMessages = pgTable(
  "SupportMessage",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    partnerId: text("partnerId"),
    partnerName: text("partnerName").notNull(),
    message: text("message").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: false }).defaultNow().notNull(),
    userId: text("userId").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
  },
  (table) => ({
    agreementIdx: index("SupportMessage_agreementId_idx").on(table.agreementId),
    partnerIdx: index("SupportMessage_partnerId_idx").on(table.partnerId),
  }),
)

export const legalSignatures = pgTable(
  "LegalSignature",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    signedBy: text("signedBy").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    signedByEmail: text("signedByEmail").notNull(),
    signedByName: text("signedByName").notNull(),
    signatureData: text("signatureData").notNull(),
    role: text("role").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: false }).defaultNow().notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    location: text("location"),
  },
)

export const notifications = pgTable(
  "Notification",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text("type").notNull(),
    priority: text("priority").default("normal"),
    category: text("category").default("update"),
    requiresAction: boolean("requiresAction").default(false),
    handledAt: timestamp("handledAt", { withTimezone: false }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    agreementId: text("agreementId"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("Notification_userId_idx").on(table.userId),
    createdIdx: index("Notification_createdAt_idx").on(table.createdAt),
    readIdx: index("Notification_read_idx").on(table.read),
  }),
)

export const sharedParticipants = pgTable(
  "SharedParticipant",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: text("role").default("counterparty"),
    userId: text("userId"),
    userName: text("userName").notNull(),
    userEmail: text("userEmail").notNull(),
    joinedAt: timestamp("joinedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("SharedParticipant_agreementId_idx").on(table.agreementId),
    emailIdx: index("SharedParticipant_userEmail_idx").on(table.userEmail),
  }),
)

export const completions = pgTable(
  "Completion",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    date: text("date").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow(),
  },
  (table) => ({
    agreementIdx: index("Completion_agreementId_idx").on(table.agreementId),
  }),
)

export const participantCompletions = pgTable(
  "ParticipantCompletion",
  {
    id: text("id").primaryKey(),
    participantId: text("participantId")
      .notNull()
      .references(() => sharedParticipants.id, { onDelete: "cascade", onUpdate: "cascade" }),
    date: text("date").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow(),
  },
  (table) => ({
    participantIdx: index("ParticipantCompletion_participantId_idx").on(table.participantId),
  }),
)

export const agreementPartners = pgTable(
  "AgreementPartner",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    addedAt: timestamp("addedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("AgreementPartner_agreementId_idx").on(table.agreementId),
  }),
)

export const auditLogs = pgTable(
  "AuditLog",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    action: text("action").notNull(),
    performedBy: text("performedBy"),
    performedByEmail: text("performedByEmail"),
    details: text("details").notNull(),
    ipAddress: text("ipAddress"),
    timestamp: timestamp("timestamp", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("AuditLog_agreementId_idx").on(table.agreementId),
    performedByIdx: index("AuditLog_performedBy_idx").on(table.performedBy),
  }),
)

export const agreementVersions = pgTable(
  "AgreementVersion",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    changes: jsonb("changes"), // What changed from previous version
    createdBy: text("createdBy")
      .references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementVersionIdx: index("AgreementVersion_agreementId_version_idx").on(table.agreementId, table.version),
  }),
)

export const agreementComments = pgTable(
  "AgreementComment",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    content: text("content").notNull(),
    section: text("section"), // Which section/clause the comment refers to
    isResolved: boolean("isResolved").default(false),
    parentCommentId: text("parentCommentId"), // For threaded comments
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("AgreementComment_agreementId_idx").on(table.agreementId),
    userIdx: index("AgreementComment_userId_idx").on(table.userId),
  }),
)

export const agreementReminders = pgTable(
  "AgreementReminder",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text("type").notNull(), // deadline, renewal, milestone, custom
    title: text("title").notNull(),
    description: text("description"),
    reminderDate: timestamp("reminderDate", { withTimezone: false }).notNull(),
    isRecurring: boolean("isRecurring").default(false),
    recurringInterval: text("recurringInterval"), // daily, weekly, monthly, yearly
    isSent: boolean("isSent").default(false),
    sentAt: timestamp("sentAt", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("AgreementReminder_agreementId_idx").on(table.agreementId),
    reminderDateIdx: index("AgreementReminder_reminderDate_idx").on(table.reminderDate),
  }),
)

export const agreementAnalytics = pgTable(
  "AgreementAnalytics",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    event: text("event").notNull(), // viewed, signed, completed, disputed, etc.
    userId: text("userId")
      .references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    timestamp: timestamp("timestamp", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("AgreementAnalytics_agreementId_idx").on(table.agreementId),
    eventIdx: index("AgreementAnalytics_event_idx").on(table.event),
    timestampIdx: index("AgreementAnalytics_timestamp_idx").on(table.timestamp),
  }),
)

export const agreementChats = pgTable(
  "AgreementChat",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreementId")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade", onUpdate: "cascade" }),
    isActive: boolean("isActive").notNull().default(true),
    lastMessageAt: timestamp("lastMessageAt", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: uniqueIndex("AgreementChat_agreementId_key").on(table.agreementId),
  }),
)

export const chatMessages = pgTable(
  "ChatMessage",
  {
    id: text("id").primaryKey(),
    chatId: text("chatId")
      .notNull()
      .references(() => agreementChats.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    content: text("content").notNull(),
    type: text("type").notNull().default("text"), // text, file, system
    attachments: jsonb("attachments").default(sql`'[]'::jsonb`),
    replyToId: text("replyToId"), // For threaded replies
    isEdited: boolean("isEdited").default(false),
    editedAt: timestamp("editedAt", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    chatIdx: index("ChatMessage_chatId_idx").on(table.chatId),
    createdIdx: index("ChatMessage_createdAt_idx").on(table.createdAt),
  }),
)

export const chatParticipants = pgTable(
  "ChatParticipant",
  {
    id: text("id").primaryKey(),
    chatId: text("chatId")
      .notNull()
      .references(() => agreementChats.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    lastReadAt: timestamp("lastReadAt", { withTimezone: false }),
    isTyping: boolean("isTyping").default(false),
    typingAt: timestamp("typingAt", { withTimezone: false }),
    joinedAt: timestamp("joinedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    chatUserIdx: uniqueIndex("ChatParticipant_chatId_userId_key").on(table.chatId, table.userId),
  }),
)

export const userPreferences = pgTable(
  "UserPreferences",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    theme: text("theme").default("light"), // light, dark, auto
    language: text("language").default("en"),
    timezone: text("timezone").default("Europe/London"),
    currency: text("currency").default("GBP"),
    emailNotifications: boolean("emailNotifications").default(true),
    smsNotifications: boolean("smsNotifications").default(false),
    pushNotifications: boolean("pushNotifications").default(true),
    agreementNotificationSettings: jsonb("agreementNotificationSettings").default(
      sql`'{
        "creation": true,
        "sentForSignature": true,
        "complete": true,
        "update": true,
        "withdrawal": true,
        "deletion": true,
        "witnessSignature": true,
        "counterpartySignature": true,
        "requestCompletion": true,
        "rejectCompletion": true,
        "disputeRejection": true,
        "legalResolution": true
      }'::jsonb`,
    ),
    reminderSettings: jsonb("reminderSettings").default(sql`'{"deadlines": true, "renewals": true, "milestones": false}'::jsonb`),
    dashboardLayout: jsonb("dashboardLayout").default(sql`'{}'::jsonb`),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("UserPreferences_userId_key").on(table.userId),
  }),
)

export const emailVerificationTokens = pgTable(
  "EmailVerificationToken",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    token: text("token").notNull(),
    email: text("email").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
    used: boolean("used").notNull().default(false),
    usedAt: timestamp("usedAt", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("EmailVerificationToken_token_key").on(table.token),
    userIdx: index("EmailVerificationToken_userId_idx").on(table.userId),
  }),
)

export const passwordResetTokens = pgTable(
  "PasswordResetToken",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    token: text("token").notNull(),
    email: text("email").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
    used: boolean("used").notNull().default(false),
    usedAt: timestamp("usedAt", { withTimezone: false }),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("PasswordResetToken_token_key").on(table.token),
    userIdx: index("PasswordResetToken_userId_idx").on(table.userId),
    expiresIdx: index("PasswordResetToken_expiresAt_idx").on(table.expiresAt),
  }),
)

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  agreements: many(agreements),
  legalSignatures: many(legalSignatures),
  notifications: many(notifications),
  preferences: one(userPreferences),
  comments: many(agreementComments),
  reminders: many(agreementReminders),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
}))

export const agreementsRelations = relations(agreements, ({ one, many }) => ({
  user: one(users, { fields: [agreements.userId], references: [users.id] }),
  completions: many(completions),
  sharedWith: many(sharedParticipants),
  partners: many(agreementPartners),
  supportMessages: many(supportMessages),
  legalSignatures: many(legalSignatures),
  auditLogs: many(auditLogs),
  versions: many(agreementVersions),
  comments: many(agreementComments),
  reminders: many(agreementReminders),
  analytics: many(agreementAnalytics),
  chat: one(agreementChats),
}))

export const completionsRelations = relations(completions, ({ one }) => ({
  agreement: one(agreements, { fields: [completions.agreementId], references: [agreements.id] }),
}))

export const sharedParticipantsRelations = relations(sharedParticipants, ({ one, many }) => ({
  agreement: one(agreements, { fields: [sharedParticipants.agreementId], references: [agreements.id] }),
  completions: many(participantCompletions),
}))

export const participantCompletionsRelations = relations(participantCompletions, ({ one }) => ({
  participant: one(sharedParticipants, {
    fields: [participantCompletions.participantId],
    references: [sharedParticipants.id],
  }),
}))

export const legalSignaturesRelations = relations(legalSignatures, ({ one }) => ({
  agreement: one(agreements, { fields: [legalSignatures.agreementId], references: [agreements.id] }),
  user: one(users, { fields: [legalSignatures.signedBy], references: [users.id] }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  agreement: one(agreements, { fields: [auditLogs.agreementId], references: [agreements.id] }),
}))

export const agreementPartnersRelations = relations(agreementPartners, ({ one }) => ({
  agreement: one(agreements, { fields: [agreementPartners.agreementId], references: [agreements.id] }),
}))

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  agreement: one(agreements, { fields: [supportMessages.agreementId], references: [agreements.id] }),
  user: one(users, { fields: [supportMessages.userId], references: [users.id] }),
}))

export const agreementChatsRelations = relations(agreementChats, ({ one, many }) => ({
  agreement: one(agreements, { fields: [agreementChats.agreementId], references: [agreements.id] }),
  messages: many(chatMessages),
  participants: many(chatParticipants),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(agreementChats, { fields: [chatMessages.chatId], references: [agreementChats.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}))

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(agreementChats, { fields: [chatParticipants.chatId], references: [agreementChats.id] }),
  user: one(users, { fields: [chatParticipants.userId], references: [users.id] }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}))

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}))

// Referral System
export const referrals = pgTable(
  "Referral",
  {
    id: text("id").primaryKey(),
    referrerId: text("referrerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    refereeId: text("refereeId").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    referralCode: text("referralCode").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending, completed, rewarded
    rewardType: text("rewardType"), // premium_month, discount_25, discount_50, lifetime_free
    rewardedAt: timestamp("rewardedAt", { withTimezone: false }),
    clickCount: integer("clickCount").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    referrerIdx: index("Referral_referrerId_idx").on(table.referrerId),
    refereeIdx: index("Referral_refereeId_idx").on(table.refereeId),
    codeIdx: uniqueIndex("Referral_referralCode_idx").on(table.referralCode),
  }),
)

export const referralRewards = pgTable(
  "ReferralReward",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    referralId: text("referralId")
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade", onUpdate: "cascade" }),
    rewardType: text("rewardType").notNull(), // premium_month, discount_25, discount_50, lifetime_free
    status: text("status").notNull().default("pending"), // pending, active, expired, used
    expiresAt: timestamp("expiresAt", { withTimezone: false }),
    appliedAt: timestamp("appliedAt", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("ReferralReward_userId_idx").on(table.userId),
    referralIdx: index("ReferralReward_referralId_idx").on(table.referralId),
  }),
)

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  referrer: one(users, { fields: [referrals.referrerId], references: [users.id], relationName: "referrer" }),
  referee: one(users, { fields: [referrals.refereeId], references: [users.id], relationName: "referee" }),
  rewards: many(referralRewards),
}))

export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  user: one(users, { fields: [referralRewards.userId], references: [users.id] }),
  referral: one(referrals, { fields: [referralRewards.referralId], references: [referrals.id] }),
}))

export const usersReferralsRelations = relations(users, ({ many }) => ({
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referee" }),
  referralRewards: many(referralRewards),
}))

// Gamification tables
export const userBadges = pgTable(
  "UserBadge",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badgeId").notNull(),
    unlockedAt: timestamp("unlockedAt", { withTimezone: false }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("UserBadge_userId_idx").on(table.userId),
    badgeIdx: index("UserBadge_badgeId_idx").on(table.badgeId),
    userBadgeIdx: uniqueIndex("UserBadge_userId_badgeId_idx").on(table.userId, table.badgeId),
  }),
)

export const userStats = pgTable(
  "UserStats",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    loginStreak: integer("loginStreak").notNull().default(0),
    lastLoginAt: timestamp("lastLoginAt", { withTimezone: false }),
    certificatesShared: integer("certificatesShared").notNull().default(0),
    totalAgreements: integer("totalAgreements").notNull().default(0),
    totalReferrals: integer("totalReferrals").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("UserStats_userId_idx").on(table.userId),
  }),
)

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, { fields: [userStats.userId], references: [users.id] }),
}))

export const usersGamificationRelations = relations(users, ({ many, one }) => ({
  badges: many(userBadges),
  stats: one(userStats),
}))

// Action Permissions Configuration
// Stores which actions are enabled for each agreement status and role
export const actionPermissions = pgTable(
  "ActionPermission",
  {
    id: text("id").primaryKey(),
    role: text("role").notNull(), // 'creator' or 'counterparty'
    status: text("status").notNull(), // Agreement status
    action: text("action").notNull(), // Action name (e.g., 'canSign', 'canDelete')
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    roleStatusActionIdx: uniqueIndex("ActionPermission_role_status_action_idx").on(
      table.role,
      table.status,
      table.action
    ),
  })
)