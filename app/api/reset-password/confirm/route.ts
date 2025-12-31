import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { sendEmail, generatePasswordChangedEmail } from "@/lib/email-service"

const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "https://bindme.co.uk"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Find valid token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    })

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.id, resetToken.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and mark token as used
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          password: hashedPassword,
          isVerified: true,
          verifiedAt: user.verifiedAt || new Date(),
        })
        .where(eq(users.id, user.id))

      await tx
        .update(passwordResetTokens)
        .set({ 
          used: true, 
          usedAt: new Date(),
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
          userAgent: request.headers.get("user-agent") || "",
        })
        .where(eq(passwordResetTokens.id, resetToken.id))
    })

    // Double-check the password was updated and is usable immediately
    const refreshedUser = await db.query.users.findFirst({ where: eq(users.id, user.id) })
    if (!refreshedUser) {
      return NextResponse.json({ error: "User not found after reset" }, { status: 500 })
    }
    const passwordWorks = await bcrypt.compare(password, refreshedUser.password)
    if (!passwordWorks) {
      return NextResponse.json({ error: "Password update failed to persist" }, { status: 500 })
    }

    // Notify the user their password was changed
    try {
      const emailContent = generatePasswordChangedEmail(user.email, appBaseUrl)
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
    } catch (emailError) {
      console.error("Password change confirmation email failed:", emailError)
    }

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Password reset confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
