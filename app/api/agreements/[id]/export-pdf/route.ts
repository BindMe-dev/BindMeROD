import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator } from '@/lib/pdf-generator'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { agreements } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const agreementId = params.id

    // Verify user has access to this agreement
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
    })

    if (!agreement) {
      return NextResponse.json(
        { error: 'Agreement not found' },
        { status: 404 }
      )
    }

    // Check if user is creator or counterparty
    const isCreator = agreement.userId === userId
    const isCounterparty = agreement.betOpponentEmail // TODO: Verify counterparty user ID
    
    if (!isCreator && !isCounterparty) {
      return NextResponse.json(
        { error: 'You do not have permission to export this agreement' },
        { status: 403 }
      )
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const { watermarkType = 'COPY' } = body

    // Generate PDF based on watermark type
    let pdfBuffer: Buffer
    
    switch (watermarkType) {
      case 'DRAFT':
        pdfBuffer = await PDFGenerator.generateDraftPDF(agreementId)
        break
      case 'ORIGINAL':
        // Only allow ORIGINAL for completed/active agreements and for creators
        if (!isCreator || !['active', 'completed'].includes(agreement.status)) {
          pdfBuffer = await PDFGenerator.generateCopyPDF(agreementId)
        } else {
          pdfBuffer = await PDFGenerator.generateOriginalPDF(agreementId)
        }
        break
      case 'COPY':
      default:
        pdfBuffer = await PDFGenerator.generateCopyPDF(agreementId)
        break
    }

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="agreement-${agreementId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
