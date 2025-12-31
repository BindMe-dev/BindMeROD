interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log('Attempting to send email to:', to)
  try {
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    const result = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'BindMe'}" <${process.env.MAIL_FROM_ADDRESS || 'contact@bindme.co.uk'}>`,
      to,
      subject,
      html,
    })

    console.log('Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Email sending failed:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

const baseStyles = {
  body:
    "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; max-width: 640px; margin: 0 auto; padding: 24px; background: #0b1224;",
  card: "background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 24px;",
  heading: "margin: 0 0 12px 0; color: #e2e8f0; font-size: 22px;",
  text: "margin: 0 0 12px 0; color: #cbd5e1;",
  small: "font-size: 12px; color: #94a3b8;",
  buttonBase: "text-decoration: none; border-radius: 10px; font-weight: 600; padding: 12px 18px; display: inline-block;",
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Law Firm Assignment - Notify User
 */
export function generateLawFirmAssignedEmail(
  agreementTitle: string,
  agreementId: string,
  firmName: string
) {
  const agreementUrl = `${APP_URL}/agreement/${agreementId}`

  return {
    subject: `Legal Help Assigned: ${agreementTitle}`,
    html: `
      <div style="${baseStyles.body}">
        <div style="${baseStyles.card}">
          <h2 style="${baseStyles.heading}">🏛️ Legal Professional Assigned</h2>
          <p style="${baseStyles.text}">Your disputed agreement has been assigned to a verified law firm:</p>
          <p style="${baseStyles.text}"><strong>Agreement:</strong> ${agreementTitle}</p>
          <p style="${baseStyles.text}"><strong>Law Firm:</strong> ${firmName}</p>
          <p style="${baseStyles.text}">The law firm will contact you within 24 hours to discuss your case.</p>
          <a href="${agreementUrl}" style="${baseStyles.buttonBase} background: #8b5cf6; color: white;">
            View Details
          </a>
          <p style="${baseStyles.small}; margin-top: 24px;">BindMe - Secure Agreement Management</p>
        </div>
      </div>
    `,
  }
}

/**
 * Law Firm Assignment - Notify Firm
 */
export function generateNewCaseAssignmentEmail(
  agreementTitle: string,
  agreementId: string,
  caseValue: number
) {
  const caseUrl = `${APP_URL}/firm/cases/${agreementId}`

  return {
    subject: `New Case Assignment: ${agreementTitle}`,
    html: `
      <div style="${baseStyles.body}">
        <div style="${baseStyles.card}">
          <h2 style="${baseStyles.heading}">📋 New Case Assigned</h2>
          <p style="${baseStyles.text}">A new case has been assigned to your firm:</p>
          <p style="${baseStyles.text}"><strong>Case:</strong> ${agreementTitle}</p>
          <p style="${baseStyles.text}"><strong>Estimated Value:</strong> £${caseValue.toLocaleString()}</p>
          <p style="${baseStyles.text}">Please review the case details and contact the client within 24 hours.</p>
          <a href="${caseUrl}" style="${baseStyles.buttonBase} background: #8b5cf6; color: white;">
            View Case
          </a>
          <p style="${baseStyles.small}; margin-top: 24px;">BindMe - Legal Services Platform</p>
        </div>
      </div>
    `,
  }
}

/**
 * Dispute Notification
 */
export function generateDisputeNotificationEmail(
  agreementTitle: string,
  agreementId: string,
  disputedBy: string
) {
  const agreementUrl = `${APP_URL}/agreement/${agreementId}`

  return {
    subject: `⚠️ Agreement Disputed: ${agreementTitle}`,
    html: `
      <div style="${baseStyles.body}">
        <div style="${baseStyles.card}">
          <h2 style="${baseStyles.heading}">⚠️ Agreement Disputed</h2>
          <p style="${baseStyles.text}"><strong>${disputedBy}</strong> has marked the agreement as disputed:</p>
          <p style="${baseStyles.text}"><strong>${agreementTitle}</strong></p>
          <p style="${baseStyles.text}">Please review the dispute and attempt to resolve it amicably.</p>
          <a href="${agreementUrl}" style="${baseStyles.buttonBase} background: #ef4444; color: white;">
            View Dispute
          </a>
          <p style="${baseStyles.small}; margin-top: 24px;">BindMe - Secure Agreement Management</p>
        </div>
      </div>
    `,
  }
}

/**
 * Reminder Email
 */
export function generateReminderEmail(
  agreementTitle: string,
  agreementId: string,
  reminderType: 'pending_signature' | 'stale_agreement'
) {
  const agreementUrl = `${APP_URL}/agreement/${agreementId}`
  const subject = reminderType === 'pending_signature'
    ? `Reminder: Signature Required - ${agreementTitle}`
    : `Reminder: Agreement Needs Attention - ${agreementTitle}`

  return {
    subject,
    html: `
      <div style="${baseStyles.body}">
        <div style="${baseStyles.card}">
          <h2 style="${baseStyles.heading}">⏰ Reminder</h2>
          <p style="${baseStyles.text}">This is a friendly reminder about your agreement:</p>
          <p style="${baseStyles.text}"><strong>${agreementTitle}</strong></p>
          <p style="${baseStyles.text}">${reminderType === 'pending_signature'
            ? 'This agreement is still waiting for your signature.'
            : 'This agreement has had no activity for several days.'}</p>
          <a href="${agreementUrl}" style="${baseStyles.buttonBase} background: #f59e0b; color: white;">
            Take Action
          </a>
          <p style="${baseStyles.small}; margin-top: 24px;">BindMe - Secure Agreement Management</p>
        </div>
      </div>
    `,
  }
}

export function generatePasswordResetEmail(resetUrl: string, userEmail: string) {
  return {
    subject: "Reset Your BindMe Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">Reset your password</h1>
            <p style="${baseStyles.text}">We received a request to reset the password for the account linked to <strong>${userEmail}</strong>.</p>
            <p style="${baseStyles.text}">This link expires in <strong>30 minutes</strong>. If you did not request a reset, ignore this email.</p>
            <div style="text-align: left; margin: 24px 0;">
              <a href="${resetUrl}" style="${baseStyles.buttonBase} background: #2563eb; color: #fff;">Reset password</a>
            </div>
            <p style="${baseStyles.small}">If the button doesn’t work, copy and paste this link into your browser:<br>${resetUrl}</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Security notice</p>
        </body>
      </html>
    `,
  }
}

export function generatePasswordChangedEmail(userEmail: string, baseUrl: string) {
  return {
    subject: "Your BindMe password was changed",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">Password changed</h1>
            <p style="${baseStyles.text}">Your BindMe password was just updated.</p>
            <p style="${baseStyles.text}">If this wasn’t you, reset your password immediately and notify support.</p>
            <div style="text-align: left; margin: 20px 0;">
              <a href="${baseUrl}/reset-password" style="${baseStyles.buttonBase} background: #2563eb; color: #fff;">Reset password</a>
            </div>
            <p style="${baseStyles.small}">If the button doesn’t work, copy and paste this link:<br>${baseUrl}/reset-password</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Security notice</p>
        </body>
      </html>
    `,
  }
}

export function generatePromotionalEmail(userEmail: string) {
  return {
    subject: "About your reset request",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>About BindMe</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">No account on this email</h1>
            <p style="${baseStyles.text}">We received a password reset request for <strong>${userEmail}</strong>, but there is no BindMe account on this address.</p>
            <p style="${baseStyles.text}">If you intended to create an account, you can start here:</p>
            <div style="text-align: left; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="${baseStyles.buttonBase} background: #2563eb; color: #fff;">Create an account</a>
            </div>
            <p style="${baseStyles.small}">If you didn’t request this, no action is needed.</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Account notice</p>
        </body>
      </html>
    `,
  }
}

export function generateWelcomeEmail(userEmail: string, userName: string) {
  return {
    subject: "Welcome to BindMe",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to BindMe</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">Welcome to BindMe</h1>
            <p style="${baseStyles.text}">Hi ${userName || "there"}, your account is ready.</p>
            <p style="${baseStyles.text}">Use BindMe to create agreements, capture signatures with full audit trails, and track obligations with reminders.</p>
            <div style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; margin: 16px 0;">
              <p style="margin: 6px 0; color: #e5e7eb;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 6px 0; color: #e5e7eb;"><strong>Account created:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <div style="text-align: left; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="${baseStyles.buttonBase} background: #2563eb; color: #fff;">Open dashboard</a>
            </div>
            <p style="${baseStyles.small}">If you didn’t create this account, contact support immediately.</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Verified onboarding</p>
        </body>
      </html>
    `,
  }
}

export function generateActivationConfirmationEmail(userEmail: string, userName: string, baseUrl: string) {
  return {
    subject: "Your BindMe account is active",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Activated</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">Account activated</h1>
            <p style="${baseStyles.text}">Hi ${userName || "there"}, your BindMe account is verified. You can now sign agreements and share them securely.</p>
            <div style="text-align: left; margin: 20px 0;">
              <a href="${baseUrl}/dashboard" style="${baseStyles.buttonBase} background: #14b8a6; color: #0b1224; font-weight: 700;">Open dashboard</a>
            </div>
            <p style="${baseStyles.small}">If you didn’t request this activation, contact support immediately.</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Secure agreements</p>
        </body>
      </html>
    `,
  }
}

export function generateVerificationEmail(verificationUrl: string, userEmail: string, userName: string) {
  return {
    subject: "Verify Your BindMe Account",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">Verify your email</h1>
            <p style="${baseStyles.text}">Hi ${userName || "there"}, confirm your email to activate BindMe.</p>
            <div style="text-align: left; margin: 20px 0;">
              <a href="${verificationUrl}" style="${baseStyles.buttonBase} background: #2563eb; color: #fff;">Verify email</a>
            </div>
            <p style="${baseStyles.text}">This link expires in 24 hours. You must verify to access your account.</p>
            <p style="${baseStyles.small}">If the button doesn’t work, copy and paste this link:<br>${verificationUrl}</p>
            <p style="${baseStyles.small}; margin-top: 12px;">If you didn’t create a BindMe account, ignore this email.</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Account verification</p>
        </body>
      </html>
    `,
  }
}

type AgreementEvent =
  | "creation"
  | "sentForSignature"
  | "complete"
  | "update"
  | "withdrawal"
  | "deletion"
  | "witnessSignature"
  | "counterpartySignature"
  | "requestCompletion"
  | "rejectCompletion"
  | "disputeRejection"
  | "legalResolution"
  | "amendment_requested"
  | "amendment_approved"
  | "amendment_rejected"

const eventLabels: Record<AgreementEvent, string> = {
  creation: "Agreement created",
  sentForSignature: "Sent for signature",
  complete: "Agreement completed",
  update: "Agreement updated",
  withdrawal: "Agreement withdrawn",
  deletion: "Agreement deleted",
  witnessSignature: "Witness signature added",
  counterpartySignature: "Counterparty signed",
  requestCompletion: "Completion requested",
  rejectCompletion: "Completion rejected",
  disputeRejection: "Dispute / rejection raised",
  legalResolution: "Legal resolution triggered",
  amendment_requested: "Amendment requested",
  amendment_approved: "Amendment approved",
  amendment_rejected: "Amendment rejected",
}

const eventColors: Record<AgreementEvent, string> = {
  creation: "#60a5fa",
  sentForSignature: "#c084fc",
  complete: "#22c55e",
  update: "#38bdf8",
  withdrawal: "#f97316",
  deletion: "#ef4444",
  witnessSignature: "#a855f7",
  counterpartySignature: "#22c55e",
  requestCompletion: "#fbbf24",
  rejectCompletion: "#f87171",
  disputeRejection: "#f472b6",
  legalResolution: "#8b5cf6",
  amendment_requested: "#fbbf24",
  amendment_approved: "#22c55e",
  amendment_rejected: "#f87171",
}

interface AgreementEventEmailParams {
  event: AgreementEvent
  agreementTitle: string
  agreementId: string
  actorName?: string
  actorEmail?: string
  timestamp?: string
  link?: string
  details?: string
}

export function generateAgreementEventEmail({
  event,
  agreementTitle,
  agreementId,
  actorName,
  actorEmail,
  timestamp,
  link,
  details,
}: AgreementEventEmailParams) {
  const heading = eventLabels[event] || "Agreement update"
  const accent = eventColors[event] || "#38bdf8"
  const safeLink = link || (process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "https://bindme.co.uk") + `/agreement/${agreementId}`
  const ts = timestamp || new Date().toLocaleString()

  return {
    subject: `${heading} — ${agreementTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${heading}</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">${heading}</h1>
            <p style="${baseStyles.text}"><strong>${agreementTitle}</strong></p>
            <p style="${baseStyles.text}">Agreement ID: <code style="color:#cbd5e1">${agreementId}</code></p>
            <p style="${baseStyles.text}">When: ${ts}</p>
            ${actorName || actorEmail ? `<p style="${baseStyles.text}">By: ${actorName || ""} ${actorEmail ? `(${actorEmail})` : ""}</p>` : ""}
            ${details ? `<p style="${baseStyles.text}">${details}</p>` : ""}
            <div style="text-align: left; margin: 20px 0;">
              <a href="${safeLink}" style="${baseStyles.buttonBase} background: ${accent}; color: #0b1224; font-weight: 700;">Open agreement</a>
            </div>
            <p style="${baseStyles.small}">If you did not expect this email, you can ignore it or contact support.</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Agreement notifications</p>
        </body>
      </html>
    `,
  }
}

export async function sendAgreementEventEmail(to: string, params: AgreementEventEmailParams) {
  const { subject, html } = generateAgreementEventEmail(params)
  return sendEmail({ to, subject, html })
}
