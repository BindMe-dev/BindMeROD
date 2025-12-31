import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { agreements } from '@/lib/db/schema'
import { nanoid } from 'nanoid'
import { NotificationService } from '@/lib/notifications'

interface BulkRecipient {
  name: string
  email: string
}

interface BulkAgreementData {
  title: string
  description?: string
  keyTerms?: string
  type?: string
  category?: string
}

/**
 * POST /api/agreements/bulk-create
 * Create multiple agreements with the same content for different recipients
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agreementData, recipients } = body as {
      agreementData: BulkAgreementData
      recipients: BulkRecipient[]
    }

    // Validate input
    if (!agreementData?.title) {
      return NextResponse.json(
        { error: 'Agreement title is required' },
        { status: 400 }
      )
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    if (recipients.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 recipients allowed per bulk operation' },
        { status: 400 }
      )
    }

    // Create agreements for each recipient
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        try {
          const agreementId = nanoid()

          // Create agreement
          const [agreement] = await db
            .insert(agreements)
            .values({
              id: agreementId,
              userId,
              title: agreementData.title,
              description: agreementData.description || null,
              keyTerms: agreementData.keyTerms || null,
              type: agreementData.type || 'contract',
              category: agreementData.category || null,
              status: 'draft',
              betOpponentName: recipient.name,
              betOpponentEmail: recipient.email,
              version: 1,
              createdAt: new Date(),
            })
            .returning()

          // Send notification to recipient
          try {
            await NotificationService.sendEmailNotification(
              {
                agreementId: agreement.id,
                agreementTitle: agreement.title,
                actorName: 'Creator',
                actorId: userId,
                recipientEmail: recipient.email,
                recipientName: recipient.name,
              },
              'sent_for_signature'
            )
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError)
            // Don't fail the whole operation if email fails
          }

          return {
            success: true,
            agreementId: agreement.id,
            recipient: recipient.email,
          }
        } catch (error) {
          console.error(`Failed to create agreement for ${recipient.email}:`, error)
          return {
            success: false,
            recipient: recipient.email,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    // Process results
    const processedResults = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Failed to create agreement',
        }
      }
    })

    const successCount = processedResults.filter(r => r.success).length
    const failureCount = processedResults.filter(r => !r.success).length

    return NextResponse.json({
      message: `Created ${successCount} agreements successfully, ${failureCount} failed`,
      results: processedResults,
      summary: {
        total: recipients.length,
        success: successCount,
        failed: failureCount,
      },
    })
  } catch (error) {
    console.error('Bulk create error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create agreements',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
