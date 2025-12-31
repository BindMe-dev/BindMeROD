import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { deleteUserData, logDataAccess } from "@/lib/gdpr-service"

/**
 * Delete user data (GDPR Right to Erasure)
 * POST /api/gdpr/delete
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { confirmEmail, deleteType = "anonymize" } = body

    // Require email confirmation for safety
    if (!confirmEmail) {
      return NextResponse.json(
        { error: "Email confirmation required" },
        { status: 400 }
      )
    }

    // Log the deletion request
    await logDataAccess(
      userId,
      "delete",
      `User requested account deletion (type: ${deleteType})`
    )

    // Delete or anonymize user data
    const result = await deleteUserData(userId, {
      keepAgreements: true, // Keep for legal compliance
      keepAuditLogs: true, // Keep for compliance
      anonymize: deleteType === "anonymize",
    })

    return NextResponse.json({
      success: true,
      message:
        deleteType === "anonymize"
          ? "Your account has been anonymized"
          : "Your account has been deleted",
      deletedRecords: result.deletedRecords,
    })
  } catch (error) {
    console.error("Error deleting user data:", error)
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    )
  }
}

