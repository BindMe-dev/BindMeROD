import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import jsPDF from "jspdf"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get complete agreement data
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, id),
      with: {
        user: true,
        sharedWith: true,
        legalSignatures: true,
        auditLogs: true,
        supportMessages: true,
        partners: true,
      }
    })

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // Create PDF
    const pdf = new jsPDF("p", "pt", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 40
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(fontSize)
      pdf.setFont("helvetica", isBold ? "bold" : "normal")
      
      const lines = pdf.splitTextToSize(text, contentWidth)
      const lineHeight = fontSize * 1.2
      
      // Check if we need a new page
      if (yPosition + (lines.length * lineHeight) > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage()
        yPosition = margin
      }
      
      pdf.text(lines, margin, yPosition)
      yPosition += lines.length * lineHeight + 10
    }

    const addSection = (title: string, content: string) => {
      addText(title, 14, true)
      addText(content, 12, false)
      yPosition += 10
    }

    // Header
    addText("LEGAL CASE DOCUMENTATION", 20, true)
    addText(`Case Number: ${agreement.legalCaseNumber || "N/A"}`, 14, true)
    addText(`Generated: ${new Date().toLocaleString()}`, 12, false)
    yPosition += 20

    // Agreement Overview
    addSection("AGREEMENT OVERVIEW", "")
    addText(`Title: ${agreement.title}`, 12, true)
    addText(`ID: ${agreement.id}`, 12, false)
    addText(`Type: ${agreement.type}`, 12, false)
    addText(`Status: ${agreement.status}`, 12, false)
    addText(`Created: ${new Date(agreement.createdAt).toLocaleString()}`, 12, false)
    addText(`Description: ${agreement.description || "Not provided"}`, 12, false)
    addText(`Purpose: ${agreement.purpose || "Not provided"}`, 12, false)
    addText(`Key Terms: ${agreement.keyTerms || "Not provided"}`, 12, false)
    addText(`Category: ${agreement.category || "Not specified"}`, 12, false)
    addText(`Tags: ${agreement.tags?.length ? agreement.tags.join(", ") : "None"}`, 12, false)
    addText(`Is Shared: ${agreement.isShared ? "Yes" : "No"}`, 12, false)
    addText(`Is Public: ${agreement.isPublic ? "Yes" : "No"}`, 12, false)
    addText(`Effective Date: ${agreement.effectiveDate || "Not set"}`, 12, false)
    addText(`End Date: ${agreement.endDate || (agreement.isPermanent ? "Permanent" : "Not set")}`, 12, false)
    addText(`Target Date: ${agreement.targetDate || "Not applicable"}`, 12, false)
    addText(`Start Date: ${agreement.startDate || "Not applicable"}`, 12, false)
    addText(`Deadline: ${agreement.deadline || "Not applicable"}`, 12, false)
    addText(`Recurrence Frequency: ${agreement.recurrenceFrequency || "Not applicable"}`, 12, false)
    addText(`Bet Stake: ${agreement.betStake || "Not applicable"}`, 12, false)
    addText(`Bet Amount: ${agreement.betAmount || "Not applicable"}`, 12, false)
    addText(`Bet Odds: ${agreement.betOdds || "Not applicable"}`, 12, false)
    addText(`Bet Opponent Name: ${agreement.betOpponentName || "Not applicable"}`, 12, false)
    addText(`Bet Opponent Email: ${agreement.betOpponentEmail || "Not applicable"}`, 12, false)
    addText(`Bet Settlement Date: ${agreement.betSettlementDate || "Not applicable"}`, 12, false)
    addText(`Bet Terms: ${agreement.betTerms || "Not applicable"}`, 12, false)
    addText(`Notes: ${agreement.notes || "None"}`, 12, false)
    addText(`Completed At: ${agreement.completedAt ? new Date(agreement.completedAt).toLocaleString() : "Not completed"}`, 12, false)
    addText(`Completed By: ${agreement.completedBy || "Not completed"}`, 12, false)

    // Parties Involved
    addSection("PARTIES INVOLVED", "")
    addText(`Creator: ${agreement.user.name} (${agreement.user.email})`, 12, false)
    
    const counterparties = agreement.sharedWith?.filter(p => p.role === "counterparty") || []
    if (counterparties.length > 0) {
      counterparties.forEach(cp => {
        addText(`Counterparty: ${cp.userName} (${cp.userEmail})`, 12, false)
      })
    } else {
      addText(`Counterparty: None designated`, 12, false)
    }
    
    const witnesses = agreement.sharedWith?.filter(p => p.role === "witness") || []
    if (witnesses.length > 0) {
      witnesses.forEach(w => {
        addText(`Witness: ${w.userName} (${w.userEmail})`, 12, false)
      })
    } else {
      addText(`Witness: None designated`, 12, false)
    }
    
    // Legal Information
    addSection("LEGAL INFORMATION", "")
    addText(`Legal Intent Accepted: ${agreement.legalIntentAccepted ? "Yes" : "No"}`, 12, false)
    addText(`Terms Accepted Version: ${agreement.termsAcceptedVersion || "Not specified"}`, 12, false)
    addText(`Jurisdiction Clause: ${agreement.jurisdictionClause || "Not specified"}`, 12, false)
    addText(`Email Confirmation Sent: ${agreement.emailConfirmationSent ? "Yes" : "No"}`, 12, false)
    addText(`Email Confirmation Timestamp: ${agreement.emailConfirmationTimestamp ? new Date(agreement.emailConfirmationTimestamp).toLocaleString() : "Not sent"}`, 12, false)
    addText(`Witness Required: ${agreement.witnessRequired ? "Yes" : "No"}`, 12, false)
    addText(`Witness Status: ${agreement.witnessStatus || "Not applicable"}`, 12, false)

    // Chronological Timeline
    addSection("CHRONOLOGICAL TIMELINE", "")
    
    const events = []
    
    // Agreement creation
    events.push({
      date: new Date(agreement.createdAt),
      event: "Agreement Created",
      details: `Agreement "${agreement.title}" created by ${agreement.user.name}`
    })

    // Signatures
    agreement.legalSignatures?.forEach(sig => {
      events.push({
        date: new Date(sig.timestamp),
        event: `${sig.role} Signature`,
        details: `Signed by ${sig.signedByName} (${sig.signedByEmail}) from IP ${sig.ipAddress}`
      })
    })

    // Completion attempts
    if (agreement.completedBy) {
      events.push({
        date: new Date(agreement.completedAt || new Date()),
        event: "Completion Requested",
        details: `Completion requested by user ID: ${agreement.completedBy}`
      })
    }

    // Rejection
    if (agreement.rejectionReason) {
      events.push({
        date: new Date(agreement.rejectedAt || new Date()),
        event: "Completion Rejected",
        details: `Rejected by ${agreement.rejectedBy}. Reason: ${agreement.rejectionReason}`
      })
    }

    // Dispute
    if (agreement.disputeReason) {
      events.push({
        date: new Date(agreement.disputedAt || new Date()),
        event: "Rejection Disputed",
        details: `Disputed by ${agreement.disputedBy}. Reason: ${agreement.disputeReason}`
      })
    }

    // Friendly arrangement
    if (agreement.friendlyArrangementProposed) {
      events.push({
        date: new Date(agreement.friendlyArrangementProposedAt || new Date()),
        event: "Friendly Arrangement Proposed",
        details: `Proposed by ${agreement.friendlyArrangementProposedBy}. Terms: ${agreement.friendlyArrangementTerms}`
      })
    }

    if (agreement.friendlyArrangementAccepted) {
      events.push({
        date: new Date(agreement.friendlyArrangementAcceptedAt || new Date()),
        event: "Friendly Arrangement Accepted",
        details: `Accepted by ${agreement.friendlyArrangementAcceptedBy}`
      })
    }

    // Legal resolution
    if (agreement.legalResolutionTriggered) {
      events.push({
        date: new Date(agreement.legalResolutionTriggeredAt || new Date()),
        event: "Legal Resolution Triggered",
        details: `Legal resolution initiated. Case number: ${agreement.legalCaseNumber}`
      })
    }

    // Audit logs
    agreement.auditLogs?.forEach(log => {
      events.push({
        date: new Date(log.timestamp),
        event: log.action,
        details: `${log.details} (by ${log.performedByEmail} from IP ${log.ipAddress})`
      })
    })

    // Sort events chronologically
    events.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Add timeline events
    events.forEach((event, index) => {
      addText(`${index + 1}. ${event.date.toLocaleString()} - ${event.event}`, 12, true)
      addText(`   ${event.details}`, 11, false)
    })

    // Support Messages
    if (agreement.supportMessages && agreement.supportMessages.length > 0) {
      addSection("SUPPORT MESSAGES", "")
      agreement.supportMessages
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .forEach((msg, index) => {
          addText(`${index + 1}. ${new Date(msg.timestamp).toLocaleString()} - ${msg.partnerName}`, 12, true)
          addText(`   "${msg.message}"`, 11, false)
        })
    }

    // Evidence Section
    const rejectionEvidence = agreement.rejectionEvidence || []
    const disputeEvidence = agreement.disputeEvidence || []
    
    if (Array.isArray(rejectionEvidence) && rejectionEvidence.length > 0 || Array.isArray(disputeEvidence) && disputeEvidence.length > 0) {
      addSection("EVIDENCE", "")
      
      if (Array.isArray(rejectionEvidence) && rejectionEvidence.length > 0) {
        addText("Rejection Evidence:", 12, true)
        rejectionEvidence.forEach((evidence, index) => {
          addText(`${index + 1}. ${evidence.name}`, 11, true)
          if (evidence.type?.startsWith('image/') && evidence.url?.startsWith('data:')) {
            try {
              const imgWidth = 200
              const imgHeight = 150
              if (yPosition + imgHeight > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage()
                yPosition = margin
              }
              pdf.addImage(evidence.url, 'JPEG', margin, yPosition, imgWidth, imgHeight)
              yPosition += imgHeight + 10
            } catch (e) {
              addText(`   [Image: ${evidence.name}]`, 11, false)
            }
          } else {
            addText(`   [File: ${evidence.name}]`, 11, false)
          }
        })
      }
      
      if (Array.isArray(disputeEvidence) && disputeEvidence.length > 0) {
        addText("Dispute Evidence:", 12, true)
        disputeEvidence.forEach((evidence, index) => {
          addText(`${index + 1}. ${evidence.name}`, 11, true)
          if (evidence.type?.startsWith('image/') && evidence.url?.startsWith('data:')) {
            try {
              const imgWidth = 200
              const imgHeight = 150
              if (yPosition + imgHeight > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage()
                yPosition = margin
              }
              pdf.addImage(evidence.url, 'JPEG', margin, yPosition, imgWidth, imgHeight)
              yPosition += imgHeight + 10
            } catch (e) {
              addText(`   [Image: ${evidence.name}]`, 11, false)
            }
          } else {
            addText(`   [File: ${evidence.name}]`, 11, false)
          }
        })
      }
    }

    // Legal Signatures Detail
    if (agreement.legalSignatures && agreement.legalSignatures.length > 0) {
      addSection("SIGNATURE DETAILS", "")
      agreement.legalSignatures.forEach((sig, index) => {
        addText(`${index + 1}. ${sig.role.toUpperCase()} SIGNATURE`, 12, true)
        addText(`   Name: ${sig.signedByName}`, 11, false)
        addText(`   Email: ${sig.signedByEmail}`, 11, false)
        addText(`   Date: ${new Date(sig.timestamp).toLocaleString()}`, 11, false)
        addText(`   IP Address: ${sig.ipAddress}`, 11, false)
        if (sig.location) addText(`   Location: ${sig.location}`, 11, false)
        if (sig.userAgent) addText(`   User Agent: ${sig.userAgent}`, 11, false)
        addText(`   Signature Data: ${sig.signatureData.startsWith('data:') ? '[Digital Signature Image]' : sig.signatureData}`, 11, false)
      })
    }

    // Legal Footer
    yPosition += 20
    addText("LEGAL CERTIFICATION", 14, true)
    addText("This document contains a complete chronological record of all events, communications, and legal actions related to the above agreement. This documentation is generated automatically and maintains the integrity of all recorded data for legal proceedings.", 11, false)
    addText(`Document generated on ${new Date().toLocaleString()} by BindMe Legal System.`, 10, false)

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Legal-Case-${agreement.legalCaseNumber || agreement.id}.pdf"`,
      },
    })

  } catch (error) {
    console.error("Legal case PDF generation failed:", error)
    return NextResponse.json(
      { error: "Failed to generate legal case PDF" },
      { status: 500 }
    )
  }
}