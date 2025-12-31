import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api/error-handler"
import { requireAdmin } from "@/lib/security/middleware"
import { auditLogger, detectAnomalousActivity } from "@/lib/security/audit-logger"
import { getSecurityMetrics } from "@/lib/security/auth-security"

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Require admin authentication
  const { userId, user } = await requireAdmin(request)

  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  switch (action) {
    case 'metrics':
      return NextResponse.json({
        auditMetrics: auditLogger.getSecurityMetrics(),
        authMetrics: getSecurityMetrics(),
        anomalies: detectAnomalousActivity()
      })

    case 'events':
      const limit = parseInt(url.searchParams.get('limit') || '100')
      const eventType = url.searchParams.get('type')
      const userId = url.searchParams.get('userId')
      const failedOnly = url.searchParams.get('failed') === 'true'

      let events
      if (eventType) {
        events = auditLogger.getEventsByType(eventType, limit)
      } else if (userId) {
        events = auditLogger.getEventsByUser(userId, limit)
      } else if (failedOnly) {
        events = auditLogger.getFailedEvents(limit)
      } else {
        events = auditLogger.getRecentEvents(limit)
      }

      return NextResponse.json({ events })

    case 'alerts':
      const anomalies = detectAnomalousActivity()
      return NextResponse.json({
        alerts: anomalies.alerts,
        suspiciousIPs: anomalies.suspiciousIPs,
        suspiciousUsers: anomalies.suspiciousUsers
      })

    default:
      // Return overview
      return NextResponse.json({
        metrics: auditLogger.getSecurityMetrics(),
        recentEvents: auditLogger.getRecentEvents(20),
        anomalies: detectAnomalousActivity()
      })
  }
})