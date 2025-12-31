import { and, eq, ne, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import {
  users,
  userPreferences,
  notifications,
  passwordResetTokens,
  emailVerificationTokens,
  chatMessages,
  chatParticipants,
  supportMessages,
  sharedParticipants,
  agreements,
} from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/user-types"

function sanitizeUser(user: any, prefs?: any) {
  let parsedAddress: any = {}
  if (user.verifiedAddress) {
    try {
      parsedAddress = JSON.parse(user.verifiedAddress)
    } catch {
      parsedAddress = { streetAddress: user.verifiedAddress }
    }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    publicProfile: user.publicProfile || DEFAULT_PUBLIC_PROFILE,
    isVerified: user.isVerified ?? false,
    verifiedAt: user.verifiedAt,
    verificationType: user.verificationType,
    dateOfBirth: user.dateOfBirth,
    address: parsedAddress.streetAddress || "",
    city: parsedAddress.city || "",
    county: parsedAddress.county || "",
    postcode: parsedAddress.postcode || "",
    country: parsedAddress.country || "",
    preferences: prefs
      ? {
          ...prefs,
          agreementNotificationSettings: prefs.agreementNotificationSettings || {},
        }
      : user.preferences
      ? {
          ...user.preferences,
          agreementNotificationSettings: user.preferences.agreementNotificationSettings || {},
        }
      : null,
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    username,
    publicProfile,
    dateOfBirth,
    address,
    city,
    county,
    postcode,
    country,
    streetAddress,
    firstName,
    middleName,
    lastName,
    phoneNumber,
    emergencyContact,
    occupation,
    company,
    bio,
  } = body

  const currentUser = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existingPrefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) })

  if (username) {
    const exists = await db.query.users.findFirst({
      where: (users, { eq, and, ne }) => and(eq(users.username, username.toLowerCase()), ne(users.id, userId)),
    })
    if (exists) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
    }
  }

  const existingProfile = (currentUser.publicProfile as any) || DEFAULT_PUBLIC_PROFILE

  const data: Partial<typeof users.$inferInsert> = {}
  if (name) data.name = name
  if (firstName !== undefined) data.firstName = firstName
  if (middleName !== undefined) data.middleName = middleName
  if (lastName !== undefined) data.lastName = lastName
  if (firstName || middleName || lastName) {
    const fullName = [
      firstName ?? currentUser.firstName,
      middleName ?? currentUser.middleName,
      lastName ?? currentUser.lastName,
    ]
      .filter(Boolean)
      .join(" ")
    if (fullName) data.name = fullName
  }
  if (username) data.username = username.toLowerCase()
  if (publicProfile) data.publicProfile = publicProfile
  if (dateOfBirth) data.dateOfBirth = dateOfBirth
  if (streetAddress || city || county || postcode || country) {
    data.verifiedAddress = JSON.stringify({
      streetAddress: streetAddress || address || "",
      city: city || "",
      county: county || "",
      postcode: postcode || "",
      country: country || "",
    })
  }
  if (phoneNumber || emergencyContact || occupation || company || bio) {
    data.publicProfile = {
      ...existingProfile,
      phoneNumber: phoneNumber ?? existingProfile.phoneNumber,
      emergencyContact: emergencyContact ?? existingProfile.emergencyContact,
      occupation: occupation ?? existingProfile.occupation,
      company: company ?? existingProfile.company,
      bio: bio ?? existingProfile.bio,
    }
  }

  if (Object.keys(data).length === 0 && !body.agreementNotificationSettings) {
    return NextResponse.json({ user: currentUser ? sanitizeUser(currentUser, existingPrefs) : null })
  }

  const [user] = Object.keys(data).length
    ? await db
        .update(users)
        .set(data)
        .where(eq(users.id, userId))
        .returning()
    : [currentUser]

  let prefsToReturn = existingPrefs

  // Update preferences if provided
  if (body.agreementNotificationSettings) {
    const merged = {
      ...(existingPrefs?.agreementNotificationSettings as any || {}),
      ...(body.agreementNotificationSettings as any),
    }
    if (existingPrefs) {
      prefsToReturn = (
        await db
          .update(userPreferences)
          .set({ agreementNotificationSettings: merged })
          .where(eq(userPreferences.userId, userId))
          .returning()
      )[0]
    } else {
      prefsToReturn = (
        await db.insert(userPreferences).values({
          id: randomUUID(),
          userId,
          agreementNotificationSettings: merged,
        }).returning()
      )[0]
    }
  }

  return NextResponse.json({ user: sanitizeUser(user, prefsToReturn) })
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Block deletion if user owns or participates in any non-completed agreements
  const openOwned = await db.query.agreements.findFirst({
    where: (agreements, { eq, ne }) => and(eq(agreements.userId, userId), ne(agreements.status, "completed")),
  })
  if (openOwned) {
    return NextResponse.json(
      { error: "Cannot delete account while you have open agreements as creator. Close or transfer them first." },
      { status: 409 },
    )
  }
  const openParticipant = await db
    .select({ id: agreements.id })
    .from(agreements)
    .leftJoin(sharedParticipants, eq(sharedParticipants.agreementId, agreements.id))
    .where(
      and(
        eq(sharedParticipants.userId, userId),
        sql`${agreements.status} <> 'completed'`
      ),
    )
    .limit(1)
  if (openParticipant.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete account while you are part of open agreements. Wait until they are completed." },
      { status: 409 },
    )
  }

  // Remove user references while preserving agreement records
  await db.transaction(async (tx) => {
    await tx.delete(chatMessages).where(eq(chatMessages.userId, userId))
    await tx.delete(chatParticipants).where(eq(chatParticipants.userId, userId))
    await tx.delete(supportMessages).where(eq(supportMessages.userId, userId))
    await tx
      .update(sharedParticipants)
      .set({ userId: null })
      .where(eq(sharedParticipants.userId, userId))
    await tx.delete(notifications).where(eq(notifications.userId, userId))
    await tx.delete(userPreferences).where(eq(userPreferences.userId, userId))
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId))
    await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId))
    await tx.delete(users).where(eq(users.id, userId))
  })

  return NextResponse.json({ success: true })
}
