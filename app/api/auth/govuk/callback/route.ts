import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

// NOTE: This is a simplified placeholder callback. In production, you must:
// 1) Validate `state` and `nonce`.
// 2) Exchange `code` for tokens at the GOV.UK token endpoint using client credentials.
// 3) Validate ID token signature and claims against GOV.UK JWKS.
// 4) Call userinfo to obtain the Core Identity JWT and parse verified attributes.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const storedState = request.headers.get("cookie")?.match(/govuk_state=([^;]+)/)?.[1]
  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  const userId = await getUserIdFromRequest()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  // Placeholder "verified" payload. Replace with parsed Core Identity JWT fields.
  const verifiedName = "GOV.UK Verified Name"
  const verifiedDob = "1990-01-01"
  const verifiedAddress = "Verified address from GOV.UK"

  await db
    .update(users)
    .set({
      isVerified: true,
      verifiedAt: new Date(),
      verificationType: "govuk_one_login",
      verifiedName,
      verifiedDob,
      verifiedAddress,
    })
    .where(eq(users.id, userId))

  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/settings?verified=success`
  const response = NextResponse.redirect(redirectUrl || "/settings")
  response.cookies.delete("govuk_state")
  response.cookies.delete("govuk_nonce")
  return response
}
