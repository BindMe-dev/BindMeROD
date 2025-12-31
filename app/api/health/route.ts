import { NextResponse } from "next/server"
import { getHealthStatus } from "@/lib/monitoring-service"
import { db } from "@/lib/db"

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Used by:
 * - Load balancers
 * - Uptime monitoring services (UptimeRobot, Pingdom)
 * - CI/CD pipelines
 */
export async function GET() {
  try {
    const checks: Record<string, boolean> = {}

    // Check database connection
    try {
      const result = await db.execute({ sql: "SELECT 1 as health", args: [] })
      // Verify we got a response and it's valid
      checks.database = result !== null && result !== undefined
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Database health check failed:", error)
      }
      checks.database = false
    }

    // Check environment variables
    checks.env = !!(
      process.env.DATABASE_URL &&
      process.env.JWT_SECRET
    )

    // Overall status
    const allHealthy = Object.values(checks).every((v) => v)
    const someHealthy = Object.values(checks).some((v) => v)

    const status = allHealthy ? "healthy" : someHealthy ? "degraded" : "unhealthy"
    const statusCode = allHealthy ? 200 : someHealthy ? 200 : 503

    return NextResponse.json(
      {
        status,
        checks,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      },
      { status: statusCode }
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Health check error:", error)
    }
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

