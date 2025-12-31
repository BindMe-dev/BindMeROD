import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { NotificationBell } from '@/components/notification-bell'
import { NotificationProvider } from '@/lib/notification-store'
import type { Notification } from '@/lib/notification-types'

// Mock dependencies
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com', name: 'Test User' }
  })
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

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
  },
  {
    id: 'notif3',
    userId: 'user2',
    type: 'achievement_unlocked',
    title: 'Achievement',
    message: 'Different user notification',
    read: false,
    createdAt: new Date().toISOString()
  }
]

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: mockNotifications })
    })
  })

  it('displays correct unread count', async () => {
    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Only user1's unread notifications
    })
  })

  it('shows 9+ for counts over 9', async () => {
    const manyNotifications = Array.from({ length: 12 }, (_, i) => ({
      id: `notif${i}`,
      userId: 'user1',
      type: 'deadline_reminder' as const,
      title: `Notification ${i}`,
      message: `Message ${i}`,
      read: false,
      createdAt: new Date().toISOString()
    }))

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: manyNotifications })
    })

    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument()
    })
  })

  it('opens notification panel when clicked', async () => {
    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
    })
  })

  it('filters notifications by current user', async () => {
    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
      expect(screen.getByText('New Partner Request')).toBeInTheDocument()
      expect(screen.queryByText('Different user notification')).not.toBeInTheDocument()
    })
  })

  it('navigates to agreement when notification with agreementId is clicked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Deadline Approaching'))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/agreement/agreement1')
    })
  })

  it('marks notification as read when clicked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Deadline Approaching'))

    expect(fetch).toHaveBeenCalledWith('/api/notifications/notif1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ read: true })
    })
  })

  it('deletes notification when delete button is clicked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('×')
    fireEvent.click(deleteButtons[0])

    expect(fetch).toHaveBeenCalledWith('/api/notifications/notif1', {
      method: 'DELETE',
      credentials: 'include'
    })
  })

  it('shows mark all read button when there are unread notifications', async () => {
    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument()
    })
  })

  it('shows empty state when no notifications', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [] })
    })

    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument()
    })
  })

  it('displays relative time correctly', async () => {
    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText(/ago/)).toBeInTheDocument()
    })
  })
})

