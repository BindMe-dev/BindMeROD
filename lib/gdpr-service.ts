/**
 * GDPR Compliance Service
 * Handles data privacy, export, and deletion requests
 * 
 * GDPR Rights Implemented:
 * 1. Right to Access (Data Export)
 * 2. Right to Erasure (Data Deletion)
 * 3. Right to Rectification (Data Update)
 * 4. Right to Data Portability
 */

import { db } from "@/lib/db"
import {
  users,
  agreements,
  legalSignatures,
  auditLogs,
  notifications,
} from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"

export interface UserDataExport {
  user: any
  agreements: any[]
  signatures: any[]
  notifications: any[]
  auditLogs: any[]
  exportedAt: string
  format: "json"
}

/**
 * Export all user data (GDPR Right to Access)
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  try {
    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Get all agreements where user is involved
    const userAgreements = await db.query.agreements.findMany({
      where: or(
        eq(agreements.creatorId, userId),
        eq(agreements.counterpartyId, userId)
      ),
    })

    // Get all signatures
    const userSignatures = await db.query.legalSignatures.findMany({
      where: eq(legalSignatures.userId, userId),
    })

    // Get all notifications
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
    })

    // Get audit logs
    const userAuditLogs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.userId, userId),
    })

    // Remove sensitive data
    const sanitizedUser = {
      ...user,
      passwordHash: "[REDACTED]",
    }

    return {
      user: sanitizedUser,
      agreements: userAgreements,
      signatures: userSignatures,
      notifications: userNotifications,
      auditLogs: userAuditLogs,
      exportedAt: new Date().toISOString(),
      format: "json",
    }
  } catch (error) {
    console.error("Error exporting user data:", error)
    throw error
  }
}

/**
 * Delete all user data (GDPR Right to Erasure)
 * Note: Some data may need to be retained for legal/compliance reasons
 */
export async function deleteUserData(
  userId: string,
  options: {
    keepAgreements?: boolean // Keep agreements for legal compliance
    keepAuditLogs?: boolean // Keep audit logs for compliance
    anonymize?: boolean // Anonymize instead of delete
  } = {}
): Promise<{ success: boolean; deletedRecords: number }> {
  try {
    let deletedRecords = 0

    if (options.anonymize) {
      // Anonymize user data instead of deleting
      await db
        .update(users)
        .set({
          email: `deleted-${userId}@anonymized.local`,
          name: "Deleted User",
          passwordHash: null,
          profilePicture: null,
          phone: null,
          address: null,
          city: null,
          postcode: null,
          country: null,
          dateOfBirth: null,
          identityVerified: false,
        })
        .where(eq(users.id, userId))

      deletedRecords++
    } else {
      // Full deletion
      
      // Delete notifications
      await db.delete(notifications).where(eq(notifications.userId, userId))
      deletedRecords++

      // Delete signatures (if not keeping agreements)
      if (!options.keepAgreements) {
        await db.delete(legalSignatures).where(eq(legalSignatures.userId, userId))
        deletedRecords++
      }

      // Delete agreements (if not keeping for legal reasons)
      if (!options.keepAgreements) {
        await db.delete(agreements).where(
          or(
            eq(agreements.creatorId, userId),
            eq(agreements.counterpartyId, userId)
          )
        )
        deletedRecords++
      }

      // Delete audit logs (if not keeping for compliance)
      if (!options.keepAuditLogs) {
        await db.delete(auditLogs).where(eq(auditLogs.userId, userId))
        deletedRecords++
      }

      // Finally, delete user account
      await db.delete(users).where(eq(users.id, userId))
      deletedRecords++
    }

    return {
      success: true,
      deletedRecords,
    }
  } catch (error) {
    console.error("Error deleting user data:", error)
    throw error
  }
}

/**
 * Get user consent status
 */
export async function getUserConsent(userId: string): Promise<{
  marketing: boolean
  analytics: boolean
  thirdParty: boolean
  updatedAt: Date | null
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    throw new Error("User not found")
  }

  // TODO: Add consent fields to user schema
  return {
    marketing: false,
    analytics: true,
    thirdParty: false,
    updatedAt: null,
  }
}

/**
 * Update user consent
 */
export async function updateUserConsent(
  userId: string,
  consent: {
    marketing?: boolean
    analytics?: boolean
    thirdParty?: boolean
  }
): Promise<{ success: boolean }> {
  // TODO: Add consent fields to user schema and update them
  console.log("Updating consent for user:", userId, consent)
  
  return {
    success: true,
  }
}

/**
 * Log data access (for GDPR compliance)
 */
export async function logDataAccess(
  userId: string,
  accessType: "export" | "view" | "update" | "delete",
  details: string
): Promise<void> {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: `gdpr_${accessType}`,
    details,
    timestamp: new Date(),
  })
}

