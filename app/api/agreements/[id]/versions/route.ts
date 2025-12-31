import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { agreements } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'

/**
 * GET /api/agreements/[id]/versions
 * Get all versions of an agreement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agreementId = params.id
    const { searchParams } = new URL(request.url)
    const v1 = searchParams.get('v1')
    const v2 = searchParams.get('v2')

    // If requesting diff between two versions
    if (v1 && v2) {
      return handleDiffRequest(userId, v1, v2)
    }

    // Verify access to agreement
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
    })

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    // Fetch all versions (agreements with same parentAgreementId or this agreement's ID)
    const allVersions = await db.query.agreements.findMany({
      where: or(
        eq(agreements.id, agreementId),
        eq(agreements.parentAgreementId, agreementId),
        eq(agreements.parentAgreementId, agreement.parentAgreementId || '')
      ),
    })

    // Sort by version number
    const sortedVersions = allVersions
      .sort((a, b) => (a.version || 0) - (b.version || 0))
      .map(v => ({
        id: v.id,
        version: v.version,
        title: v.title,
        description: v.description,
        keyTerms: v.keyTerms,
        createdAt: v.createdAt,
        userId: v.userId,
        status: v.status,
        amendmentReason: v.amendmentReason,
      }))

    return NextResponse.json({ versions: sortedVersions })
  } catch (error) {
    console.error('Fetch versions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}

/**
 * Handle diff request between two versions
 */
async function handleDiffRequest(userId: string, v1Id: string, v2Id: string) {
  try {
    // Fetch both versions
    const [version1, version2] = await Promise.all([
      db.query.agreements.findFirst({ where: eq(agreements.id, v1Id) }),
      db.query.agreements.findFirst({ where: eq(agreements.id, v2Id) }),
    ])

    if (!version1 || !version2) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Compare fields and generate diff
    const changes: any[] = []

    const fieldsToCompare = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'keyTerms', label: 'Key Terms' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'notes', label: 'Notes' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'deadline', label: 'Deadline' },
    ]

    for (const field of fieldsToCompare) {
      const oldValue = (version1 as any)[field.key]
      const newValue = (version2 as any)[field.key]

      if (oldValue !== newValue) {
        let changeType: 'added' | 'removed' | 'modified' = 'modified'
        
        if (!oldValue && newValue) {
          changeType = 'added'
        } else if (oldValue && !newValue) {
          changeType = 'removed'
        }

        changes.push({
          field: field.label,
          type: changeType,
          oldValue: oldValue || undefined,
          newValue: newValue || undefined,
        })
      }
    }

    return NextResponse.json({ changes })
  } catch (error) {
    console.error('Diff generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate diff' },
      { status: 500 }
    )
  }
}
