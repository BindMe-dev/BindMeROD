import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { db } from './db'
import { agreements, legalSignatures, auditLogs } from './db/schema'
import { eq, desc } from 'drizzle-orm'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

interface PDFExportOptions {
  includeAuditTrail?: boolean
  watermarkType?: 'DRAFT' | 'COPY' | 'ORIGINAL' | null
  includeQRCode?: boolean
}

export class PDFGenerator {
  /**
   * Export agreement as PDF with optional watermarks and audit trail
   */
  static async generateAgreementPDF(
    agreementId: string,
    options: PDFExportOptions = {}
  ): Promise<Buffer> {
    const {
      includeAuditTrail = true,
      watermarkType = null,
      includeQRCode = true,
    } = options

    // Fetch agreement data
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
    })

    if (!agreement) {
      throw new Error(`Agreement ${agreementId} not found`)
    }

    // Fetch signatures
    const agreementSignatures = await db.query.legalSignatures.findMany({
      where: eq(legalSignatures.agreementId, agreementId),
    })

    // Fetch audit logs if requested
    let auditTrail: any[] = []
    if (includeAuditTrail) {
      auditTrail = await db.query.auditLogs.findMany({
        where: eq(auditLogs.agreementId, agreementId),
        orderBy: [desc(auditLogs.timestamp)],
      })
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Set document metadata
    pdf.setProperties({
      title: `Agreement: ${agreement.title}`,
      subject: 'BindMe Agreement Export',
      author: 'BindMe Platform',
      keywords: 'agreement, contract, bindme',
      creator: 'BindMe',
    })

    let currentPage = 1
    const pageHeight = pdf.internal.pageSize.height
    const pageWidth = pdf.internal.pageSize.width
    const margin = 20
    let yPosition = margin

    // Add watermark if specified
    if (watermarkType) {
      this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
    }

    // Add header with logo/branding
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(67, 56, 202) // Purple brand color
    pdf.text('BindMe Agreement', margin, yPosition)
    yPosition += 12

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Agreement ID: ${agreement.id}`, margin, yPosition)
    yPosition += 7
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition)
    yPosition += 15

    // Add agreement title and details
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(agreement.title, margin, yPosition)
    yPosition += 12

    // Add agreement status badge
    const statusColor = this.getStatusColor(agreement.status)
    pdf.setFillColor(statusColor.r, statusColor.g, statusColor.b)
    pdf.roundedRect(margin, yPosition - 5, 30, 8, 2, 2, 'F')
    pdf.setFontSize(10)
    pdf.setTextColor(255, 255, 255)
    pdf.text(agreement.status.toUpperCase(), margin + 3, yPosition)
    yPosition += 15

    pdf.setTextColor(0, 0, 0)

    // Add agreement details
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    
    if (agreement.description) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Description:', margin, yPosition)
      yPosition += 6
      pdf.setFont('helvetica', 'normal')
      const descLines = pdf.splitTextToSize(agreement.description, pageWidth - 2 * margin)
      pdf.text(descLines, margin, yPosition)
      yPosition += descLines.length * 5 + 8
    }

    if (agreement.keyTerms) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Key Terms:', margin, yPosition)
      yPosition += 6
      pdf.setFont('helvetica', 'normal')
      const termsLines = pdf.splitTextToSize(agreement.keyTerms, pageWidth - 2 * margin)
      pdf.text(termsLines, margin, yPosition)
      yPosition += termsLines.length * 5 + 8
    }

    // Add metadata section
    yPosition += 5
    pdf.setFont('helvetica', 'bold')
    pdf.text('Agreement Information:', margin, yPosition)
    yPosition += 8

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    
    const infoFields = [
      { label: 'Type', value: agreement.type },
      { label: 'Category', value: agreement.category || 'N/A' },
      { label: 'Priority', value: agreement.priority || 'medium' },
      { label: 'Start Date', value: agreement.startDate || 'N/A' },
      { label: 'Deadline', value: agreement.deadline || 'N/A' },
    ]

    for (const field of infoFields) {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = margin
        if (watermarkType) {
          this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
        }
      }
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${field.label}: `, margin, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(field.value, margin + 35, yPosition)
      yPosition += 6
    }

    // Add signatures section
    if (agreementSignatures.length > 0) {
      yPosition += 10
      
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = margin
        if (watermarkType) {
          this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
        }
      }

      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Signatures', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      for (const signature of agreementSignatures) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = margin
          if (watermarkType) {
            this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
          }
        }

        // Draw signature box
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35)

        yPosition += 8
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Signed by: ${signature.signedByName || 'Unknown'}`, margin + 5, yPosition)
        yPosition += 6
        
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Email: ${signature.signedByEmail || 'N/A'}`, margin + 5, yPosition)
        yPosition += 6
        
        if (signature.timestamp) {
          pdf.text(`Date: ${new Date(signature.timestamp).toLocaleString()}`, margin + 5, yPosition)
          yPosition += 6
        }
        
        if (signature.ipAddress) {
          pdf.text(`IP Address: ${signature.ipAddress}`, margin + 5, yPosition)
          yPosition += 6
        }

        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(9)
        pdf.text('Electronically signed via BindMe platform', margin + 5, yPosition)
        
        yPosition += 15
      }
    }

    // Add QR code linking to original agreement
    if (includeQRCode) {
      yPosition += 10
      
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = margin
        if (watermarkType) {
          this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
        }
      }

      try {
        const agreementUrl = `${APP_URL}/agreement/${agreementId}`
        const qrCodeDataUrl = await QRCode.toDataURL(agreementUrl, {
          width: 200,
          margin: 1,
        })

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Verify Agreement Online:', margin, yPosition)
        yPosition += 8

        pdf.addImage(qrCodeDataUrl, 'PNG', margin, yPosition, 40, 40)
        
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Scan to verify this agreement', margin + 45, yPosition + 15)
        pdf.text(`or visit: ${agreementUrl}`, margin + 45, yPosition + 22)
        
        yPosition += 50
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }

    // Add audit trail page
    if (includeAuditTrail && auditTrail.length > 0) {
      pdf.addPage()
      yPosition = margin
      
      if (watermarkType) {
        this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
      }

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Audit Trail', margin, yPosition)
      yPosition += 12

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')

      for (const log of auditTrail) {
        if (yPosition > pageHeight - 25) {
          pdf.addPage()
          yPosition = margin
          if (watermarkType) {
            this.addWatermark(pdf, watermarkType, pageWidth, pageHeight)
          }
        }

        const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${timestamp}`, margin, yPosition)
        yPosition += 5
        
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Action: ${log.action}`, margin + 5, yPosition)
        yPosition += 5
        
        if (log.userId) {
          pdf.text(`User: ${log.userId}`, margin + 5, yPosition)
          yPosition += 5
        }
        
        if (log.ipAddress) {
          pdf.text(`IP: ${log.ipAddress}`, margin + 5, yPosition)
          yPosition += 5
        }
        
        yPosition += 3
      }
    }

    // Add footer to all pages
    const pageCount = pdf.internal.pages.length - 1 // -1 because first element is null
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(150, 150, 150)
      pdf.text(
        `Page ${i} of ${pageCount} • Generated by BindMe • ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // Return PDF as buffer
    return Buffer.from(pdf.output('arraybuffer'))
  }

  /**
   * Add watermark to PDF page
   */
  private static addWatermark(
    pdf: jsPDF,
    watermarkType: 'DRAFT' | 'COPY' | 'ORIGINAL',
    pageWidth: number,
    pageHeight: number
  ): void {
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.1 }))
    
    pdf.setFontSize(80)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(200, 200, 200)
    
    // Rotate and center watermark
    const centerX = pageWidth / 2
    const centerY = pageHeight / 2
    
    pdf.text(watermarkType, centerX, centerY, {
      align: 'center',
      angle: 45,
    })
    
    pdf.restoreGraphicsState()
  }

  /**
   * Get color for agreement status
   */
  private static getStatusColor(status: string): { r: number; g: number; b: number } {
    const colors: Record<string, { r: number; g: number; b: number }> = {
      draft: { r: 156, g: 163, b: 175 }, // gray
      pending_signature: { r: 251, g: 191, b: 36 }, // yellow
      active: { r: 34, g: 197, b: 94 }, // green
      completed: { r: 59, g: 130, b: 246 }, // blue
      disputed: { r: 239, g: 68, b: 68 }, // red
      cancelled: { r: 249, g: 115, b: 22 }, // orange
    }
    
    return colors[status] || { r: 156, g: 163, b: 175 }
  }

  /**
   * Generate PDF with DRAFT watermark for unsigned agreements
   */
  static async generateDraftPDF(agreementId: string): Promise<Buffer> {
    return this.generateAgreementPDF(agreementId, {
      watermarkType: 'DRAFT',
      includeAuditTrail: false,
      includeQRCode: false,
    })
  }

  /**
   * Generate PDF with COPY watermark for downloads
   */
  static async generateCopyPDF(agreementId: string): Promise<Buffer> {
    return this.generateAgreementPDF(agreementId, {
      watermarkType: 'COPY',
      includeAuditTrail: true,
      includeQRCode: true,
    })
  }

  /**
   * Generate PDF without watermark for official records
   */
  static async generateOriginalPDF(agreementId: string): Promise<Buffer> {
    return this.generateAgreementPDF(agreementId, {
      watermarkType: null,
      includeAuditTrail: true,
      includeQRCode: true,
    })
  }
}
