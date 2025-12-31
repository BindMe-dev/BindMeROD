import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, emailVerificationTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { createSessionToken, setSessionCookie } from "@/lib/server-auth"
import { sendEmail, generateWelcomeEmail, generateActivationConfirmationEmail } from "@/lib/email-service"

const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "https://bindme.co.uk"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", request.url))
    }

    // Find valid verification token
    const verificationToken = await db.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.token, token),
        eq(emailVerificationTokens.used, false),
        gt(emailVerificationTokens.expiresAt, new Date())
      ),
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/login?error=expired-token", request.url))
    }

    // Find user and verify
    const user = await db.query.users.findFirst({
      where: eq(users.id, verificationToken.userId),
    })

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user-not-found", request.url))
    }

    // Update user as verified and mark token as used
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ isVerified: true, verifiedAt: new Date() })
        .where(eq(users.id, user.id))

      await tx
        .update(emailVerificationTokens)
        .set({ used: true, usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, verificationToken.id))
    })

    // Create session and log user in
    const { token: sessionToken, csrfToken } = createSessionToken(user.id, request)
    await setSessionCookie(sessionToken, csrfToken, request)

    // Send welcome email
    try {
      const welcomeEmail = generateWelcomeEmail(user.email, user.name)
      await sendEmail({
        to: user.email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
      })
      console.log('✅ Welcome email sent to:', user.email)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    // Send activation confirmation (explicit)
    try {
      const activationEmail = generateActivationConfirmationEmail(user.email, user.name, appBaseUrl)
      await sendEmail({
        to: user.email,
        subject: activationEmail.subject,
        html: activationEmail.html,
      })
      console.log("Activation confirmation email sent to:", user.email)
    } catch (emailError) {
      console.error("Failed to send activation confirmation email:", emailError)
    }

    return NextResponse.redirect(new URL("/dashboard?verified=true", request.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/login?error=verification-failed", request.url))
  }
}
