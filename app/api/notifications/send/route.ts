import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, agreements } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/server-auth"
import {
  sendEmail,
  generateLawFirmAssignedEmail,
  generateNewCaseAssignmentEmail,
  generateDisputeNotificationEmail,
  generateReminderEmail,
} from "@/lib/email-service"

/**
 * Send notification emails
 * POST /api/notifications/send
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipientEmail, data } = body

    if (!type || !recipientEmail || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type, recipientEmail, data" },
        { status: 400 }
      )
    }

    let emailTemplate: { subject: string; html: string } | null = null

    switch (type) {
      case "law_firm_assigned":
        emailTemplate = generateLawFirmAssignedEmail(
          data.agreementTitle,
          data.agreementId,
          data.firmName
        )
        break

      case "new_case_assignment":
        emailTemplate = generateNewCaseAssignmentEmail(
          data.agreementTitle,
          data.agreementId,
          data.caseValue || 0
        )
        break

      case "dispute_notification":
        emailTemplate = generateDisputeNotificationEmail(
          data.agreementTitle,
          data.agreementId,
          data.disputedBy
        )
        break

      case "reminder":
        emailTemplate = generateReminderEmail(
          data.agreementTitle,
          data.agreementId,
          data.reminderType || "pending_signature"
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        )
    }

    if (!emailTemplate) {
      return NextResponse.json(
        { error: "Failed to generate email template" },
        { status: 500 }
      )
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}

