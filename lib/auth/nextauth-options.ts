import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { randomUUID } from "crypto"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/user-types"

const providers = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  )
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  )
}

if (providers.length === 0) {
  // Provide a safe fallback so NextAuth endpoints stay JSON instead of throwing HTML errors in dev.
  providers.push(
    CredentialsProvider({
      name: "Unavailable",
      credentials: {},
      async authorize() {
        console.warn("[next-auth] No OAuth providers configured; credentials sign-in disabled.")
        return null
      },
    }),
  )
}

export const nextAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev-secret-change-me",
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = (user.email || (profile as any)?.email || "").toLowerCase().trim()
      if (!email) return false

      const name = user.name || (profile as any)?.name || email.split("@")[0]
      const nameParts = (name || "User").trim().split(/\s+/)
      const firstName = nameParts[0] || "User"
      const lastName = nameParts.slice(1).join(" ") || firstName

      const existing = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      })

      if (!existing) {
        const hashed = await bcrypt.hash(randomUUID(), 10)
        await db.insert(users).values({
          id: randomUUID(),
          email,
          password: hashed,
          name,
          firstName,
          lastName,
          dateOfBirth: "",
          publicProfile: DEFAULT_PUBLIC_PROFILE,
          isVerified: true, // OAuth users are pre-verified
          verifiedAt: new Date(),
          ipAddress: "",
        })
      }

      const created = existing
        ? existing
        : await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, email),
          })

      if (created) {
        user.id = created.id
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id as string
        ;(token as any).uid = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        ;(session.user as any).id = token.sub
      }
      return session
    },
  },
}
