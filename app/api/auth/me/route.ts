import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, userPreferences } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/user-types"

function sanitizeUser(user: any, prefs: any | null) {
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
    publicProfile: user.publicProfile || DEFAULT_PUBLIC_PROFILE,
    isVerified: user.isVerified ?? false,
    verifiedAt: user.verifiedAt,
    verificationType: user.verificationType,
    dateOfBirth: user.dateOfBirth,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
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
      : null,
    agreementCount: user.agreementCount ?? 0,
    createdAt: user.createdAt,
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) })

  return NextResponse.json({ user: sanitizeUser(user, prefs) })
}
