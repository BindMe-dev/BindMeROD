import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, emailVerificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/user-types"
import { sendEmail, generateVerificationEmail } from "@/lib/email-service"
import { validatePasswordStrength } from "@/lib/security/password-security"
import bcrypt from "bcryptjs"

const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "https://bindme.co.uk"

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export async function POST(request: NextRequest) {
  console.log("[SIGNUP] Request received")
  
  try {
    const body = await request.json()
    console.log("[SIGNUP] Body parsed:", { ...body, password: "[REDACTED]" })
    
    const { 
      email, 
      password, 
      firstName, 
      middleName, 
      lastName, 
      dateOfBirth
    } = body

    // Basic validation
    if (!email || !password || !firstName || !lastName || !dateOfBirth) {
      console.log("[SIGNUP] Missing required fields")
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Password strength validation (only security measure kept)
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isValid) {
      console.log("[SIGNUP] Password strength invalid:", passwordStrength.feedback)
      return NextResponse.json({ 
        error: "Password does not meet security requirements",
        details: passwordStrength.feedback
      }, { status: 400 })
    }

    // Validate age (must be 10+)
    const age = calculateAge(dateOfBirth)
    if (age < 10) {
      console.log("[SIGNUP] Age too young:", age)
      return NextResponse.json({ 
        error: "You must be at least 10 years old to create an account" 
      }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const fullName = [firstName.trim(), middleName?.trim(), lastName.trim()].filter(Boolean).join(' ')

    // Check if email already exists
    console.log("[SIGNUP] Checking if email exists:", normalizedEmail)
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    if (existingEmail) {
      console.log("[SIGNUP] Email already exists")
      return NextResponse.json({
        error: "An account with this email already exists"
      }, { status: 400 })
    }

    // Hash password
    console.log("[SIGNUP] Hashing password")
    const hashed = await bcrypt.hash(password, 10)

    // Insert user
    console.log("[SIGNUP] Inserting user into database")
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: normalizedEmail,
        password: hashed,
        firstName: firstName.trim(),
        middleName: middleName?.trim() || null,
        lastName: lastName.trim(),
        name: fullName,
        dateOfBirth,
        publicProfile: DEFAULT_PUBLIC_PROFILE,
        agreementCount: 0,
        isVerified: false,
      })
      .returning()

    console.log("[SIGNUP] User created with ID:", user.id)

    // Create verification token
    const verificationToken = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log("[SIGNUP] Creating verification token")
    await db.insert(emailVerificationTokens).values({
      id: randomUUID(),
      userId: user.id,
      token: verificationToken,
      email: user.email,
      expiresAt,
    })

    // Send verification email
    const verificationUrl = `${appBaseUrl}/api/auth/verify-email?token=${verificationToken}`
    const verificationEmail = generateVerificationEmail(verificationUrl, user.email, user.name)
    
    console.log("[SIGNUP] Sending verification email to:", user.email)
    const emailResult = await sendEmail({
      to: user.email,
      subject: verificationEmail.subject,
      html: verificationEmail.html,
    })

    if (!emailResult.success) {
      console.error("[SIGNUP] Failed to send verification email:", emailResult)
      return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 })
    }

    console.log("[SIGNUP] Account creation successful")
    return NextResponse.json({ 
      message: "Account created. Please check your email to verify your account.",
      email: user.email 
    })
  } catch (error) {
    console.error("[SIGNUP] Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}