import { sendEmail } from "../email-service"
import { db } from "../db"
import { users, agreements } from "../db/schema"
import { eq } from "drizzle-orm"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

const baseStyles = {
  body: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; max-width: 640px; margin: 0 auto; padding: 24px; background: #0b1224;",
  card: "background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 24px;",
  heading: "margin: 0 0 12px 0; color: #e2e8f0; font-size: 22px;",
  text: "margin: 0 0 12px 0; color: #cbd5e1;",
  small: "font-size: 12px; color: #94a3b8;",
  buttonBase: "text-decoration: none; border-radius: 10px; font-weight: 600; padding: 12px 18px; display: inline-block;",
}

export type AgreementEvent =
  | "agreement_created"
  | "sent_for_signature"
  | "creator_signed"
  | "counterparty_signed"
  | "agreement_activated"
  | "amendment_requested"
  | "amendment_approved"
  | "amendment_rejected"
  | "completion_requested"
  | "completion_confirmed"
  | "breach_reported"
  | "dispute_started"
  | "legal_resolution"
  | "agreement_cancelled"
  | "agreement_withdrawn"

interface NotificationParams {
  agreementId: string
  agreementTitle: string
  actorName: string
  actorId: string
  recipientEmail: string
  recipientName?: string
  details?: string
}

export class NotificationService {
  /**
   * Send email notification to all parties involved in an agreement
   */
  static async notifyAllParties(
    agreementId: string,
    event: AgreementEvent,
    actorId: string
  ): Promise<void> {
    try {
      // Fetch agreement and user details
      const agreement = await db.query.agreements.findFirst({
        where: eq(agreements.id, agreementId),
      })

      if (!agreement) {
        console.error(`Agreement ${agreementId} not found`)
        return
      }

      const creator = await db.query.users.findFirst({
        where: eq(users.id, agreement.userId),
      })

      const actor = await db.query.users.findFirst({
        where: eq(users.id, actorId),
      })

      if (!creator || !actor) {
        console.error(`User not found for notification`)
        return
      }

      // Determine who to notify based on the event
      const notificationTargets = this.getNotificationTargets(
        event,
        agreement,
        actorId
      )

      // Send notifications
      for (const target of notificationTargets) {
        const user = target === 'creator' ? creator : null
        const counterpartyEmail = agreement.betOpponentEmail

        if (target === 'creator' && user) {
          await this.notifyUser(user.id, event, agreement, actor.name)
        } else if (target === 'counterparty' && counterpartyEmail) {
          await this.sendEmailNotification({
            agreementId: agreement.id,
            agreementTitle: agreement.title,
            actorName: actor.name,
            actorId: actor.id,
            recipientEmail: counterpartyEmail,
            recipientName: agreement.betOpponentName || undefined,
          }, event)
        }
      }
    } catch (error) {
      console.error(`Failed to notify all parties:`, error)
    }
  }

