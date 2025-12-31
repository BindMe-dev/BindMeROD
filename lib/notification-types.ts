export type NotificationType =
  | "deadline_reminder"
  | "recurring_due"
  | "partner_request"
  | "achievement_unlocked"
  | "support_message"
  | "agreement_shared"
  | "witness_request"
  | "agreement_signature"
  | "action_required"
  | "system"

export type NotificationPriority = "urgent" | "normal"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority?: NotificationPriority
  category?: "action" | "update" | "reminder" | "system"
  requiresAction?: boolean
  handledAt?: string | null
  title: string
  message: string
  agreementId?: string
  read: boolean
  createdAt: string
}

export interface NotificationPreferences {
  emailNotifications: boolean
  browserNotifications: boolean
  deadlineReminders: boolean
  recurringReminders: boolean
  partnerActivity: boolean
  achievements: boolean
  reminderTimeBefore: number // hours before deadline
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  browserNotifications: true,
  deadlineReminders: true,
  recurringReminders: true,
  partnerActivity: true,
  achievements: true,
  reminderTimeBefore: 24,
}
