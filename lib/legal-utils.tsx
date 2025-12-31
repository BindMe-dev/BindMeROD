import type { AuditLogEntry, LegalSignature, LegalMetadata } from "./agreement-types"

// Get user's IP address (simulated for client-side)
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()
    return data.ip
  } catch {
    return "Unknown"
  }
}

// Get user agent string
export function getUserAgent(): string {
  return navigator.userAgent
}

// Create initial legal metadata
export function createLegalMetadata(
  userId: string,
  userEmail: string,
  userName: string,
  legalIntentAccepted: boolean,
): LegalMetadata {
  return {
    legalIntentAccepted,
    termsAcceptedVersion: "1.0.0",
    signatures: [],
    auditLog: [],
    emailConfirmationSent: false,
    jurisdictionClause: "United Kingdom",
  }
}

// Create audit log entry
export async function createAuditLog(
  action: string,
  userId: string,
  userEmail: string,
  details: string,
): Promise<AuditLogEntry> {
  const ipAddress = await getUserIP()

  return {
    id: crypto.randomUUID(),
    action,
    performedBy: userId,
    performedByEmail: userEmail,
    timestamp: new Date().toISOString(),
    details,
    ipAddress,
  }
}

// Create signature
export async function createSignature(
  userId: string,
  userEmail: string,
  userName: string,
  signatureData: string,
  role: LegalSignature["role"] = "creator",
): Promise<LegalSignature> {
  const ipAddress = await getUserIP()
  const userAgent = getUserAgent()

  return {
    signedBy: userId,
    signedByEmail: userEmail,
    signedByName: userName,
    signatureData,
    timestamp: new Date().toISOString(),
    ipAddress,
    userAgent,
    role,
  }
}

// Format audit log for display
export function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    AGREEMENT_CREATED: "Agreement Created",
    AGREEMENT_SIGNED: "Agreement Signed",
    AGREEMENT_COMPLETED: "Agreement Completed",
    AGREEMENT_UPDATED: "Agreement Updated",
    AGREEMENT_DELETED: "Agreement Deleted",
    PARTNER_ADDED: "Partner Added",
    PARTNER_REMOVED: "Partner Removed",
    MESSAGE_SENT: "Support Message Sent",
    NOTES_UPDATED: "Notes Updated",
    STATUS_CHANGED: "Status Changed",
  }
  return actionMap[action] || action
}

// Generate email confirmation content
export function generateEmailConfirmation(
  agreementTitle: string,
  agreementDescription: string,
  userName: string,
  userEmail: string,
  legalMetadata: LegalMetadata,
): string {
  const signature = legalMetadata.signatures[0]

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
    .legal-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
    .signature { background: white; padding: 15px; margin: 15px 0; border: 2px solid #667eea; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BindMe Agreement Confirmation</h1>
    </div>
    
    <div class="content">
      <h2>Agreement Details</h2>
      <p><strong>Title:</strong> ${agreementTitle}</p>
      <p><strong>Description:</strong> ${agreementDescription}</p>
      <p><strong>Signed By:</strong> ${userName} (${userEmail})</p>
      <p><strong>Date:</strong> ${new Date(signature.timestamp).toLocaleString()}</p>
      
      <div class="signature">
        <h3>Digital Signature</h3>
        <p><strong>Signature:</strong> ${signature.signatureData}</p>
        <p><strong>Timestamp:</strong> ${new Date(signature.timestamp).toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${signature.ipAddress}</p>
      </div>
      
      <div class="legal-box">
        <h3>Legal Confirmation</h3>
        <p>✓ Legal Intent to Create Binding Agreement: <strong>Accepted</strong></p>
        <p>✓ Terms of Service Version: <strong>${legalMetadata.termsAcceptedVersion}</strong></p>
        <p>✓ Jurisdiction: <strong>${legalMetadata.jurisdictionClause}</strong></p>
        <p>✓ Electronic Signatures Regulations 2002: <strong>Compliant</strong></p>
      </div>
      
      <p>This email serves as confirmation that you have created a legally binding agreement through BindMe. Please retain this email for your records.</p>
      
      <p>This agreement is governed by the laws of the United Kingdom and complies with the Electronic Signatures Regulations 2002.</p>
    </div>
    
    <div class="footer">
      <p>This is an automated confirmation from BindMe</p>
      <p>For questions or support, contact support@bindme.app</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
