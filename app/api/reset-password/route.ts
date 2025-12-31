import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { sendEmail, generatePasswordResetEmail, generatePromotionalEmail } from "@/lib/email-service"
import { validatePasswordStrength } from "@/lib/security/password-security"
import bcrypt from "bcryptjs"

const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "https://bindme.co.uk"

// Password reset request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    if (!user) {
      // Still send promotional email but return a generic message
      try {
        const promoEmail = generatePromotionalEmail(normalizedEmail)
        await sendEmail({
          to: normalizedEmail,
          subject: promoEmail.subject,
          html: promoEmail.html,
        })
      } catch (e) {
        console.error("Failed to send promo email during reset request:", e)
      }

      return NextResponse.json({ 
        message: "If an account exists, a reset link has been sent" 
      })
    }

    // Check for existing unused tokens
    const existingToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    })

    if (existingToken) {
      return NextResponse.json({ 
        error: "A reset link was already sent. Please check your email or wait 15 minutes." 
      }, { status: 429 })
    }

    // Create reset token
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await db.insert(passwordResetTokens).values({
      id: randomUUID(),
      userId: user.id,
      token,
      email: user.email,
      expiresAt,
    })

    // Send email with reset link
    const resetUrl = `${appBaseUrl}/reset-password?token=${token}`
    const emailContent = generatePasswordResetEmail(resetUrl, user.email)
    
    const emailResult = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (!emailResult.success) {
      console.error(`Failed to send password reset email to ${user.email}`)
      return NextResponse.json({ error: "Failed to send reset email. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Password reset confirmation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = body

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    // Password strength validation (only security measure kept)
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isValid) {
      return NextResponse.json({ 
        error: "Password does not meet security requirements",
        details: passwordStrength.feedback
      }, { status: 400 })
    }

    // Find and validate reset token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    })

    if (!resetToken) {
      return NextResponse.json({ 
        error: "Invalid or expired reset token" 
      }, { status: 400 })
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, resetToken.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and mark token as used
    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id))

      await tx.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id))
    })

    return NextResponse.json({ 
      message: "Password has been reset successfully. You can now log in with your new password." 
    })
  } catch (error) {
    console.error("Password reset confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
