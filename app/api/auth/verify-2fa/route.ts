import { NextRequest, NextResponse } from 'next/server'
import { TwoFactorAuth } from '@/lib/two-factor'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserIdFromRequest } from '@/lib/server-auth'

/**
 * POST /api/auth/verify-2fa
 * Verify a 2FA token or backup code
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, isBackupCode = false } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Fetch user with 2FA settings
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    let verified = false
    let backupCodeUsed = false

    if (isBackupCode) {
      // Verify backup code
      const backupCodes = TwoFactorAuth.parseStoredBackupCodes(user.backupCodes || '')
      verified = TwoFactorAuth.verifyBackupCode(token, backupCodes)

      if (verified) {
        // Remove the used backup code
        const updatedCodes = TwoFactorAuth.removeUsedBackupCode(
          user.backupCodes || '',
          token
        )

        await db
          .update(users)
          .set({ backupCodes: updatedCodes })
          .where(eq(users.id, userId))

        backupCodeUsed = true
      }
    } else {
      // Verify TOTP token
      verified = TwoFactorAuth.verifyToken(token, user.twoFactorSecret)
    }

    if (!verified) {
      return NextResponse.json(
        { 
          error: isBackupCode 
            ? 'Invalid backup code' 
            : 'Invalid verification code',
          verified: false 
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      verified: true,
      message: backupCodeUsed 
        ? 'Backup code verified. This code has been consumed.'
        : '2FA verification successful',
      backupCodeUsed,
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify 2FA token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/verify-2fa
 * Enable or disable 2FA
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, secret, token, backupCodes } = body

    if (action === 'enable') {
      // Validate setup
      const validation = TwoFactorAuth.validateSetup({
        secret,
        token,
        backupCodes,
      })

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Prepare data for storage
      const storageData = TwoFactorAuth.prepareForStorage({
        secret,
        backupCodes,
      })

      // Update user
      await db
        .update(users)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret: storageData.twoFactorSecret,
          backupCodes: storageData.backupCodes,
        })
        .where(eq(users.id, userId))

      return NextResponse.json({
        success: true,
        message: '2FA has been enabled successfully',
      })
    } else if (action === 'disable') {
      // Verify token before disabling
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })

      if (!user || !user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA is not enabled' },
          { status: 400 }
        )
      }

      const verified = TwoFactorAuth.verifyToken(token, user.twoFactorSecret)
      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        )
      }

      // Disable 2FA
      await db
        .update(users)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null,
        })
        .where(eq(users.id, userId))

      return NextResponse.json({
        success: true,
        message: '2FA has been disabled',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "enable" or "disable"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update 2FA settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/verify-2fa
 * Get 2FA setup information (secret and QR code)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new secret for setup
    const secret = TwoFactorAuth.generateSecret()
    const qrCodeUrl = TwoFactorAuth.generateQRCodeURL(user.email, secret)
    const backupCodes = TwoFactorAuth.generateBackupCodes()

    return NextResponse.json({
      enabled: user.twoFactorEnabled || false,
      secret,
      qrCodeUrl,
      backupCodes,
    })
  } catch (error) {
    console.error('2FA setup fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch 2FA setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
