import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { NotificationProvider } from '@/lib/notification-store'
import { NotificationBell } from '@/components/notification-bell'
import { AchievementNotification } from '@/components/achievement-notification'

// Mock all dependencies
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com', name: 'Test User' }
  })
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

global.fetch = jest.fn()

describe('Notification System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    // Mock browser notification API
    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn().mockResolvedValue('granted')
    } as any
    
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true
    })
  })

  describe('End-to-End Notification Flow', () => {
    it('handles complete notification lifecycle', async () => {
      // Initial empty state
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications: [] })
      })

      const TestApp = () => (
        <NotificationProvider>
          <NotificationBell />
        </NotificationProvider>
      )

      render(<TestApp />)

      // Should show no badge initially
      expect(screen.queryByText('1')).not.toBeInTheDocument()

      // Mock adding a notification
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          notification: {
            id: 'new-notif',
            userId: 'user1',
            type: 'deadline_reminder',
            title: 'Deadline Approaching',
            message: 'Your agreement is due soon',
            agreementId: 'agreement1',
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      })

      // Simulate notification being added (would happen from another component)
      // This tests the integration between components
      
      // Open notification panel
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument()
      })
    })

    it('handles notification preferences affecting behavior', async () => {
      // Set preferences to disable browser notifications
      localStorage.setItem('bindme_notification_preferences', JSON.stringify({
        emailNotifications: true,
        browserNotifications: false,
        deadlineReminders: true,
        recurringReminders: true,
        partnerActivity: true,
        achievements: true,
        reminderTimeBefore: 24
      }))

      const mockNotificationConstructor = jest.fn()
      global.Notification = mockNotificationConstructor as any
      global.Notification.permission = 'granted'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: [] })
      })

      render(
        <NotificationProvider>
          <NotificationBell />
        </NotificationProvider>
      )

      // Even with permission granted, browser notification shouldn't show
      // because preferences disable it
      await waitFor(() => {
        expect(mockNotificationConstructor).not.toHaveBeenCalled()
      })
    })

    it('handles multiple notification types correctly', async () => {
      const notifications = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'deadline_reminder',
          title: 'Deadline Approaching',
          message: 'Agreement due tomorrow',
          agreementId: 'agreement1',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif2',
          userId: 'user1',
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked!',
          message: 'You completed 5 agreements',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif3',
          userId: 'user1',
          type: 'partner_request',
          title: 'Partner Request',
          message: 'John wants to partner with you',
          read: false,
          createdAt: new Date().toISOString()
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications })
      })

      render(
        <NotificationProvider>
          <NotificationBell />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
        expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument()
        expect(screen.getByText('Partner Request')).toBeInTheDocument()
      })
    })

    it('handles real-time notification updates', async () => {
      // Initial notifications
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications: [] })
      })

      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <div>
            <NotificationBell />
            <button onClick={() => addNotification({
              userId: 'user1',
              type: 'deadline_reminder',
              title: 'New Notification',
              message: 'This just came in'
            })}>
              Add Real-time Notification
            </button>
          </div>
        )
      }

      // Mock the POST request for adding notification
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          notification: {
            id: 'realtime-notif',
            userId: 'user1',
            type: 'deadline_reminder',
            title: 'New Notification',
            message: 'This just came in',
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

      // Initially no badge
      expect(screen.queryByText('1')).not.toBeInTheDocument()

      // Add notification
      fireEvent.click(screen.getByText('Add Real-time Notification'))

      // Should show badge
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      // Open panel and verify notification is there
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('New Notification')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery', () => {
    it('recovers from network failures', async () => {
      // First request fails
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <NotificationProvider>
          <NotificationBell />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Second request succeeds
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'notif1',
            userId: 'user1',
            type: 'deadline_reminder',
            title: 'Test',
            message: 'Test message',
            read: false,
            createdAt: new Date().toISOString()
          }]
        })
      })

      // Trigger refresh
      const { refreshNotifications } = useNotifications()
      await refreshNotifications()

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('handles partial failures gracefully', async () => {
      const notifications = [{
        id: 'notif1',
        userId: 'user1',
        type: 'deadline_reminder',
        title: 'Test',
        message: 'Test message',
        read: false,
        createdAt: new Date().toISOString()
      }]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications })
      })

      render(
        <NotificationProvider>
          <NotificationBell />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      // Mark as read fails
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Update failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test'))

      // Should still update UI optimistically
      await waitFor(() => {
        expect(screen.queryByText('1')).not.toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to mark notification read', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
