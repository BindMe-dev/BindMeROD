CREATE TABLE "AdminAuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"action" text NOT NULL,
	"targetType" text,
	"targetId" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Admin" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgreementAnalytics" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"event" text NOT NULL,
	"userId" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ipAddress" text,
	"userAgent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgreementChat" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastMessageAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgreementComment" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"section" text,
	"isResolved" boolean DEFAULT false,
	"parentCommentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgreementPartner" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgreementReminder" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reminderDate" timestamp NOT NULL,
	"isRecurring" boolean DEFAULT false,
	"recurringInterval" text,
	"isSent" boolean DEFAULT false,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgreementVersion" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"changes" jsonb,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Agreement" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"purpose" text,
	"keyTerms" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"category" text,
	"tags" text[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
	"priority" text DEFAULT 'medium',
	"confidentialityLevel" text DEFAULT 'standard',
	"isShared" boolean DEFAULT false NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"isTemplate" boolean DEFAULT false NOT NULL,
	"parentAgreementId" text,
	"version" integer DEFAULT 1 NOT NULL,
	"language" text DEFAULT 'en',
	"currency" text DEFAULT 'GBP',
	"timezone" text DEFAULT 'Europe/London',
	"startDate" text,
	"deadline" text,
	"reminderDays" integer[] DEFAULT ARRAY[7, 3, 1]::INTEGER[],
	"autoRenewal" boolean DEFAULT false,
	"renewalPeriod" integer,
	"betStake" text,
	"betAmount" text,
	"betOdds" text,
	"betOpponentName" text,
	"betOpponentEmail" text,
	"betSettlementDate" text,
	"betTerms" text,
	"notes" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"legalIntentAccepted" boolean,
	"termsAcceptedVersion" text,
	"jurisdictionClause" text,
	"emailConfirmationSent" boolean,
	"emailConfirmationTimestamp" timestamp,
	"witnessRequired" boolean,
	"witnessStatus" text,
	"rejectionReason" text,
	"rejectionType" text,
	"rejectedBy" text,
	"rejectedAt" timestamp,
	"rejectionEvidence" jsonb,
	"amendmentRequestedChanges" text,
	"sentForSignatureAt" timestamp,
	"sentForSignatureBy" text,
	"cancelledAt" timestamp,
	"cancelledBy" text,
	"cancellationReason" text,
	"isLocked" boolean DEFAULT false,
	"lockedAt" timestamp,
	"lockedBy" text,
	"amendmentRequestedBy" text,
	"amendmentRequestedAt" timestamp,
	"amendmentReason" text,
	"amendmentProposedChanges" jsonb,
	"amendmentStatus" text,
	"amendmentRespondedBy" text,
	"amendmentRespondedAt" timestamp,
	"amendmentResponse" text,
	"explicitIntent" boolean DEFAULT false,
	"electronicConsentGiven" boolean DEFAULT false,
	"contentHashAtSignature" text,
	"otpVerified" boolean DEFAULT false,
	"otpSentAt" timestamp,
	"otpVerifiedAt" timestamp,
	"disputeReason" text,
	"disputedBy" text,
	"disputedAt" timestamp,
	"disputeEvidence" jsonb,
	"disputePhase" text,
	"iterationNumber" integer DEFAULT 0,
	"completionRequestedBy" text,
	"completionRequestedAt" timestamp,
	"proposalBy" text,
	"proposalTerms" text,
	"proposalEvidence" jsonb,
	"proposalAt" timestamp,
	"counterProposalBy" text,
	"counterProposalTerms" text,
	"counterProposalAt" timestamp,
	"refusalBy" text,
	"refusalReason" text,
	"refusalAt" timestamp,
	"resolutionType" text,
	"resolvedAt" timestamp,
	"legalResolutionTriggered" boolean DEFAULT false,
	"legalResolutionTriggeredBy" text,
	"legalResolutionTriggeredAt" timestamp,
	"friendlyArrangementProposed" boolean DEFAULT false,
	"friendlyArrangementProposedBy" text,
	"friendlyArrangementProposedAt" timestamp,
	"friendlyArrangementTerms" text,
	"friendlyArrangementAccepted" boolean DEFAULT false,
	"friendlyArrangementAcceptedBy" text,
	"friendlyArrangementAcceptedAt" timestamp,
	"friendlyArrangementResponse" text,
	"friendlyArrangementResponseBy" text,
	"friendlyArrangementResponseAt" timestamp,
	"friendlyArrangementConditions" text,
	"friendlyArrangementNegotiationRound" integer DEFAULT 1,
	"friendlyArrangementFinalTerms" text,
	"legalCaseNumber" text,
	"legalNotificationsSent" boolean DEFAULT false,
	"completedBy" text,
	"completedAt" timestamp,
	"effectiveDate" text DEFAULT '' NOT NULL,
	"endDate" text,
	"isPermanent" boolean DEFAULT false NOT NULL,
	"targetDate" text,
	"recurrenceFrequency" text,
	"lastViewedAt" timestamp,
	"viewCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"templateId" text,
	"templateValues" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"action" text NOT NULL,
	"performedBy" text,
	"performedByEmail" text,
	"details" text NOT NULL,
	"ipAddress" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"replyToId" text,
	"isEdited" boolean DEFAULT false,
	"editedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatParticipant" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"userId" text NOT NULL,
	"lastReadAt" timestamp,
	"isTyping" boolean DEFAULT false,
	"typingAt" timestamp,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Completion" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"date" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "EmailVerificationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmAd" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"ctaText" text,
	"ctaUrl" text,
	"active" boolean DEFAULT true,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmAssignment" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"agreementId" text NOT NULL,
	"scope" text DEFAULT 'legal_resolution',
	"active" boolean DEFAULT true,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"assignedBy" text,
	"acceptedAt" timestamp,
	"completedAt" timestamp,
	"declinedAt" timestamp,
	"declineReason" text,
	"outcome" text,
	"agreedFee" integer DEFAULT 0,
	"actualFee" integer DEFAULT 0,
	"platformCommissionRate" integer DEFAULT 15,
	"platformCommissionAmount" integer DEFAULT 0,
	"paymentIntentId" text,
	"paymentStatus" text DEFAULT 'unpaid',
	"paidAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmConsultation" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"userId" text NOT NULL,
	"agreementId" text,
	"serviceId" text,
	"status" text DEFAULT 'pending',
	"message" text,
	"preferredDate" timestamp,
	"scheduledDate" timestamp,
	"completedAt" timestamp,
	"declinedAt" timestamp,
	"declineReason" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmContact" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text,
	"priority" integer DEFAULT 1,
	"onCall" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmIntervention" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"agreementId" text,
	"triggeredBy" text,
	"triggeredAt" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"evidenceLinks" text[] DEFAULT ARRAY[]::TEXT[],
	"assignedContactId" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmReview" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"userId" text NOT NULL,
	"agreementId" text,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"responseTime" integer,
	"professionalism" integer,
	"communication" integer,
	"valueForMoney" integer,
	"wouldRecommend" boolean,
	"verified" boolean DEFAULT false,
	"helpful" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirmService" (
	"id" text PRIMARY KEY NOT NULL,
	"firmId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'GBP',
	"duration" text,
	"active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LawFirm" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text,
	"phone" text,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"region" text DEFAULT 'UK',
	"matters" integer DEFAULT 0,
	"practiceAreas" text[] DEFAULT ARRAY[]::TEXT[],
	"regions" text[] DEFAULT ARRAY[]::TEXT[],
	"interventionSlaMinutes" integer DEFAULT 120,
	"interventionTypes" text[] DEFAULT ARRAY[]::TEXT[],
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"description" text,
	"logo" text,
	"website" text,
	"address" text,
	"city" text,
	"postcode" text,
	"country" text DEFAULT 'UK',
	"verified" boolean DEFAULT false,
	"verifiedAt" timestamp,
	"featured" boolean DEFAULT false,
	"featuredUntil" timestamp,
	"totalCases" integer DEFAULT 0,
	"activeCases" integer DEFAULT 0,
	"completedCases" integer DEFAULT 0,
	"successRate" integer DEFAULT 0,
	"avgResponseTimeHours" integer DEFAULT 0,
	"totalRevenue" integer DEFAULT 0,
	"platformCommission" integer DEFAULT 0,
	"userRating" integer DEFAULT 0,
	"reviewCount" integer DEFAULT 0,
	"subscriptionTier" text DEFAULT 'basic',
	"subscriptionStatus" text DEFAULT 'active',
	"stripeCustomerId" text,
	"stripeAccountId" text,
	"subscriptionStartedAt" timestamp,
	"subscriptionEndsAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LegalSignature" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"signedBy" text,
	"signedByEmail" text NOT NULL,
	"signedByName" text NOT NULL,
	"signatureData" text NOT NULL,
	"role" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"category" text DEFAULT 'update',
	"requiresAction" boolean DEFAULT false,
	"handledAt" timestamp,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"agreementId" text,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ParticipantCompletion" (
	"id" text PRIMARY KEY NOT NULL,
	"participantId" text NOT NULL,
	"date" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "PasswordResetToken" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"usedAt" timestamp,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ReferralReward" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"referralId" text NOT NULL,
	"rewardType" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp,
	"appliedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Referral" (
	"id" text PRIMARY KEY NOT NULL,
	"referrerId" text NOT NULL,
	"refereeId" text,
	"referralCode" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rewardType" text,
	"rewardedAt" timestamp,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Referral_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "SharedParticipant" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"role" text DEFAULT 'counterparty',
	"userId" text,
	"userName" text NOT NULL,
	"userEmail" text NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SupportMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"partnerId" text,
	"partnerName" text NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "UserBadge" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"badgeId" text NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserPreferences" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"theme" text DEFAULT 'light',
	"language" text DEFAULT 'en',
	"timezone" text DEFAULT 'Europe/London',
	"currency" text DEFAULT 'GBP',
	"emailNotifications" boolean DEFAULT true,
	"smsNotifications" boolean DEFAULT false,
	"pushNotifications" boolean DEFAULT true,
	"agreementNotificationSettings" jsonb DEFAULT '{
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
      }'::jsonb,
	"reminderSettings" jsonb DEFAULT '{"deadlines": true, "renewals": true, "milestones": false}'::jsonb,
	"dashboardLayout" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserStats" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"loginStreak" integer DEFAULT 0 NOT NULL,
	"lastLoginAt" timestamp,
	"certificatesShared" integer DEFAULT 0 NOT NULL,
	"totalAgreements" integer DEFAULT 0 NOT NULL,
	"totalReferrals" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserStats_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"name" text NOT NULL,
	"dateOfBirth" text NOT NULL,
	"ipAddress" text,
	"publicProfile" jsonb,
	"agreementCount" integer DEFAULT 0 NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verifiedAt" timestamp,
	"verificationType" text,
	"verifiedName" text,
	"verifiedAddress" text,
	"verifiedDob" text,
	"documentReference" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VerificationSubmission" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"documentUrl" text,
	"selfieUrl" text,
	"extractedName" text,
	"extractedDob" text,
	"extractedDocNumber" text,
	"extractedDocType" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewerId" text,
	"reviewNotes" text,
	"rejectionReason" text,
	"verificationType" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_Admin_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementAnalytics" ADD CONSTRAINT "AgreementAnalytics_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementAnalytics" ADD CONSTRAINT "AgreementAnalytics_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementChat" ADD CONSTRAINT "AgreementChat_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementComment" ADD CONSTRAINT "AgreementComment_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementComment" ADD CONSTRAINT "AgreementComment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementPartner" ADD CONSTRAINT "AgreementPartner_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementReminder" ADD CONSTRAINT "AgreementReminder_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementReminder" ADD CONSTRAINT "AgreementReminder_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementVersion" ADD CONSTRAINT "AgreementVersion_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementVersion" ADD CONSTRAINT "AgreementVersion_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_AgreementChat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."AgreementChat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_AgreementChat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."AgreementChat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmAd" ADD CONSTRAINT "LawFirmAd_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmAssignment" ADD CONSTRAINT "LawFirmAssignment_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmAssignment" ADD CONSTRAINT "LawFirmAssignment_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmConsultation" ADD CONSTRAINT "LawFirmConsultation_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmConsultation" ADD CONSTRAINT "LawFirmConsultation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmConsultation" ADD CONSTRAINT "LawFirmConsultation_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmConsultation" ADD CONSTRAINT "LawFirmConsultation_serviceId_LawFirmService_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."LawFirmService"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmContact" ADD CONSTRAINT "LawFirmContact_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmIntervention" ADD CONSTRAINT "LawFirmIntervention_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmIntervention" ADD CONSTRAINT "LawFirmIntervention_assignedContactId_LawFirmContact_id_fk" FOREIGN KEY ("assignedContactId") REFERENCES "public"."LawFirmContact"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmReview" ADD CONSTRAINT "LawFirmReview_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmReview" ADD CONSTRAINT "LawFirmReview_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmReview" ADD CONSTRAINT "LawFirmReview_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LawFirmService" ADD CONSTRAINT "LawFirmService_firmId_LawFirm_id_fk" FOREIGN KEY ("firmId") REFERENCES "public"."LawFirm"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LegalSignature" ADD CONSTRAINT "LegalSignature_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LegalSignature" ADD CONSTRAINT "LegalSignature_signedBy_User_id_fk" FOREIGN KEY ("signedBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ParticipantCompletion" ADD CONSTRAINT "ParticipantCompletion_participantId_SharedParticipant_id_fk" FOREIGN KEY ("participantId") REFERENCES "public"."SharedParticipant"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_Referral_id_fk" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_User_id_fk" FOREIGN KEY ("refereeId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SharedParticipant" ADD CONSTRAINT "SharedParticipant_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_agreementId_Agreement_id_fk" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_reviewerId_User_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog" USING btree ("adminId");--> statement-breakpoint
CREATE UNIQUE INDEX "Admin_userId_idx" ON "Admin" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AgreementAnalytics_agreementId_idx" ON "AgreementAnalytics" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "AgreementAnalytics_event_idx" ON "AgreementAnalytics" USING btree ("event");--> statement-breakpoint
CREATE INDEX "AgreementAnalytics_timestamp_idx" ON "AgreementAnalytics" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "AgreementChat_agreementId_key" ON "AgreementChat" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "AgreementComment_agreementId_idx" ON "AgreementComment" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "AgreementComment_userId_idx" ON "AgreementComment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AgreementPartner_agreementId_idx" ON "AgreementPartner" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "AgreementReminder_agreementId_idx" ON "AgreementReminder" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "AgreementReminder_reminderDate_idx" ON "AgreementReminder" USING btree ("reminderDate");--> statement-breakpoint
CREATE INDEX "AgreementVersion_agreementId_version_idx" ON "AgreementVersion" USING btree ("agreementId","version");--> statement-breakpoint
CREATE INDEX "AuditLog_agreementId_idx" ON "AuditLog" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog" USING btree ("performedBy");--> statement-breakpoint
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "ChatParticipant" USING btree ("chatId","userId");--> statement-breakpoint
CREATE INDEX "Completion_agreementId_idx" ON "Completion" USING btree ("agreementId");--> statement-breakpoint
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken" USING btree ("token");--> statement-breakpoint
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "LawFirmAd_firm_idx" ON "LawFirmAd" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmAd_active_idx" ON "LawFirmAd" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "LawFirmAssignment_unique" ON "LawFirmAssignment" USING btree ("firmId","agreementId","scope");--> statement-breakpoint
CREATE INDEX "LawFirmAssignment_firm_idx" ON "LawFirmAssignment" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmAssignment_agreement_idx" ON "LawFirmAssignment" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "LawFirmAssignment_active_idx" ON "LawFirmAssignment" USING btree ("active");--> statement-breakpoint
CREATE INDEX "LawFirmAssignment_status_idx" ON "LawFirmAssignment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "LawFirmAssignment_priority_idx" ON "LawFirmAssignment" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "LawFirmConsultation_firmId_idx" ON "LawFirmConsultation" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmConsultation_userId_idx" ON "LawFirmConsultation" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "LawFirmConsultation_status_idx" ON "LawFirmConsultation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "LawFirmContact_firm_idx" ON "LawFirmContact" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmContact_email_idx" ON "LawFirmContact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "LawFirmIntervention_firm_idx" ON "LawFirmIntervention" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmIntervention_status_idx" ON "LawFirmIntervention" USING btree ("status");--> statement-breakpoint
CREATE INDEX "LawFirmReview_firmId_idx" ON "LawFirmReview" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmReview_userId_idx" ON "LawFirmReview" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "LawFirmReview_rating_idx" ON "LawFirmReview" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "LawFirmReview_verified_idx" ON "LawFirmReview" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "LawFirmService_firmId_idx" ON "LawFirmService" USING btree ("firmId");--> statement-breakpoint
CREATE INDEX "LawFirmService_active_idx" ON "LawFirmService" USING btree ("active");--> statement-breakpoint
CREATE INDEX "LawFirmService_category_idx" ON "LawFirmService" USING btree ("category");--> statement-breakpoint
CREATE INDEX "LawFirm_email_idx" ON "LawFirm" USING btree ("email");--> statement-breakpoint
CREATE INDEX "LawFirm_status_idx" ON "LawFirm" USING btree ("status");--> statement-breakpoint
CREATE INDEX "LawFirm_verified_idx" ON "LawFirm" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "LawFirm_featured_idx" ON "LawFirm" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "Notification_userId_idx" ON "Notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Notification_read_idx" ON "Notification" USING btree ("read");--> statement-breakpoint
CREATE INDEX "ParticipantCompletion_participantId_idx" ON "ParticipantCompletion" USING btree ("participantId");--> statement-breakpoint
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken" USING btree ("token");--> statement-breakpoint
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ReferralReward_referralId_idx" ON "ReferralReward" USING btree ("referralId");--> statement-breakpoint
CREATE INDEX "Referral_referrerId_idx" ON "Referral" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "Referral_refereeId_idx" ON "Referral" USING btree ("refereeId");--> statement-breakpoint
CREATE UNIQUE INDEX "Referral_referralCode_idx" ON "Referral" USING btree ("referralCode");--> statement-breakpoint
CREATE INDEX "SharedParticipant_agreementId_idx" ON "SharedParticipant" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "SharedParticipant_userEmail_idx" ON "SharedParticipant" USING btree ("userEmail");--> statement-breakpoint
CREATE INDEX "SupportMessage_agreementId_idx" ON "SupportMessage" USING btree ("agreementId");--> statement-breakpoint
CREATE INDEX "SupportMessage_partnerId_idx" ON "SupportMessage" USING btree ("partnerId");--> statement-breakpoint
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge" USING btree ("badgeId");--> statement-breakpoint
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_idx" ON "UserBadge" USING btree ("userId","badgeId");--> statement-breakpoint
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "UserStats_userId_idx" ON "UserStats" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "VerificationSubmission_userId_idx" ON "VerificationSubmission" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "VerificationSubmission_status_idx" ON "VerificationSubmission" USING btree ("status");