  /**
   * Send notification to a specific user
   */
  static async notifyUser(
    userId: string,
    event: AgreementEvent,
    agreement: any,
    actorName: string
  ): Promise<void> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      console.error(`User ${userId} not found`)
      return
    }

    // Check user preferences before sending
    const shouldSend = await this.shouldSendEmail(userId, event)
    if (!shouldSend) {
      console.log(`User ${userId} has disabled ${event} notifications`)
      return
    }

    await this.sendEmailNotification({
      agreementId: agreement.id,
      agreementTitle: agreement.title,
      actorName,
      actorId: userId,
      recipientEmail: user.email,
      recipientName: user.name,
    }, event)
  }

  /**
   * Check if user wants to receive email for this event type
   */
  static async shouldSendEmail(userId: string, eventType: string): Promise<boolean> {
    // TODO: Implement user notification preferences
    // For now, return true for all notifications
    return true
  }

  /**
   * Determine which parties should be notified for an event
   */
  private static getNotificationTargets(
    event: AgreementEvent,
    agreement: any,
    actorId: string
  ): ('creator' | 'counterparty')[] {
    const isCreator = agreement.userId === actorId

    switch (event) {
      case "agreement_created":
        return ['creator'] // Only creator gets confirmation
      
      case "sent_for_signature":
        return ['creator', 'counterparty'] // Creator gets confirmation, counterparty gets invitation
      
      case "creator_signed":
        return ['creator', 'counterparty'] // Both notified
      
      case "counterparty_signed":
        return ['creator', 'counterparty'] // Both notified
      
      case "agreement_activated":
        return ['creator', 'counterparty'] // Both notified
      
      case "amendment_requested":
        return isCreator ? ['counterparty'] : ['creator'] // Notify the other party
      
      case "amendment_approved":
      case "amendment_rejected":
        return ['creator', 'counterparty'] // Both notified
      
      case "completion_requested":
        return isCreator ? ['counterparty'] : ['creator'] // Notify the other party
      
      case "completion_confirmed":
      case "breach_reported":
      case "dispute_started":
      case "legal_resolution":
      case "agreement_cancelled":
      case "agreement_withdrawn":
        return ['creator', 'counterparty'] // Both notified
      
      default:
        return []
    }
  }

  /**
   * Send the actual email notification
   */
  static async sendEmailNotification(
    params: NotificationParams,
    event: AgreementEvent
  ): Promise<void> {
    const emailContent = this.generateEmailContent(params, event)
    
    try {
      await sendEmail({
        to: params.recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      })
      console.log(`✅ ${event} notification sent to: ${params.recipientEmail}`)
    } catch (error) {
      console.error(`❌ Failed to send ${event} notification:`, error)
      // TODO: Add to email queue for retry
    }
  }

  /**
   * Generate email content based on event type
   */
  private static generateEmailContent(
    params: NotificationParams,
    event: AgreementEvent
  ): { subject: string; html: string } {
    const agreementUrl = `${APP_URL}/agreement/${params.agreementId}`
    const recipientName = params.recipientName || 'there'

    switch (event) {
      case "agreement_created":
        return {
          subject: `Agreement Created: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '📋',
            heading: 'Agreement Created',
            greeting: `Hi ${recipientName},`,
            message: `You have successfully created the agreement: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Agreement',
            actionUrl: agreementUrl,
            accentColor: '#60a5fa',
          }),
        }

      case "sent_for_signature":
        const isInvitation = params.actorId !== params.recipientEmail // Check if recipient is not the actor
        return {
          subject: isInvitation 
            ? `You've been invited to sign: ${params.agreementTitle}`
            : `Agreement sent for signature: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '✉️',
            heading: isInvitation ? 'You\'ve Been Invited to Sign' : 'Sent for Signature',
            greeting: `Hi ${recipientName},`,
            message: isInvitation
              ? `<strong>${params.actorName}</strong> has invited you to sign the agreement: <strong>"${params.agreementTitle}"</strong>`
              : `Your agreement has been sent for signature: <strong>"${params.agreementTitle}"</strong>`,
            actionText: isInvitation ? 'Review & Sign' : 'View Agreement',
            actionUrl: agreementUrl,
            accentColor: '#c084fc',
          }),
        }

      case "creator_signed":
        return {
          subject: `Agreement Signed: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '✍️',
            heading: 'Creator Has Signed',
            greeting: `Hi ${recipientName},`,
            message: `<strong>${params.actorName}</strong> has signed the agreement. It's now awaiting your signature: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'Sign Agreement',
            actionUrl: agreementUrl,
            accentColor: '#22c55e',
          }),
        }

      case "counterparty_signed":
        return {
          subject: `Agreement Signed: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '✅',
            heading: 'Counterparty Has Signed',
            greeting: `Hi ${recipientName},`,
            message: `Great news! <strong>${params.actorName}</strong> has signed the agreement: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Agreement',
            actionUrl: agreementUrl,
            accentColor: '#22c55e',
          }),
        }

      case "agreement_activated":
        return {
          subject: `Agreement is Now Active: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '🎉',
            heading: 'Agreement is Legally Binding',
            greeting: `Hi ${recipientName},`,
            message: `The agreement has been fully signed by all parties and is now legally binding: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Active Agreement',
            actionUrl: agreementUrl,
            accentColor: '#22c55e',
          }),
        }

      case "amendment_requested":
        return {
          subject: `Amendment Requested: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '📝',
            heading: 'Amendment Requested',
            greeting: `Hi ${recipientName},`,
            message: `<strong>${params.actorName}</strong> has requested an amendment to the agreement: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'Review Amendment',
            actionUrl: agreementUrl,
            accentColor: '#fbbf24',
          }),
        }

      case "amendment_approved":
        return {
          subject: `Amendment Approved: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '✅',
            heading: 'Amendment Approved',
            greeting: `Hi ${recipientName},`,
            message: `Your amendment request has been approved for: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Agreement',
            actionUrl: agreementUrl,
            accentColor: '#22c55e',
          }),
        }

      case "amendment_rejected":
        return {
          subject: `Amendment Rejected: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '❌',
            heading: 'Amendment Rejected',
            greeting: `Hi ${recipientName},`,
            message: `Your amendment request has been rejected for: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Details',
            actionUrl: agreementUrl,
            accentColor: '#f87171',
          }),
        }

      case "completion_requested":
        return {
          subject: `Completion Requested: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '🏁',
            heading: 'Completion Requested',
            greeting: `Hi ${recipientName},`,
            message: `<strong>${params.actorName}</strong> has requested to mark this agreement as complete: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'Review Request',
            actionUrl: agreementUrl,
            accentColor: '#fbbf24',
          }),
        }

      case "completion_confirmed":
        return {
          subject: `Agreement Completed: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '✅',
            heading: 'Agreement Completed',
            greeting: `Hi ${recipientName},`,
            message: `The agreement has been marked as completed: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Agreement',
            actionUrl: agreementUrl,
            accentColor: '#22c55e',
          }),
        }

      case "breach_reported":
        return {
          subject: `⚠️ Breach Reported: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '⚠️',
            heading: 'Breach Reported',
            greeting: `Hi ${recipientName},`,
            message: `A breach has been reported for the agreement: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Details',
            actionUrl: agreementUrl,
            accentColor: '#ef4444',
          }),
        }

      case "dispute_started":
        return {
          subject: `⚠️ Dispute Started: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '⚖️',
            heading: 'Dispute Started',
            greeting: `Hi ${recipientName},`,
            message: `A dispute has been initiated for the agreement: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Dispute',
            actionUrl: agreementUrl,
            accentColor: '#f472b6',
          }),
        }

      case "legal_resolution":
        return {
          subject: `Legal Resolution Update: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '🏛️',
            heading: 'Legal Resolution',
            greeting: `Hi ${recipientName},`,
            message: `A legal resolution has been triggered for: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Details',
            actionUrl: agreementUrl,
            accentColor: '#8b5cf6',
          }),
        }

      case "agreement_cancelled":
        return {
          subject: `Agreement Cancelled: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '🚫',
            heading: 'Agreement Cancelled',
            greeting: `Hi ${recipientName},`,
            message: `The agreement has been cancelled: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Details',
            actionUrl: agreementUrl,
            accentColor: '#f97316',
          }),
        }

      case "agreement_withdrawn":
        return {
          subject: `Agreement Withdrawn: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '↩️',
            heading: 'Agreement Withdrawn',
            greeting: `Hi ${recipientName},`,
            message: `The agreement has been withdrawn: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Details',
            actionUrl: agreementUrl,
            accentColor: '#f97316',
          }),
        }

      default:
        return {
          subject: `Agreement Update: ${params.agreementTitle}`,
          html: this.generateEmailTemplate({
            emoji: '📬',
            heading: 'Agreement Update',
            greeting: `Hi ${recipientName},`,
            message: `There's been an update to your agreement: <strong>"${params.agreementTitle}"</strong>`,
            actionText: 'View Agreement',
            actionUrl: agreementUrl,
            accentColor: '#38bdf8',
          }),
        }
    }
  }

  /**
   * Generate email template with consistent styling
   */
  private static generateEmailTemplate(config: {
    emoji: string
    heading: string
    greeting: string
    message: string
    actionText: string
    actionUrl: string
    accentColor: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${config.heading}</title>
        </head>
        <body style="${baseStyles.body}">
          <div style="${baseStyles.card}">
            <h1 style="${baseStyles.heading}">${config.emoji} ${config.heading}</h1>
            <p style="${baseStyles.text}">${config.greeting}</p>
            <p style="${baseStyles.text}">${config.message}</p>
            <div style="text-align: left; margin: 24px 0;">
              <a href="${config.actionUrl}" style="${baseStyles.buttonBase} background: ${config.accentColor}; color: #0b1224; font-weight: 700;">
                ${config.actionText}
              </a>
            </div>
            <p style="${baseStyles.small}">If you did not expect this email, you can ignore it or contact support.</p>
          </div>
          <p style="text-align: center; ${baseStyles.small}; margin-top: 16px;">BindMe · Agreement notifications</p>
        </body>
      </html>
    `
  }
}

// Export convenience functions for backwards compatibility
export async function sendAgreementNotification(
  type: 'created' | 'signed',
  agreementTitle: string,
  actorName: string,
  recipientEmail: string,
  agreementId: string = 'unknown',
  actorId: string = 'unknown'
) {
  const event = type === 'created' ? 'agreement_created' : 'counterparty_signed'
  await NotificationService.sendEmailNotification({
    agreementId,
    agreementTitle,
    actorName,
    actorId,
    recipientEmail,
  }, event)
}
