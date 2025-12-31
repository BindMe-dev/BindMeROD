import { and, ilike, ne, or } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/user-types"

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    dateOfBirth: user.dateOfBirth,
    address: user.verifiedAddress,
    publicProfile: user.publicProfile || DEFAULT_PUBLIC_PROFILE,
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get("query") || ""
  const currentUserId = await getUserIdFromRequest()

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const searchQuery = query.toLowerCase()

  const results = await db.query.users.findMany({
    where: (users, { and, or, ilike, ne }) =>
      and(
        ne(users.id, currentUserId),
        or(ilike(users.email, `%${searchQuery}%`), ilike(users.name, `%${searchQuery}%`)),
      ),
    limit: 10,
  })

  return NextResponse.json({ users: results.map(sanitizeUser) })
}
