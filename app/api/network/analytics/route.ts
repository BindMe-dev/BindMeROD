import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { db } from "@/lib/db"
import { agreements, users, sharedParticipants } from "@/lib/db/schema"
import { eq, and, sql, desc } from "drizzle-orm"
import { calculateTrustScore, analyzeNetworkHealth, generateRecommendations } from "@/lib/smart-connections"
import type { NetworkInsights, PartnerAnalytics } from "@/lib/smart-connections"

/**
 * GET /api/network/analytics
 * Returns comprehensive network analytics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user's agreements
    const userAgreements = await db.query.agreements.findMany({
      where: eq(agreements.userId, userId),
      with: {
        partners: true,
        sharedWith: true,
        completions: true,
      },
    })

    // Calculate partner analytics
    const partnerMap = new Map<string, {
      email: string
      name: string
      agreements: any[]
      completed: number
      totalResponseTime: number
      disputes: number
    }>()

    for (const agreement of userAgreements) {
      // Process partners
      if (agreement.partners) {
        for (const partner of agreement.partners) {
          if (!partnerMap.has(partner.email)) {
            partnerMap.set(partner.email, {
              email: partner.email,
              name: partner.name,
              agreements: [],
              completed: 0,
              totalResponseTime: 0,
              disputes: 0,
            })
          }
          const partnerData = partnerMap.get(partner.email)!
          partnerData.agreements.push(agreement)
          
          if (agreement.status === 'completed') {
            partnerData.completed++
          }
          if (agreement.status === 'disputed') {
            partnerData.disputes++
          }
        }
      }

      // Process shared participants
      if (agreement.sharedWith) {
        for (const participant of agreement.sharedWith) {
          if (!partnerMap.has(participant.userEmail)) {
            partnerMap.set(participant.userEmail, {
              email: participant.userEmail,
              name: participant.userName,
              agreements: [],
              completed: 0,
              totalResponseTime: 0,
              disputes: 0,
            })
          }
          const partnerData = partnerMap.get(participant.userEmail)!
          partnerData.agreements.push(agreement)
          
          if (agreement.status === 'completed') {
            partnerData.completed++
          }
          if (agreement.status === 'disputed') {
            partnerData.disputes++
          }
        }
      }
    }

    // Calculate top partners
    const topPartners = Array.from(partnerMap.entries())
      .map(([email, data]) => {
        const agreementCount = data.agreements.length
        const completionRate = agreementCount > 0 ? data.completed / agreementCount : 0
        const avgResponseTime = 24 // TODO: Calculate from actual data
        const trustScore = calculateTrustScore(
          data.completed,
          agreementCount,
          avgResponseTime,
          data.disputes
        )

        return {
          userId: email, // Using email as ID for now
          name: data.name,
          agreementCount,
          completionRate,
          avgResponseTime,
          trustScore,
        }
      })
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 10)

    // Calculate network metrics
    const totalConnections = partnerMap.size
    const activeConnections = Array.from(partnerMap.values()).filter(p => {
      const recentAgreement = p.agreements.some(a => {
        const createdAt = new Date(a.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return createdAt > thirtyDaysAgo
      })
      return recentAgreement
    }).length

    const averageTrustScore = topPartners.length > 0
      ? topPartners.reduce((sum, p) => sum + p.trustScore, 0) / topPartners.length
      : 0

    // Calculate growth rate (mock for now)
    const networkGrowthRate = 15 // TODO: Calculate from historical data

    // Build insights object
    const insights: NetworkInsights = {
      totalConnections,
      activeConnections,
      averageTrustScore,
      networkGrowthRate,
      topPartners,
      networkHealth: analyzeNetworkHealth({
        totalConnections,
        averageTrustScore,
        networkGrowthRate,
      }),
      recommendations: [],
    }

    // Generate recommendations
    insights.recommendations = generateRecommendations(insights)

    return NextResponse.json(insights)
  } catch (error) {
    console.error('[NETWORK_ANALYTICS]', error)
    return NextResponse.json(
      { error: 'Failed to generate network analytics' },
      { status: 500 }
    )
  }
}

