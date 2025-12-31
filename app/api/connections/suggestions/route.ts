import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { db } from "@/lib/db"
import { users, agreements, agreementPartners, sharedParticipants } from "@/lib/db/schema"
import { eq, and, ne, sql } from "drizzle-orm"
import { generateConnectionSuggestions, calculateTrustScore } from "@/lib/smart-connections"

/**
 * GET /api/connections/suggestions
 * Returns AI-powered connection suggestions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current connections (people they have agreements with)
    const userAgreements = await db.query.agreements.findMany({
      where: eq(agreements.userId, userId),
      with: {
        partners: true,
        sharedWith: true,
      },
    })

    // Extract unique partner IDs
    const partnerIds = new Set<string>()
    const partnerEmails = new Set<string>()

    for (const agreement of userAgreements) {
      // From partners table
      if (agreement.partners) {
        for (const partner of agreement.partners) {
          if (partner.email) partnerEmails.add(partner.email)
        }
      }
      // From shared participants
      if (agreement.sharedWith) {
        for (const participant of agreement.sharedWith) {
          if (participant.userId) partnerIds.add(participant.userId)
          if (participant.userEmail) partnerEmails.add(participant.userEmail)
        }
      }
    }

    // Get actual user records for partners
    const partnerUsers = await db.query.users.findMany({
      where: sql`${users.email} IN (${Array.from(partnerEmails).join(',')})`,
    })

    // Build connection strength data
    const connections = partnerUsers.map(partner => {
      const mutualAgreements = userAgreements.filter(a =>
        a.partners?.some(p => p.email === partner.email) ||
        a.sharedWith?.some(s => s.userEmail === partner.email)
      ).length

      return {
        id: `conn_${partner.id}`,
        userId,
        connectedUserId: partner.id,
        connectedUserName: partner.name || partner.email,
        connectedUserEmail: partner.email,
        connectionStrength: Math.min(mutualAgreements / 10, 1),
        mutualAgreements,
        trustScore: 4.2, // TODO: Calculate from actual data
        createdAt: new Date(),
      }
    })

    // Get all users for suggestion generation
    const allUsers = await db.query.users.findMany({
      where: and(
        ne(users.id, userId),
        eq(users.isVerified, true)
      ),
      limit: 100,
    })

    // Get their agreements for analysis
    const allUsersWithAgreements = await Promise.all(
      allUsers.map(async (user) => {
        const userAgreements = await db.query.agreements.findMany({
          where: eq(agreements.userId, user.id),
          with: {
            partners: true,
          },
        })
        return {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          agreements: userAgreements,
        }
      })
    )

    // Generate suggestions
    const suggestions = generateConnectionSuggestions(
      userId,
      connections,
      allUsersWithAgreements
    )

    return NextResponse.json({
      suggestions: suggestions.slice(0, 10),
      currentConnections: connections.length,
    })
  } catch (error) {
    console.error('[CONNECTION_SUGGESTIONS]', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/connections/suggestions/:id/dismiss
 * Dismiss a connection suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { suggestionId } = body

    // TODO: Mark suggestion as dismissed in database
    // For now, just acknowledge

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DISMISS_SUGGESTION]', error)
    return NextResponse.json(
      { error: 'Failed to dismiss suggestion' },
      { status: 500 }
    )
  }
}

