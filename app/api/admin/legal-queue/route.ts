/**
 * Legal Resolution Queue API
 * 
 * WHY: Provides admins with a real-time view of agreements that need legal assignment.
 * This is the bridge between user disputes and law firm intervention.
 * 
 * BUSINESS LOGIC:
 * 1. Fetch all agreements with status 'disputed' or 'pending_legal'
 * 2. Calculate priority based on:
 *    - Agreement value (higher = more urgent)
 *    - Days in queue (longer = more urgent)
 *    - User tier (premium users = higher priority)
 * 3. Suggest best-match law firms using AI algorithm
 * 
 * MATCHING ALGORITHM:
 * - Practice area match (40 points)
 * - Success rate (30 points)
 * - Availability (15 points)
 * - User location proximity (10 points)
 * - Price tier match (5 points)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, lawFirms, lawFirmAssignments } from "@/lib/db/schema"
import { eq, and, or, isNull, sql } from "drizzle-orm"

// Helper to check admin auth
async function requireAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")
  if (!sessionCookie) {
    return { ok: false, status: 401 }
  }

  try {
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
      headers: { Cookie: `session=${sessionCookie.value}` },
    })
    const sessionData = await sessionRes.json()
    
    if (!sessionData.user?.isAdmin) {
      return { ok: false, status: 403 }
    }
    
    return { ok: true, user: sessionData.user }
  } catch {
    return { ok: false, status: 401 }
  }
}

// Calculate priority score
function calculatePriority(agreement: any): 'urgent' | 'high' | 'medium' | 'low' {
  const value = parseFloat(agreement.betAmount || '0')
  const daysInQueue = Math.floor(
    (Date.now() - new Date(agreement.disputedAt || agreement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  let score = 0
  
  // Value-based scoring
  if (value > 10000) score += 40
  else if (value > 5000) score += 30
  else if (value > 1000) score += 20
  else score += 10

  // Time-based scoring
  if (daysInQueue > 14) score += 40
  else if (daysInQueue > 7) score += 30
  else if (daysInQueue > 3) score += 20
  else score += 10

  // Priority mapping
  if (score >= 70) return 'urgent'
  if (score >= 50) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

// Match law firms to agreement
function matchLawFirms(agreement: any, firms: any[]) {
  const agreementType = agreement.type?.toLowerCase() || ''
  const agreementValue = parseFloat(agreement.betAmount || '0')

  return firms
    .map((firm) => {
      let score = 0
      let reasons: string[] = []

      // Practice area match (40 points)
      const practiceAreas = firm.practiceAreas || []
      if (agreementType.includes('loan') || agreementType.includes('debt')) {
        if (practiceAreas.includes('Debt Recovery')) {
          score += 40
          reasons.push('Specializes in debt recovery')
        } else if (practiceAreas.includes('Contract Law')) {
          score += 30
          reasons.push('Contract law expertise')
        }
      } else if (agreementType.includes('service') || agreementType.includes('contract')) {
        if (practiceAreas.includes('Contract Law')) {
          score += 40
          reasons.push('Contract law specialist')
        }
      } else if (agreementType.includes('property')) {
        if (practiceAreas.includes('Property Disputes')) {
          score += 40
          reasons.push('Property dispute expert')
        }
      }

      // Success rate (30 points)
      const successRate = firm.successRate || 0
      if (successRate >= 90) {
        score += 30
        reasons.push(`${successRate}% success rate`)
      } else if (successRate >= 80) {
        score += 25
      } else if (successRate >= 70) {
        score += 20
      }

      // Availability (15 points)
      const activeCases = firm.activeCases || 0
      if (activeCases < 5) {
        score += 15
        reasons.push('Available capacity')
      } else if (activeCases < 10) {
        score += 10
      } else if (activeCases < 15) {
        score += 5
      }

      // User rating (10 points)
      const rating = firm.userRating || 0
      if (rating >= 4.5) {
        score += 10
        reasons.push(`High rating (${rating.toFixed(1)}★)`)
      } else if (rating >= 4.0) {
        score += 7
      } else if (rating >= 3.5) {
        score += 5
      }

      // Response time (5 points)
      const responseTime = firm.avgResponseTimeHours || 24
      if (responseTime < 4) {
        score += 5
        reasons.push('Fast response time')
      } else if (responseTime < 8) {
        score += 3
      }

      return {
        firmId: firm.id,
        firmName: firm.name,
        matchScore: Math.min(score, 100),
        reason: reasons.slice(0, 2).join(', ') || 'General practice',
      }
    })
    .filter((match) => match.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  }

  try {
    // Fetch agreements needing legal assignment
    // Note: You'll need to add a 'disputedAt' column to track when dispute started
    const disputedAgreements = await db
      .select()
      .from(agreements)
      .where(
        and(
          or(
            eq(agreements.status, 'disputed'),
            eq(agreements.status, 'pending_legal')
          ),
          // Not already assigned to a law firm
          isNull(
            db.select({ id: lawFirmAssignments.id })
              .from(lawFirmAssignments)
              .where(
                and(
                  eq(lawFirmAssignments.agreementId, agreements.id),
                  eq(lawFirmAssignments.active, true)
                )
              )
              .limit(1)
          )
        )
      )

    // Fetch all active law firms
    const activeFirms = await db
      .select()
      .from(lawFirms)
      .where(eq(lawFirms.status, 'active'))

    // Build queue with suggestions
    const queue = disputedAgreements.map((agreement) => ({
      id: agreement.id,
      title: agreement.title,
      type: agreement.type,
      value: parseFloat(agreement.betAmount || '0'),
      status: agreement.status,
      createdAt: agreement.createdAt?.toISOString(),
      disputedAt: agreement.createdAt?.toISOString(), // TODO: Add actual disputedAt column
      creatorEmail: agreement.userId, // TODO: Join with user table
      counterpartyEmail: agreement.betOpponentEmail || 'N/A',
      daysInQueue: Math.floor(
        (Date.now() - (agreement.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
      ),
      priority: calculatePriority(agreement),
      suggestedFirms: matchLawFirms(agreement, activeFirms),
    }))

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({ queue })
  } catch (error) {
    console.error('Error fetching legal queue:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

