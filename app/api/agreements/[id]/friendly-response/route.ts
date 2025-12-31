import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, notifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { response, conditions } = await request.json()

    if (!["accepted", "conditional", "rejected"].includes(response)) {
      return NextResponse.json({ error: "Invalid response type" }, { status: 400 })
    }

    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, id),
      with: { user: true, sharedWith: true }
    })

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    let newStatus = agreement.status
    let updateData: any = {
      friendlyArrangementResponse: response,
      friendlyArrangementResponseBy: "current-user", // Should be actual user ID
      friendlyArrangementResponseAt: new Date(),
    }

    if (response === "accepted") {
      // Full acceptance - mark as resolved
      newStatus = "completed"
      updateData = {
        ...updateData,
        status: "completed",
        friendlyArrangementAccepted: true,
        friendlyArrangementAcceptedBy: "current-user",
        friendlyArrangementAcceptedAt: new Date(),
        friendlyArrangementFinalTerms: agreement.friendlyArrangementTerms,
        completedAt: new Date(),
      }
    } else if (response === "conditional") {
      // Conditional acceptance - continue negotiation
      newStatus = "friendly_arrangement_negotiation"
      updateData = {
        ...updateData,
        status: "friendly_arrangement_negotiation",
        friendlyArrangementConditions: conditions,
        friendlyArrangementNegotiationRound: (agreement.friendlyArrangementNegotiationRound || 1) + 1,
      }
    } else if (response === "rejected") {
      // Rejection - trigger legal resolution
      const caseNumber = `LC-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`
      newStatus = "legal_resolution"
      updateData = {
        ...updateData,
        status: "legal_resolution",
        legalResolutionTriggered: true,
        legalResolutionTriggeredBy: "current-user",
        legalResolutionTriggeredAt: new Date(),
        legalCaseNumber: caseNumber,
      }
    }

    // Update agreement
    await db.update(agreements).set(updateData).where(eq(agreements.id, id))

    // Create audit log
    await db.insert(auditLogs).values({
      id: nanoid(),
      agreementId: id,
      action: `Friendly Arrangement ${response.charAt(0).toUpperCase() + response.slice(1)}`,
      performedBy: "current-user",
      performedByEmail: "user@example.com",
      details: response === "conditional" 
        ? `Conditional acceptance with conditions: ${conditions}`
        : response === "accepted"
        ? "Friendly arrangement fully accepted"
        : "Friendly arrangement rejected - legal resolution triggered",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    })

    // Send notifications based on response
    if (response === "accepted") {
      // Notify all parties of resolution
      const notificationPromises = [agreement.user, ...agreement.sharedWith].map(party => 
        db.insert(notifications).values({
          id: nanoid(),
          userId: party.id,
          type: "friendly_resolution",
          title: "Agreement Resolved",
          message: `The friendly arrangement for "${agreement.title}" has been accepted and the agreement is now complete.`,
          agreementId: id,
        })
      )
      await Promise.all(notificationPromises)
    } else if (response === "conditional") {
      // Notify proposer of conditional acceptance
      await db.insert(notifications).values({
        id: nanoid(),
        userId: agreement.friendlyArrangementProposedBy || agreement.userId,
        type: "friendly_arrangement_conditional",
        title: "Conditional Response to Arrangement",
        message: `Your friendly arrangement proposal has received a conditional response. Review the conditions and decide how to proceed.`,
        agreementId: id,
      })
    } else if (response === "rejected") {
      // Notify all parties of legal resolution
      const notificationPromises = [agreement.user, ...agreement.sharedWith].map(party => 
        db.insert(notifications).values({
          id: nanoid(),
          userId: party.id,
          type: "legal_resolution",
          title: "Legal Resolution Initiated",
          message: `The friendly arrangement was rejected. Legal resolution has been triggered for "${agreement.title}". Case: ${updateData.legalCaseNumber}`,
          agreementId: id,
        })
      )
      await Promise.all(notificationPromises)
    }

    return NextResponse.json({ success: true, newStatus, caseNumber: updateData.legalCaseNumber })

  } catch (error) {
    console.error("Friendly arrangement response failed:", error)
    return NextResponse.json({ error: "Failed to process response" }, { status: 500 })
  }
}