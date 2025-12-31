import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"

const DEFAULT_ISSUER = process.env.GOVUK_ISSUER || "https://oidc.integration.account.gov.uk"
const DEFAULT_REDIRECT =
  process.env.GOVUK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/govuk/callback`

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clientId } = await request.json().catch(() => ({}))

  const resolvedClientId = clientId || process.env.GOVUK_CLIENT_ID
  if (!resolvedClientId) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
  }

  const state = randomUUID()
  const nonce = randomUUID()

  const authorizeUrl = new URL(`${DEFAULT_ISSUER}/authorize`)
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    scope: "openid coreIdentityJWT address",
    client_id: resolvedClientId,
    redirect_uri: DEFAULT_REDIRECT,
    state,
    nonce,
  }).toString()

  const response = NextResponse.json({ redirectUrl: authorizeUrl.toString() })
  const maxAge = 5 * 60 // 5 minutes

  response.cookies.set("govuk_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  })
  response.cookies.set("govuk_nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  })

  return response
}
