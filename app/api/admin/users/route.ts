import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, admins } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { eq, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await db.query.admins.findFirst({
      where: eq(admins.userId, userId),
    })
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").toLowerCase().trim()
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "50", 10), 1), 100)
    const verifiedFilter = searchParams.get("verified") // "true" | "false" | null
    const roleFilter = searchParams.get("role") // "admin" | "user" | null

    const conditions: any[] = []
    if (q) {
      const like = `%${q}%`
      conditions.push(sql`lower(${users.email}) like ${like} or lower(${users.name}) like ${like}`)
    }
    if (verifiedFilter === "true") {
      conditions.push(eq(users.isVerified, true))
    } else if (verifiedFilter === "false") {
      conditions.push(eq(users.isVerified, false))
    }

    // role filter handled after selecting admin flag
    const baseQuery = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        verificationType: users.verificationType,
        isAdmin: sql<boolean>`EXISTS (select 1 from "Admin" a where a."userId" = ${users.id})`,
      })
      .from(users)

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : conditions.reduce((acc, cur) => sql`${acc} AND ${cur}`)

    const totalRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(whereClause as any)
      .execute()
    const total = Number(totalRows[0]?.count || 0)

    const rows = await baseQuery
      .where(whereClause as any)
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const filteredRows =
      roleFilter === "admin"
        ? rows.filter((r) => r.isAdmin)
        : roleFilter === "user"
          ? rows.filter((r) => !r.isAdmin)
          : rows

    return NextResponse.json({ users: filteredRows, total, page, pageSize })
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}
