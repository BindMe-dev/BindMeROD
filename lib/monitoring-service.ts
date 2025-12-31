/**
 * Monitoring & Error Tracking Service
 * Centralized logging and error tracking
 * 
 * Setup for Production:
 * 1. Sign up for Sentry (sentry.io)
 * 2. Add NEXT_PUBLIC_SENTRY_DSN to .env
 * 3. Install: npm install @sentry/nextjs
 * 4. Run: npx @sentry/wizard@latest -i nextjs
 */

// Types
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  timestamp: Date
  userId?: string
  requestId?: string
  stack?: string
}

export interface ErrorReport {
  error: Error
  context?: Record<string, any>
  userId?: string
  severity?: "low" | "medium" | "high" | "critical"
}

/**
 * Log to console (dev) or external service (production)
 */
export function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date(),
  }

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      fatal: "💀",
    }

    console.log(`${emoji[level]} [${level.toUpperCase()}] ${message}`, context || "")
    return
  }

  // In production, send to external service
  // TODO: Integrate with Sentry, Datadog, or similar
  sendToMonitoringService(entry)
}

/**
 * Report error to monitoring service
 */
export function reportError(report: ErrorReport) {
  const { error, context, userId, severity = "medium" } = report

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error Report:", {
      message: error.message,
      stack: error.stack,
      context,
      userId,
      severity,
    })
    return
  }

  // In production, send to Sentry or similar
  // TODO: Integrate with Sentry
  sendErrorToSentry(error, { context, userId, severity })
}

/**
 * Track performance metric
 */
export function trackPerformance(
  metric: string,
  value: number,
  unit: "ms" | "bytes" | "count" = "ms",
  tags?: Record<string, string>
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`📊 Performance: ${metric} = ${value}${unit}`, tags || "")
    return
  }

  // TODO: Send to monitoring service
  sendMetricToMonitoringService({ metric, value, unit, tags })
}

/**
 * Track user action for analytics
 */
export function trackEvent(
  event: string,
  properties?: Record<string, any>,
  userId?: string
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`📈 Event: ${event}`, { properties, userId })
    return
  }

  // TODO: Send to analytics service (Mixpanel, Amplitude, etc.)
  sendEventToAnalytics({ event, properties, userId })
}

/**
 * Health check endpoint data
 */
export async function getHealthStatus(): Promise<{
  status: "healthy" | "degraded" | "unhealthy"
  checks: Record<string, boolean>
  timestamp: Date
}> {
  const checks: Record<string, boolean> = {}

  // Check database connection
  try {
    // TODO: Implement actual DB health check
    checks.database = true
  } catch (error) {
    checks.database = false
  }

  // Check external services
  checks.email = true // TODO: Check email service
  checks.storage = true // TODO: Check file storage

  const allHealthy = Object.values(checks).every((v) => v)
  const someHealthy = Object.values(checks).some((v) => v)

  return {
    status: allHealthy ? "healthy" : someHealthy ? "degraded" : "unhealthy",
    checks,
    timestamp: new Date(),
  }
}

/**
 * Send log to monitoring service (placeholder)
 */
function sendToMonitoringService(entry: LogEntry) {
  // TODO: Implement actual integration
  // Example: Send to Datadog, CloudWatch, etc.
}

/**
 * Send error to Sentry (placeholder)
 */
function sendErrorToSentry(
  error: Error,
  metadata: {
    context?: Record<string, any>
    userId?: string
    severity?: string
  }
) {
  // TODO: Implement Sentry integration
  // Example:
  // Sentry.captureException(error, {
  //   user: { id: metadata.userId },
  //   extra: metadata.context,
  //   level: metadata.severity,
  // })
}

/**
 * Send metric to monitoring service (placeholder)
 */
function sendMetricToMonitoringService(metric: {
  metric: string
  value: number
  unit: string
  tags?: Record<string, string>
}) {
  // TODO: Implement actual integration
  // Example: Send to Datadog, CloudWatch, etc.
}

/**
 * Send event to analytics service (placeholder)
 */
function sendEventToAnalytics(event: {
  event: string
  properties?: Record<string, any>
  userId?: string
}) {
  // TODO: Implement analytics integration
  // Example: Mixpanel, Amplitude, PostHog, etc.
}

/**
 * Middleware helper to track API performance
 */
export function withPerformanceTracking<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = Date.now()

  return fn()
    .then((result) => {
      const duration = Date.now() - start
      trackPerformance(operationName, duration, "ms")
      return result
    })
    .catch((error) => {
      const duration = Date.now() - start
      trackPerformance(`${operationName}_error`, duration, "ms")
      reportError({ error, context: { operation: operationName } })
      throw error
    })
}

