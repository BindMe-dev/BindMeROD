import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '@/lib/email-service'

/**
 * POST /api/user/delete-request
 * Request account deletion (GDPR compliance)
 * This creates a deletion request that will be processed by admins
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

    const body = await request.json()
    const { reason, password } = body

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

    // Verify password (basic check - in production use proper password verification)
    // TODO: Implement proper password verification
    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation is required' },
        { status: 400 }
      )
    }

    // Send deletion request email to user
    await sendEmail({
      to: user.email,
      subject: 'Account Deletion Request Received',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deletion Request</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; max-width: 640px; margin: 0 auto; padding: 24px; background: #0b1224;">
            <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 24px;">
              <h1 style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 22px;">⚠️ Account Deletion Request</h1>
              <p style="margin: 0 0 12px 0; color: #cbd5e1;">
                We've received your request to delete your BindMe account.
              </p>
              <p style="margin: 0 0 12px 0; color: #cbd5e1;">
                Your account will be permanently deleted within 30 days. During this period, you can cancel the deletion by logging in.
              </p>
              <p style="margin: 0 0 12px 0; color: #cbd5e1;">
                <strong>Important:</strong> This action will delete all your agreements, signatures, and personal data permanently.
              </p>
              ${reason ? `<p style="margin: 0 0 12px 0; color: #cbd5e1;"><strong>Reason provided:</strong> ${reason}</p>` : ''}
              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
                If you did not request this, please contact support immediately.
              </p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px;">
              BindMe · Account Management
            </p>
          </body>
        </html>
      `,
    })

    // TODO: Create a deletion request record in the database
    // For now, we'll just log it
    console.log(`Deletion request for user ${userId}:`, reason)

    return NextResponse.json({
      success: true,
      message: 'Account deletion request submitted. You will receive a confirmation email.',
      scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    })
  } catch (error) {
    console.error('Delete request error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process deletion request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/delete-request
 * Cancel a pending deletion request
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Remove deletion request from database

    return NextResponse.json({
      success: true,
      message: 'Account deletion request cancelled',
    })
  } catch (error) {
    console.error('Cancel deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to cancel deletion request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
