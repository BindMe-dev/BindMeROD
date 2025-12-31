import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { NotificationProvider, useNotifications } from '@/lib/notification-store'

// Test all notification scenarios
describe('Notification Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    global.fetch = jest.fn()
  })

  describe('Agreement Lifecycle Notifications', () => {
    it('handles deadline reminder notifications', async () => {
      const TestComponent = () => {
        const { addNotification, notifications } = useNotifications()
        return (
          <div>
            <button onClick={() => addNotification({
              userId: 'user1',
              type: 'deadline_reminder',
              title: 'Deadline Approaching',
              message: 'Your agreement "Weekly Exercise" is due in 24 hours',
              agreementId: 'agreement1'
            })}>
              Add Deadline Reminder
            </button>
            <div data-testid="notifications">{JSON.stringify(notifications)}</div>
          </div>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: {
              id: 'deadline-notif',
              userId: 'user1',
              type: 'deadline_reminder',
              title: 'Deadline Approaching',
              message: 'Your agreement "Weekly Exercise" is due in 24 hours',
              agreementId: 'agreement1',
              read: false,
              createdAt: new Date().toISOString()
            }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Deadline Reminder'))

      await waitFor(() => {
        const notificationsData = JSON.parse(screen.getByTestId('notifications').textContent!)
        expect(notificationsData).toHaveLength(1)
        expect(notificationsData[0].type).toBe('deadline_reminder')
        expect(notificationsData[0].agreementId).toBe('agreement1')
      })
    })

    it('handles recurring due notifications', async () => {
      const TestComponent = () => {
        const { addNotification, notifications } = useNotifications()
        return (
          <div>
            <button onClick={() => addNotification({
              userId: 'user1',
              type: 'recurring_due',
              title: 'Recurring Agreement Due',
              message: 'Time to complete "Daily Meditation"',
              agreementId: 'recurring1'
            })}>
              Add Recurring Due
            </button>
            <div data-testid="count">{notifications.length}</div>
          </div>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: {
              id: 'recurring-notif',
              type: 'recurring_due',
              title: 'Recurring Agreement Due',
              message: 'Time to complete "Daily Meditation"'
            }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Recurring Due'))

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1')
      })
    })

    it('handles agreement signature notifications', async () => {
      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'agreement_signature',
            title: 'Agreement Signed',
            message: 'John Doe signed as counterparty on "Business Partnership"',
            agreementId: 'partnership1'
          })}>
            Add Signature Notification
          </button>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: {
              id: 'signature-notif',
              type: 'agreement_signature',
              title: 'Agreement Signed',
              message: 'John Doe signed as counterparty on "Business Partnership"'
            }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Signature Notification'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            userId: 'user1',
            type: 'agreement_signature',
            title: 'Agreement Signed',
            message: 'John Doe signed as counterparty on "Business Partnership"',
            agreementId: 'partnership1'
          })
        }))
      })
    })

    it('handles witness request notifications', async () => {
      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'witness_request',
            title: 'Witness Request',
            message: 'You have been requested to witness "Marriage Contract"',
            agreementId: 'marriage1'
          })}>
            Add Witness Request
          </button>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: {
              id: 'witness-notif',
              type: 'witness_request'
            }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Witness Request'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
          body: JSON.stringify({
            userId: 'user1',
            type: 'witness_request',
            title: 'Witness Request',
            message: 'You have been requested to witness "Marriage Contract"',
            agreementId: 'marriage1'
          })
        }))
      })
    })
  })

  describe('Social Notifications', () => {
    it('handles partner request notifications', async () => {
      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'partner_request',
            title: 'Partner Request',
            message: 'Sarah Johnson wants to be your accountability partner'
          })}>
            Add Partner Request
          </button>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: { id: 'partner-notif', type: 'partner_request' }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Partner Request'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
          body: JSON.stringify({
            userId: 'user1',
            type: 'partner_request',
            title: 'Partner Request',
            message: 'Sarah Johnson wants to be your accountability partner'
          })
        }))
      })
    })

    it('handles agreement shared notifications', async () => {
      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'agreement_shared',
            title: 'Agreement Shared',
            message: 'Mike shared "Fitness Challenge" with you',
            agreementId: 'fitness1'
          })}>
            Add Shared Agreement
          </button>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: { id: 'shared-notif', type: 'agreement_shared' }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Shared Agreement'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
          body: JSON.stringify({
            userId: 'user1',
            type: 'agreement_shared',
            title: 'Agreement Shared',
            message: 'Mike shared "Fitness Challenge" with you',
            agreementId: 'fitness1'
          })
        }))
      })
    })
  })

  describe('Achievement Notifications', () => {
    it('handles achievement unlocked notifications', async () => {
      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'achievement_unlocked',
            title: 'Achievement Unlocked!',
            message: 'You earned "Commitment Keeper" - Complete 10 agreements'
          })}>
            Add Achievement
          </button>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: { id: 'achievement-notif', type: 'achievement_unlocked' }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Achievement'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
          body: JSON.stringify({
            userId: 'user1',
            type: 'achievement_unlocked',
            title: 'Achievement Unlocked!',
            message: 'You earned "Commitment Keeper" - Complete 10 agreements'
          })
        }))
      })
    })
  })

  describe('Support Notifications', () => {
    it('handles support message notifications', async () => {
      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'support_message',
            title: 'Support Response',
            message: 'We have responded to your support ticket #12345'
          })}>
            Add Support Message
          </button>
        )
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: { id: 'support-notif', type: 'support_message' }
          })
        })

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Support Message'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
          body: JSON.stringify({
            userId: 'user1',
            type: 'support_message',
            title: 'Support Response',
            message: 'We have responded to your support ticket #12345'
          })
        }))
      })
    })
  })

  describe('Notification Preferences Impact', () => {
    it('respects deadline reminder preferences', async () => {
      localStorage.setItem('bindme_notification_preferences', JSON.stringify({
        emailNotifications: true,
        browserNotifications: true,
        deadlineReminders: false, // Disabled
        recurringReminders: true,
        partnerActivity: true,
        achievements: true,
        reminderTimeBefore: 24
      }))

      const TestComponent = () => {
        const { preferences } = useNotifications()
        return <div data-testid="deadline-pref">{preferences.deadlineReminders.toString()}</div>
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      expect(screen.getByTestId('deadline-pref')).toHaveTextContent('false')
    })

    it('respects browser notification preferences', async () => {
      localStorage.setItem('bindme_notification_preferences', JSON.stringify({
        emailNotifications: true,
        browserNotifications: false, // Disabled
        deadlineReminders: true,
        recurringReminders: true,
        partnerActivity: true,
        achievements: true,
        reminderTimeBefore: 24
      }))

      global.Notification = {
        permission: 'granted'
      } as any

      const mockNotificationConstructor = jest.fn()
      global.Notification = mockNotificationConstructor as any
      global.Notification.permission = 'granted'

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true
      })

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notifications: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            notification: {
              id: 'test-notif',
              title: 'Test',
              message: 'Test message'
            }
          })
        })

      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'deadline_reminder',
            title: 'Test',
            message: 'Test message'
          })}>
            Add Notification
          </button>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Notification'))

      await waitFor(() => {
        // Should not create browser notification because preference is disabled
        expect(mockNotificationConstructor).not.toHaveBeenCalled()
      })
    })
  })
})
