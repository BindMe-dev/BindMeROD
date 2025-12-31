import type { Agreement } from "./agreement-types"
import type { NotificationPreferences } from "./notification-types"

// Simple UUID generator for client-side use
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export interface ScheduledReminder {
  id: string
  agreementId: string
  type: "deadline" | "recurring"
  scheduledFor: string
  title: string
  message: string
}

export function calculateUpcomingReminders(
  agreements: Agreement[],
  preferences: NotificationPreferences,
): ScheduledReminder[] {
  const reminders: ScheduledReminder[] = []
  const now = new Date()

  agreements.forEach((agreement) => {
    if (agreement.status !== "active") return

    // Deadline reminders
    const deadlineDate = agreement.deadline || agreement.betSettlementDate
    if (preferences.deadlineReminders && deadlineDate) {
      const deadline = new Date(deadlineDate)
      const reminderTime = new Date(deadline.getTime() - preferences.reminderTimeBefore * 60 * 60 * 1000)
      const isBet = agreement.type === "bet"

      if (reminderTime > now && reminderTime.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        reminders.push({
          id: generateId(),
          agreementId: agreement.id,
          type: "deadline",
          scheduledFor: reminderTime.toISOString(),
          title: `${isBet ? "Bet settles" : "Deadline Approaching"}: ${agreement.title}`,
          message: `${
            isBet ? "This wager settles" : "Your agreement is due"
          } on ${deadline.toLocaleDateString()}`,
        })
      }
    }

    // Recurring reminders
    if (preferences.recurringReminders && agreement.type === "recurring") {
      const nextDue = calculateNextRecurringDate(agreement)
      if (nextDue) {
        const reminderTime = new Date(nextDue.getTime() - preferences.reminderTimeBefore * 60 * 60 * 1000)

        if (reminderTime > now && reminderTime.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
          reminders.push({
            id: generateId(),
            agreementId: agreement.id,
            type: "recurring",
            scheduledFor: reminderTime.toISOString(),
            title: `Recurring Agreement Due: ${agreement.title}`,
            message: `Time to complete "${agreement.title}"`,
          })
        }
      }
    }
  })

  return reminders.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
}

function calculateNextRecurringDate(agreement: Agreement): Date | null {
  if (!agreement.startDate || !agreement.recurrenceFrequency) return null

  const now = new Date()
  const start = new Date(agreement.startDate)
  const completions = agreement.completions || []

  // Get the most recent completion (handle { date, completed } shape)
  const lastCompletion =
    completions.length > 0
      ? new Date(
          Math.max(
            ...completions.map((d: any) => {
              const val = typeof d === "string" ? d : d.date
              return new Date(val).getTime()
            }),
          ),
        )
      : null

  let nextDate = lastCompletion || start

  // Calculate next occurrence based on frequency
  switch (agreement.recurrenceFrequency) {
    case "daily":
      nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000)
      break
    case "weekly":
      nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case "monthly":
      nextDate = new Date(nextDate)
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
  }

  return nextDate > now ? nextDate : null
}

export function shouldShowReminder(reminder: ScheduledReminder): boolean {
  const now = new Date()
  const scheduledTime = new Date(reminder.scheduledFor)
  const timeDiff = scheduledTime.getTime() - now.getTime()

  // Show reminders that are due within the next hour
  return timeDiff > 0 && timeDiff < 60 * 60 * 1000
}
