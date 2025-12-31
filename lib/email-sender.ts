// Email sending utility
// Configured with SMTP (Hostinger) and Resend as fallback

import nodemailer from "nodemailer"
import { Resend } from "resend"
import { EmailTemplate } from "./email-templates"

export interface EmailOptions {
  to: string
  from?: string
  subject: string
  html: string
  text: string
}

// Initialize SMTP transporter (Hostinger)
const smtpTransporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

// Initialize Resend client (fallback)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Email sender with SMTP (primary) and Resend (fallback)
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try SMTP first (Hostinger)
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: options.from || `"BindMe" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      console.log("✅ Email sent via SMTP to:", options.to)
      return true
    } catch (error) {
      console.error("❌ SMTP failed, trying Resend fallback:", error)
      // Fall through to Resend
    }
  }

  // Try Resend as fallback
  if (resend) {
    try {
      await resend.emails.send({
        from: options.from || "BindMe <noreply@bindme.com>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      console.log("✅ Email sent via Resend to:", options.to)
      return true
    } catch (error) {
      console.error("❌ Resend also failed:", error)
      return false
    }
  }

  // No email service configured - log to console (development mode)
  console.log("📧 Email would be sent (no email service configured):")
  console.log("To:", options.to)
  console.log("Subject:", options.subject)
  console.log("---")
  console.log(options.text)
  console.log("---")
  console.log("💡 Configure SMTP or Resend in .env.local to enable email sending")
  return true
}

export async function sendTemplateEmail(
  to: string,
  template: EmailTemplate
): Promise<boolean> {
  return sendEmail({
    to,
    from: process.env.SMTP_USER
      ? `"BindMe" <${process.env.SMTP_USER}>`
      : "BindMe <noreply@bindme.com>",
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

// Queue email for later sending (useful for batch operations)
export async function queueEmail(options: EmailOptions): Promise<void> {
  // In production, add to a queue (Redis, Bull, etc.)
  console.log("📬 Email queued for sending:", options.to)
  
  // For now, just send immediately
  await sendEmail(options)
}

// Send bulk emails (with rate limiting)
export async function sendBulkEmails(
  emails: EmailOptions[],
  batchSize: number = 10
): Promise<void> {
  console.log(`📨 Sending ${emails.length} emails in batches of ${batchSize}`)
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    await Promise.all(batch.map((email) => sendEmail(email)))
    
    // Wait between batches to avoid rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

// Email verification helper
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Get email provider from email address
export function getEmailProvider(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase()
  
  const providers: Record<string, string> = {
    "gmail.com": "Gmail",
    "yahoo.com": "Yahoo",
    "outlook.com": "Outlook",
    "hotmail.com": "Hotmail",
    "icloud.com": "iCloud",
  }
  
  return providers[domain] || "Unknown"
}

// Email tracking (for analytics)
export function generateTrackingPixel(emailId: string): string {
  return `<img src="https://bindme.com/api/track/email/${emailId}" width="1" height="1" alt="" />`
}

// Unsubscribe link generator
export function generateUnsubscribeLink(userId: string, emailType: string): string {
  // In production, use a signed token
  return `https://bindme.com/unsubscribe?user=${userId}&type=${emailType}`
}

