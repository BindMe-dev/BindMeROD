import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { users, agreements, legalSignatures, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/user/export-data
 * Export all user data in JSON format (GDPR compliance)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch user's agreements
    const userAgreements = await db.query.agreements.findMany({
      where: eq(agreements.userId, userId),
    })

    // Fetch user's signatures
    const userSignatures = await db.query.legalSignatures.findMany({
      where: eq(legalSignatures.signedBy, userId),
    })

    // Fetch user's notifications
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
    })

    // Compile all user data
    const userData = {
      exportDate: new Date().toISOString(),
      exportedBy: userId,
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt,
        verificationType: user.verificationType,
        verifiedName: user.verifiedName,
        verifiedAddress: user.verifiedAddress,
        verifiedDob: user.verifiedDob,
        documentReference: user.documentReference,
        agreementCount: user.agreementCount,
        publicProfile: user.publicProfile,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      agreements: userAgreements.map(agreement => ({
        id: agreement.id,
        title: agreement.title,
        description: agreement.description,
        type: agreement.type,
        status: agreement.status,
        category: agreement.category,
        tags: agreement.tags,
        priority: agreement.priority,
        createdAt: agreement.createdAt,
        startDate: agreement.startDate,
        deadline: agreement.deadline,
        notes: agreement.notes,
        // Include other non-sensitive fields as needed
      })),
      signatures: userSignatures.map(signature => ({
        id: signature.id,
        agreementId: signature.agreementId,
        signedByName: signature.signedByName,
        signedByEmail: signature.signedByEmail,
        role: signature.role,
        timestamp: signature.timestamp,
        ipAddress: signature.ipAddress,
        location: signature.location,
      })),
      notifications: userNotifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt,
      })),
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bindme-data-export-${userId}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
