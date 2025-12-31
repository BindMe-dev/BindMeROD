import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { NotificationProvider, useNotifications } from '@/lib/notification-store'
import { NotificationBell } from '@/components/notification-bell'
import type { Notification, NotificationPreferences } from '@/lib/notification-types'

// Mock dependencies
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

// Mock fetch
global.fetch = jest.fn()

const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'user1',
    type: 'deadline_reminder',
    title: 'Deadline Approaching',
    message: 'Your agreement is due tomorrow',
    agreementId: 'agreement1',
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif2',
    userId: 'user1',
    type: 'partner_request',
    title: 'New Partner Request',
    message: 'John wants to partner with you',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
]

describe('Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    // Mock successful API responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: mockNotifications })
    })
  })

  describe('NotificationProvider', () => {
    it('loads notifications on mount', async () => {
      const TestComponent = () => {
        const { notifications } = useNotifications()
        return <div data-testid="notification-count">{notifications.length}</div>
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
      })

      expect(fetch).toHaveBeenCalledWith('/api/notifications', { credentials: 'include' })
    })

    it('loads preferences from localStorage', () => {
      const customPrefs = {
        emailNotifications: false,
        browserNotifications: true,
        deadlineReminders: false,
        recurringReminders: true,
        partnerActivity: false,
        achievements: true,
        reminderTimeBefore: 48
      }
      localStorage.setItem('bindme_notification_preferences', JSON.stringify(customPrefs))

      const TestComponent = () => {
        const { preferences } = useNotifications()
        return <div data-testid="prefs">{JSON.stringify(preferences)}</div>
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      expect(screen.getByTestId('prefs')).toHaveTextContent(JSON.stringify(customPrefs))
    })

    it('saves preferences to localStorage when updated', async () => {
      const TestComponent = () => {
        const { updatePreferences, preferences } = useNotifications()
        return (
          <button onClick={() => updatePreferences({ emailNotifications: false })}>
            Update
          </button>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Update'))

      await waitFor(() => {
        const stored = localStorage.getItem('bindme_notification_preferences')
        expect(JSON.parse(stored!)).toMatchObject({ emailNotifications: false })
      })
    })
  })

  describe('Notification Actions', () => {
    it('adds notification successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          notification: {
            id: 'new-notif',
            userId: 'user1',
            type: 'achievement_unlocked',
            title: 'Achievement!',
            message: 'You unlocked something',
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      })

      const TestComponent = () => {
        const { addNotification, notifications } = useNotifications()
        return (
          <div>
            <button onClick={() => addNotification({
              userId: 'user1',
              type: 'achievement_unlocked',
              title: 'Achievement!',
              message: 'You unlocked something'
            })}>
              Add Notification
            </button>
            <div data-testid="count">{notifications.length}</div>
          </div>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('2')
      })

      fireEvent.click(screen.getByText('Add Notification'))

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3')
      })

      expect(fetch).toHaveBeenCalledWith('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: 'user1',
          type: 'achievement_unlocked',
          title: 'Achievement!',
          message: 'You unlocked something'
        })
      })
    })

    it('marks notification as read', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const TestComponent = () => {
        const { markAsRead, notifications } = useNotifications()
        const unreadCount = notifications.filter(n => !n.read).length
        return (
          <div>
            <button onClick={() => markAsRead('notif1')}>Mark Read</button>
            <div data-testid="unread">{unreadCount}</div>
          </div>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unread')).toHaveTextContent('1')
      })

      fireEvent.click(screen.getByText('Mark Read'))

      await waitFor(() => {
        expect(screen.getByTestId('unread')).toHaveTextContent('0')
      })

      expect(fetch).toHaveBeenCalledWith('/api/notifications/notif1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ read: true })
      })
    })

    it('marks all notifications as read', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      })

      const TestComponent = () => {
        const { markAllAsRead, notifications } = useNotifications()
        const unreadCount = notifications.filter(n => !n.read).length
        return (
          <div>
            <button onClick={markAllAsRead}>Mark All Read</button>
            <div data-testid="unread">{unreadCount}</div>
          </div>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unread')).toHaveTextContent('1')
      })

      fireEvent.click(screen.getByText('Mark All Read'))

      await waitFor(() => {
        expect(screen.getByTestId('unread')).toHaveTextContent('0')
      })
    })

    it('deletes notification', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const TestComponent = () => {
        const { deleteNotification, notifications } = useNotifications()
        return (
          <div>
            <button onClick={() => deleteNotification('notif1')}>Delete</button>
            <div data-testid="count">{notifications.length}</div>
          </div>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('2')
      })

      fireEvent.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1')
      })

      expect(fetch).toHaveBeenCalledWith('/api/notifications/notif1', {
        method: 'DELETE',
        credentials: 'include'
      })
    })

    it('clears all notifications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      })

      const TestComponent = () => {
        const { clearAll, notifications } = useNotifications()
        return (
          <div>
            <button onClick={clearAll}>Clear All</button>
            <div data-testid="count">{notifications.length}</div>
          </div>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('2')
      })

      fireEvent.click(screen.getByText('Clear All'))

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0')
      })
    })
  })

  describe('Browser Notifications', () => {
    beforeEach(() => {
      // Mock Notification API
      global.Notification = {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted')
      } as any
      
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true
      })
    })

    it('requests browser permission', async () => {
      const TestComponent = () => {
        const { requestBrowserPermission, browserPermission } = useNotifications()
        return (
          <div>
            <button onClick={requestBrowserPermission}>Request Permission</button>
            <div data-testid="permission">{browserPermission}</div>
          </div>
        )
      }

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      expect(screen.getByTestId('permission')).toHaveTextContent('default')

      fireEvent.click(screen.getByText('Request Permission'))

      await waitFor(() => {
        expect(screen.getByTestId('permission')).toHaveTextContent('granted')
      })

      expect(Notification.requestPermission).toHaveBeenCalled()
    })

    it('shows browser notification when page is hidden', async () => {
      const mockNotificationConstructor = jest.fn()
      global.Notification = mockNotificationConstructor as any
      global.Notification.permission = 'granted'

      localStorage.setItem('bindme_notification_preferences', JSON.stringify({
        browserNotifications: true,
        emailNotifications: true,
        deadlineReminders: true,
        recurringReminders: true,
        partnerActivity: true,
        achievements: true,
        reminderTimeBefore: 24
      }))

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          notification: {
            id: 'browser-notif',
            title: 'Test Notification',
            message: 'This should show as browser notification'
          }
        })
      })

      const TestComponent = () => {
        const { addNotification } = useNotifications()
        return (
          <button onClick={() => addNotification({
            userId: 'user1',
            type: 'deadline_reminder',
            title: 'Test Notification',
            message: 'This should show as browser notification'
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
        expect(mockNotificationConstructor).toHaveBeenCalledWith('Test Notification', {
          body: 'This should show as browser notification',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

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

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      )

      fireEvent.click(screen.getByText('Add Notification'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to add notification', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('handles failed notification refresh', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <NotificationProvider>
          <div>Test</div>
        </NotificationProvider>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Notification refresh failed', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})

