/**
 * Assign Law Firm to Agreement API
 * 
 * WHY: This is the critical action that connects a disputed agreement with legal help.
 * When admin assigns a case, it triggers notifications to both the law firm and the user.
 * 
 * WORKFLOW:
 * 1. Admin selects agreement from queue
 * 2. Admin selects law firm (or uses AI suggestion)
 * 3. POST to this endpoint
 * 4. Create LawFirmAssignment record
 * 5. Send notification to law firm
 * 6. Send notification to user
 * 7. Update agreement status to 'pending_legal'
 * 
 * BUSINESS IMPACT:
 * - Faster case assignment = better user experience
 * - Proper tracking = accurate revenue reporting
 * - Notifications = higher engagement from law firms
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lawFirmAssignments, agreements, lawFirms, notifications } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { randomUUID } from "crypto"

async function requireAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")
  if (!sessionCookie) {
    return { ok: false, status: 401, user: null }
  }

  try {
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
      headers: { Cookie: `session=${sessionCookie.value}` },
    })
    const sessionData = await sessionRes.json()
    
    if (!sessionData.user?.isAdmin) {
      return { ok: false, status: 403, user: null }
    }
    
    return { ok: true, user: sessionData.user }
  } catch {
    return { ok: false, status: 401, user: null }
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { agreementId, firmId, serviceId, priority, notes } = body

    if (!agreementId || !firmId) {
      return NextResponse.json(
        { error: "Missing required fields: agreementId, firmId" },
        { status: 400 }
      )
    }

    // Verify agreement exists and is in correct status
    const [agreement] = await db
      .select()
      .from(agreements)
      .where(eq(agreements.id, agreementId))
      .limit(1)

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    if (!['disputed', 'pending_legal'].includes(agreement.status)) {
      return NextResponse.json(
        { error: "Agreement is not in disputed or pending_legal status" },
        { status: 400 }
      )
    }

    // Verify law firm exists and is active
    const [firm] = await db
      .select()
      .from(lawFirms)
      .where(eq(lawFirms.id, firmId))
      .limit(1)

    if (!firm) {
      return NextResponse.json({ error: "Law firm not found" }, { status: 404 })
    }

    if (firm.status !== 'active') {
      return NextResponse.json(
        { error: "Law firm is not active" },
        { status: 400 }
      )
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(lawFirmAssignments)
      .where(
        and(
          eq(lawFirmAssignments.agreementId, agreementId),
          eq(lawFirmAssignments.active, true)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Agreement is already assigned to a law firm" },
        { status: 400 }
      )
    }

    // Create assignment
    const assignmentId = randomUUID()
    const [assignment] = await db
      .insert(lawFirmAssignments)
      .values({
        id: assignmentId,
        firmId,
        agreementId,
        scope: 'legal_resolution',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Enhanced fields (if migration has been run)
        // @ts-ignore - these fields may not exist yet
        status: 'pending',
        priority: priority || 'medium',
        assignedBy: auth.user?.id,
        notes: notes || null,
      })
      .returning()

    // Update agreement status
    await db
      .update(agreements)
      .set({
        status: 'pending_legal',
        updatedAt: new Date(),
      })
      .where(eq(agreements.id, agreementId))

    // Update law firm active cases count
    await db
      .update(lawFirms)
      .set({
        // @ts-ignore
        activeCases: (firm.activeCases || 0) + 1,
        matters: (firm.matters || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(lawFirms.id, firmId))

    // Create notification for law firm contact
    // TODO: Send email to law firm
    const notificationId = randomUUID()
    await db.insert(notifications).values({
      id: notificationId,
      userId: firm.contact, // Assuming contact is a user ID
      type: 'law_firm_assignment',
      title: 'New Case Assignment',
      message: `You have been assigned a new case: ${agreement.title}`,
      link: `/law-firm/cases/${assignmentId}`,
      read: false,
      createdAt: new Date(),
    }).catch(() => {
      // Notification creation is non-critical
      console.log('Could not create notification for law firm')
    })

    // Create notification for agreement creator
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: agreement.userId,
      type: 'legal_help_assigned',
      title: 'Legal Help Assigned',
      message: `Your case has been assigned to ${firm.name}. They will review and contact you within ${firm.interventionSlaMinutes ? firm.interventionSlaMinutes / 60 : 24} hours.`,
      link: `/agreements/${agreementId}`,
      read: false,
      createdAt: new Date(),
    }).catch(() => {
      console.log('Could not create notification for user')
    })

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignmentId,
        agreementId,
        firmId,
        firmName: firm.name,
        status: 'pending',
      },
    })
  } catch (error) {
    console.error('Error assigning law firm:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

