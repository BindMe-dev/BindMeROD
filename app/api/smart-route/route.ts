import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { db } from "@/lib/db"
import { admins, agreements, notifications } from "@/lib/db/schema"
import { eq, and, or, sql } from "drizzle-orm"
import { getSmartRoute, type UserContext, type PendingAction } from "@/lib/smart-routing"

/**
 * GET /api/smart-route
 * Returns the optimal route for the current user based on their context
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ path: '/login', reason: 'Not authenticated' })
    }

    // Check if user is admin
    const adminRecord = await db.query.admins.findFirst({
      where: eq(admins.userId, userId),
    })
    const isAdmin = !!adminRecord

    // Get pending actions
    const pendingActions: PendingAction[] = []

    // 1. Check for agreements needing signature
    const unsignedAgreements = await db.query.agreements.findMany({
      where: and(
        or(
          eq(agreements.userId, userId),
          sql`${agreements.id} IN (SELECT "agreementId" FROM "SharedParticipant" WHERE "userId" = ${userId})`
        ),
        eq(agreements.status, 'pending')
      ),
      limit: 10,
    })

    for (const agreement of unsignedAgreements) {
      pendingActions.push({
        type: 'signature_needed',
        agreementId: agreement.id,
        priority: 'high',
        path: `/agreements/${agreement.id}`,
      })
    }

    // 2. Check for active disputes
    const disputedAgreements = await db.query.agreements.findMany({
      where: and(
        or(
          eq(agreements.userId, userId),
          sql`${agreements.id} IN (SELECT "agreementId" FROM "SharedParticipant" WHERE "userId" = ${userId})`
        ),
        eq(agreements.status, 'disputed')
      ),
      limit: 5,
    })

    for (const agreement of disputedAgreements) {
      pendingActions.push({
        type: 'dispute_active',
        agreementId: agreement.id,
        priority: 'high',
        path: `/agreements/${agreement.id}`,
      })
    }

    // 3. Check for admin verifications (if admin)
    if (isAdmin) {
      const pendingVerifications = await db.execute(
        sql`SELECT COUNT(*) as count FROM "IDVerification" WHERE "status" = 'pending'`
      )
      const verificationCount = (pendingVerifications.rows[0] as any)?.count || 0
      
      if (verificationCount > 0) {
        pendingActions.push({
          type: 'verification_pending',
          priority: 'medium',
          path: '/admin/verifications',
        })
      }
    }

    // 4. Get unread notifications count
    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ),
    })

    // 5. Get last visited path from query params or headers
    const lastVisitedPath = request.nextUrl.searchParams.get('lastPath') || undefined

    // Build user context
    const context: UserContext = {
      userId,
      isAdmin,
      pendingActions,
      unreadNotifications: unreadNotifications.length,
      lastVisitedPath,
      userRole: isAdmin ? 'admin' : 'user',
    }

    // Get smart route decision
    const decision = getSmartRoute(context)

    return NextResponse.json({
      ...decision,
      context: {
        isAdmin,
        pendingActionsCount: pendingActions.length,
        unreadNotifications: unreadNotifications.length,
      },
    })
  } catch (error) {
    console.error('[SMART_ROUTE]', error)
    return NextResponse.json(
      { path: '/dashboard', reason: 'Error determining route' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/smart-route/track
 * Track user navigation for smart routing
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { path, duration } = body

    // TODO: Store in NavigationHistory table
    // For now, just acknowledge
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SMART_ROUTE_TRACK]', error)
    return NextResponse.json({ error: 'Failed to track navigation' }, { status: 500 })
  }
}

