/**
 * Smart Connections & Network Intelligence
 * AI-powered connection suggestions and relationship insights
 */

export interface UserConnection {
  id: string
  userId: string
  connectedUserId: string
  connectedUserName: string
  connectedUserEmail: string
  connectionStrength: number // 0-1
  mutualAgreements: number
  trustScore: number // 0-5
  lastInteraction?: Date
  createdAt: Date
}

export interface ConnectionSuggestion {
  id: string
  suggestedUser: {
    id: string
    name: string
    email: string
    trustScore: number
    agreementCount: number
  }
  reason: 'mutual_connection' | 'similar_agreements' | 'geographic_proximity' | 'industry_match'
  confidenceScore: number // 0-1
  mutualConnections: Array<{ id: string; name: string }>
  sharedInterests: string[]
}

export interface NetworkInsights {
  totalConnections: number
  activeConnections: number
  averageTrustScore: number
  networkGrowthRate: number // percentage
  topPartners: Array<{
    userId: string
    name: string
    agreementCount: number
    completionRate: number
    avgResponseTime: number // hours
    trustScore: number
  }>
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor'
  recommendations: string[]
}

export interface PartnerAnalytics {
  partnerId: string
  partnerName: string
  totalAgreements: number
  completedAgreements: number
  completionRate: number
  averageResponseTime: number // hours
  trustScore: number
  agreementHistory: Array<{
    id: string
    title: string
    status: string
    createdAt: Date
    completedAt?: Date
  }>
  trends: {
    responseTimeImproving: boolean
    completionRateImproving: boolean
    activityIncreasing: boolean
  }
}

/**
 * Calculate connection strength between two users
 */
export function calculateConnectionStrength(
  mutualAgreements: number,
  totalInteractions: number,
  daysSinceFirstInteraction: number
): number {
  // Weighted formula
  const agreementWeight = 0.4
  const interactionWeight = 0.3
  const longevityWeight = 0.3

  const agreementScore = Math.min(mutualAgreements / 10, 1) // Cap at 10 agreements
  const interactionScore = Math.min(totalInteractions / 50, 1) // Cap at 50 interactions
  const longevityScore = Math.min(daysSinceFirstInteraction / 365, 1) // Cap at 1 year

  return (
    agreementScore * agreementWeight +
    interactionScore * interactionWeight +
    longevityScore * longevityWeight
  )
}

/**
 * Calculate trust score based on agreement performance
 */
export function calculateTrustScore(
  completedAgreements: number,
  totalAgreements: number,
  averageResponseTime: number, // hours
  disputeCount: number
): number {
  if (totalAgreements === 0) return 0

  const completionRate = completedAgreements / totalAgreements
  const responseScore = Math.max(0, 1 - averageResponseTime / 168) // 168 hours = 1 week
  const disputePenalty = Math.max(0, 1 - disputeCount * 0.2)

  const baseScore = (completionRate * 0.5 + responseScore * 0.3 + disputePenalty * 0.2) * 5

  return Math.min(5, Math.max(0, baseScore))
}

/**
 * Generate connection suggestions using collaborative filtering
 */
export function generateConnectionSuggestions(
  userId: string,
  userConnections: UserConnection[],
  allUsers: Array<{ id: string; name: string; email: string; agreements: any[] }>
): ConnectionSuggestion[] {
  const suggestions: ConnectionSuggestion[] = []
  const connectedUserIds = new Set(userConnections.map(c => c.connectedUserId))

  // Find mutual connections
  for (const connection of userConnections) {
    // Get this connection's connections
    const theirConnections = allUsers.find(u => u.id === connection.connectedUserId)
    if (!theirConnections) continue

    // Find users connected to them but not to you
    for (const potentialConnection of allUsers) {
      if (
        potentialConnection.id === userId ||
        connectedUserIds.has(potentialConnection.id)
      ) {
        continue
      }

      // Check if they have agreements with your connection
      const hasMutualConnection = potentialConnection.agreements.some(
        a => a.userId === connection.connectedUserId || 
             a.partners?.some((p: any) => p.userId === connection.connectedUserId)
      )

      if (hasMutualConnection) {
        suggestions.push({
          id: `suggestion_${potentialConnection.id}`,
          suggestedUser: {
            id: potentialConnection.id,
            name: potentialConnection.name,
            email: potentialConnection.email,
            trustScore: 4.2, // Calculate from their data
            agreementCount: potentialConnection.agreements.length
          },
          reason: 'mutual_connection',
          confidenceScore: 0.8,
          mutualConnections: [{ id: connection.connectedUserId, name: connection.connectedUserName }],
          sharedInterests: []
        })
      }
    }
  }

  // Sort by confidence score
  return suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 10)
}

/**
 * Analyze network health
 */
export function analyzeNetworkHealth(insights: Partial<NetworkInsights>): NetworkInsights['networkHealth'] {
  const { totalConnections = 0, averageTrustScore = 0, networkGrowthRate = 0 } = insights

  if (totalConnections >= 20 && averageTrustScore >= 4.0 && networkGrowthRate >= 10) {
    return 'excellent'
  } else if (totalConnections >= 10 && averageTrustScore >= 3.5 && networkGrowthRate >= 5) {
    return 'good'
  } else if (totalConnections >= 5 && averageTrustScore >= 3.0) {
    return 'fair'
  }
  return 'poor'
}

/**
 * Generate personalized recommendations
 */
export function generateRecommendations(insights: NetworkInsights): string[] {
  const recommendations: string[] = []

  if (insights.totalConnections < 5) {
    recommendations.push('Build your network by creating agreements with new partners')
  }

  if (insights.averageTrustScore < 3.5) {
    recommendations.push('Improve your trust score by completing agreements on time')
  }

  if (insights.networkGrowthRate < 0) {
    recommendations.push('Re-engage with inactive connections to grow your network')
  }

  if (insights.topPartners.length > 0) {
    const topPartner = insights.topPartners[0]
    if (topPartner.completionRate > 0.9) {
      recommendations.push(`${topPartner.name} is a highly reliable partner - consider more collaborations`)
    }
  }

  return recommendations
}

