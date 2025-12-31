import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lawFirmConsultations, lawFirms, agreements, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-service"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Request a consultation with a law firm
 * POST /api/consultations/request
 * 
 * Body:
 * - firmId: string (required)
 * - agreementId: string (optional)
 * - message: string (required)
 * - preferredDate: string (optional ISO date)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { firmId, agreementId, message, preferredDate } = body

    // Validate required fields
    if (!firmId || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: firmId, message" },
        { status: 400 }
      )
    }

    // Verify law firm exists and is active
    const firm = await db.query.lawFirms.findFirst({
      where: eq(lawFirms.id, firmId),
    })

    if (!firm) {
      return NextResponse.json({ error: "Law firm not found" }, { status: 404 })
    }

    if (firm.status !== "active") {
      return NextResponse.json(
        { error: "This law firm is not currently accepting consultations" },
        { status: 400 }
      )
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If agreementId provided, verify it exists and user has access
    let agreement = null
    if (agreementId) {
      agreement = await db.query.agreements.findFirst({
        where: eq(agreements.id, agreementId),
      })

      if (!agreement) {
        return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
      }

      if (agreement.creatorId !== userId && agreement.counterpartyId !== userId) {
        return NextResponse.json(
          { error: "You don't have access to this agreement" },
          { status: 403 }
        )
      }
    }

    // Create consultation request
    const consultationId = randomUUID()
    await db.insert(lawFirmConsultations).values({
      id: consultationId,
      firmId,
      userId,
      agreementId: agreementId || null,
      message: message.trim(),
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send email to law firm
    const firmEmail = {
      subject: `New Consultation Request from ${user.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-bottom: 20px;">📋 New Consultation Request</h2>
            <p style="color: #475569; line-height: 1.6;">You have received a new consultation request:</p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>From:</strong> ${user.name} (${user.email})</p>
              ${agreement ? `<p style="margin: 8px 0;"><strong>Regarding:</strong> ${agreement.title}</p>` : ""}
              ${preferredDate ? `<p style="margin: 8px 0;"><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleString()}</p>` : ""}
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Case Details:</strong></p>
              <p style="margin: 10px 0 0 0; color: #78350f; white-space: pre-wrap;">${message.trim()}</p>
            </div>

            <a href="${APP_URL}/firm/consultations/${consultationId}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
              Review Request
            </a>

            <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
              Please respond within 24-48 hours to maintain your firm's response rate.
            </p>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            BindMe - Legal Services Platform
          </p>
        </div>
      `,
    }

    await sendEmail({
      to: firm.email,
      subject: firmEmail.subject,
      html: firmEmail.html,
    })

    // Send confirmation email to user
    const userEmail = {
      subject: `Consultation Request Sent to ${firm.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-bottom: 20px;">✅ Request Sent Successfully</h2>
            <p style="color: #475569; line-height: 1.6;">Your consultation request has been sent to <strong>${firm.name}</strong>.</p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Law Firm:</strong> ${firm.name}</p>
              ${agreement ? `<p style="margin: 8px 0;"><strong>Regarding:</strong> ${agreement.title}</p>` : ""}
              <p style="margin: 8px 0;"><strong>Status:</strong> Pending Review</p>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>What happens next?</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a;">
                <li>The law firm will review your request within 24-48 hours</li>
                <li>You'll receive an email when they respond</li>
                <li>If accepted, you can schedule your consultation</li>
              </ul>
            </div>

            ${agreement ? `
              <a href="${APP_URL}/agreement/${agreementId}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
                View Agreement
              </a>
            ` : `
              <a href="${APP_URL}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
                Go to Dashboard
              </a>
            `}

            <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
              We'll notify you as soon as the firm responds.
            </p>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            BindMe - Secure Agreement Management
          </p>
        </div>
      `,
    }

    await sendEmail({
      to: user.email,
      subject: userEmail.subject,
      html: userEmail.html,
    })

    return NextResponse.json({
      success: true,
      consultationId,
      message: "Consultation request sent successfully",
    })
  } catch (error: any) {
    console.error("Error creating consultation request:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create consultation request" },
      { status: 500 }
    )
  }
}

