import { NextRequest } from "next/server"
import { getClientIP } from "./auth-security"

export interface AuditEvent {
  timestamp: Date
  eventType: string
  userId?: string
  email?: string
  ip: string
  userAgent: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  success: boolean
}

// In production, this would be sent to a logging service like DataDog, Sentry, etc.
class AuditLogger {
  private events: AuditEvent[] = []
  private maxEvents = 10000 // Keep last 10k events in memory

  log(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    }

    this.events.push(auditEvent)
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console logging with appropriate level
    const logLevel = this.getLogLevel(event.severity)
    const message = `[AUDIT] ${event.eventType} - ${event.success ? 'SUCCESS' : 'FAILURE'}`
    
    console[logLevel](message, {
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      details: event.details
    })

    // Alert on critical events
    if (event.severity === 'critical') {
      this.alertCriticalEvent(auditEvent)
    }
  }

  private getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      default:
        return 'log'
    }
  }

  private alertCriticalEvent(event: AuditEvent): void {
    // In production, send to alerting system (PagerDuty, Slack, etc.)
    console.error('🚨 CRITICAL SECURITY EVENT 🚨', event)
  }

  getRecentEvents(limit: number = 100): AuditEvent[] {
    return this.events.slice(-limit)
  }

  getEventsByType(eventType: string, limit: number = 100): AuditEvent[] {
    return this.events
      .filter(event => event.eventType === eventType)
      .slice(-limit)
  }

  getEventsByUser(userId: string, limit: number = 100): AuditEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit)
  }

  getFailedEvents(limit: number = 100): AuditEvent[] {
    return this.events
      .filter(event => !event.success)
      .slice(-limit)
  }

  getSecurityMetrics(): {
    totalEvents: number
    failedEvents: number
    criticalEvents: number
    recentFailures: number
    topFailureTypes: Array<{ type: string; count: number }>
  } {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    const recentEvents = this.events.filter(
      event => event.timestamp.getTime() > oneHourAgo
    )
    
    const failedEvents = this.events.filter(event => !event.success)
    const criticalEvents = this.events.filter(event => event.severity === 'critical')
    const recentFailures = recentEvents.filter(event => !event.success)
    
    // Count failure types
    const failureTypes = new Map<string, number>()
    failedEvents.forEach(event => {
      const count = failureTypes.get(event.eventType) || 0
      failureTypes.set(event.eventType, count + 1)
    })
    
    const topFailureTypes = Array.from(failureTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalEvents: this.events.length,
      failedEvents: failedEvents.length,
      criticalEvents: criticalEvents.length,
      recentFailures: recentFailures.length,
      topFailureTypes
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

// Helper functions for common audit events
export function logAuthEvent(
  eventType: 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION',
  request: NextRequest,
  success: boolean,
  userId?: string,
  email?: string,
  details: Record<string, any> = {}
): void {
  auditLogger.log({
    eventType,
    userId,
    email,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    details,
    severity: success ? 'low' : 'medium',
    success
  })
}

export function logSecurityEvent(
  eventType: string,
  request: NextRequest,
  severity: 'low' | 'medium' | 'high' | 'critical',
  userId?: string,
  email?: string,
  details: Record<string, any> = {}
): void {
  auditLogger.log({
    eventType,
    userId,
    email,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    details,
    severity,
    success: false
  })
}

export function logDataEvent(
  eventType: 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'DATA_DELETION' | 'DATA_EXPORT',
  request: NextRequest,
  success: boolean,
  userId: string,
  email?: string,
  details: Record<string, any> = {}
): void {
  auditLogger.log({
    eventType,
    userId,
    email,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    details,
    severity: success ? 'low' : 'high',
    success
  })
}

export function logSystemEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any> = {}
): void {
  auditLogger.log({
    eventType,
    ip: 'system',
    userAgent: 'system',
    details,
    severity,
    success: true
  })
}

// Security monitoring functions
export function detectAnomalousActivity(): {
  suspiciousIPs: string[]
  suspiciousUsers: string[]
  alerts: string[]
} {
  const recentEvents = auditLogger.getRecentEvents(1000)
  const now = Date.now()
  const oneHourAgo = now - (60 * 60 * 1000)
  
  const recentFailures = recentEvents.filter(
    event => !event.success && event.timestamp.getTime() > oneHourAgo
  )
  
  // Detect suspicious IPs (multiple failures)
  const ipFailures = new Map<string, number>()
  recentFailures.forEach(event => {
    const count = ipFailures.get(event.ip) || 0
    ipFailures.set(event.ip, count + 1)
  })
  
  const suspiciousIPs = Array.from(ipFailures.entries())
    .filter(([_, count]) => count >= 5)
    .map(([ip, _]) => ip)
  
  // Detect suspicious users (multiple failures)
  const userFailures = new Map<string, number>()
  recentFailures.forEach(event => {
    if (event.userId) {
      const count = userFailures.get(event.userId) || 0
      userFailures.set(event.userId, count + 1)
    }
  })
  
  const suspiciousUsers = Array.from(userFailures.entries())
    .filter(([_, count]) => count >= 3)
    .map(([userId, _]) => userId)
  
  // Generate alerts
  const alerts: string[] = []
  
  if (suspiciousIPs.length > 0) {
    alerts.push(`${suspiciousIPs.length} suspicious IP(s) detected with multiple failures`)
  }
  
  if (suspiciousUsers.length > 0) {
    alerts.push(`${suspiciousUsers.length} user account(s) with multiple failures`)
  }
  
  const criticalEvents = recentEvents.filter(
    event => event.severity === 'critical' && event.timestamp.getTime() > oneHourAgo
  )
  
  if (criticalEvents.length > 0) {
    alerts.push(`${criticalEvents.length} critical security event(s) in the last hour`)
  }
  
  return {
    suspiciousIPs,
    suspiciousUsers,
    alerts
  }
}

// Export the logger instance for direct use
export { auditLogger as default }