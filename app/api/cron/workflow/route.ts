import { NextRequest, NextResponse } from "next/server"
import { runWorkflowEngine } from "@/lib/workflow-engine"

/**
 * Cron endpoint for running automated workflows
 * Should be called periodically (e.g., every hour) by a cron service
 * 
 * For Vercel: Configure in vercel.json
 * For other platforms: Use external cron service (e.g., cron-job.org)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET || "dev-secret"
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run workflow engine
    await runWorkflowEngine()

    return NextResponse.json({ 
      success: true, 
      message: "Workflow engine executed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron workflow error:", error)
    return NextResponse.json(
      { error: "Workflow execution failed" },
      { status: 500 }
    )
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}

