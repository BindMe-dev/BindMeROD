import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { exportUserData, logDataAccess } from "@/lib/gdpr-service"

/**
 * Export user data (GDPR Right to Access)
 * GET /api/gdpr/export
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Export all user data
    const userData = await exportUserData(userId)

    // Log the access
    await logDataAccess(userId, "export", "User requested data export")

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="bindme-data-export-${userId}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting user data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}

