import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { agreements, auditLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import jsPDF from 'jspdf'

/**
 * GET /api/agreements/[id]/audit-export?format=pdf|csv
 * Export audit trail for an agreement
 */
export async function GET(
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
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

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
        { error: 'You do not have permission to export audit trail for this agreement' },
        { status: 403 }
      )
    }

    // Fetch audit logs
    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.agreementId, agreementId),
      orderBy: [desc(auditLogs.timestamp)],
    })

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(logs, agreement)
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-trail-${agreementId}.csv"`,
        },
      })
    } else {
      // Generate PDF
      const pdfBuffer = await generateAuditPDF(logs, agreement)
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="audit-trail-${agreementId}.pdf"`,
        },
      })
    }
  } catch (error) {
    console.error('Audit export error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export audit trail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate CSV format audit trail
 */
function generateCSV(logs: any[], agreement: any): string {
  const headers = ['Timestamp', 'Action', 'User ID', 'IP Address', 'User Agent', 'Details']
  const rows = [headers]

  for (const log of logs) {
    rows.push([
      log.timestamp ? new Date(log.timestamp).toISOString() : 'N/A',
      log.action || 'N/A',
      log.userId || 'N/A',
      log.ipAddress || 'N/A',
      log.userAgent || 'N/A',
      log.details ? JSON.stringify(log.details) : 'N/A',
    ])
  }

  return rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
}

/**
 * Generate PDF format audit trail
 */
async function generateAuditPDF(logs: any[], agreement: any): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height
  const margin = 15
  let yPosition = margin

  // Title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Audit Trail Report', margin, yPosition)
  yPosition += 10

  // Agreement details
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Agreement: ${agreement.title}`, margin, yPosition)
  yPosition += 7
  pdf.text(`Agreement ID: ${agreement.id}`, margin, yPosition)
  yPosition += 7
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition)
  yPosition += 15

  // Table header
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setFillColor(67, 56, 202)
  pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.text('Timestamp', margin + 2, yPosition)
  pdf.text('Action', margin + 50, yPosition)
  pdf.text('User', margin + 100, yPosition)
  yPosition += 8

  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'normal')

  // Table rows
  for (const log of logs) {
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      yPosition = margin
    }

    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'
    const action = log.action || 'N/A'
    const user = log.userId || 'N/A'

    pdf.text(timestamp, margin + 2, yPosition)
    pdf.text(action, margin + 50, yPosition)
    pdf.text(user.substring(0, 15), margin + 100, yPosition)
    yPosition += 6

    if (log.ipAddress) {
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`IP: ${log.ipAddress}`, margin + 5, yPosition)
      yPosition += 4
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
    }

    yPosition += 2
  }

  // Footer
  const pageCount = pdf.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Page ${i} of ${pageCount} • BindMe Audit Trail • ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return Buffer.from(pdf.output('arraybuffer'))
}
