import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/notifications/route'
import { PATCH, DELETE } from '@/app/api/notifications/[id]/route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    query: {
      notifications: {
        findMany: jest.fn()
      }
    },
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn()
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn()
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn()
      })
    })
  }
}))

jest.mock('@/lib/server-auth', () => ({
  getUserIdFromRequest: jest.fn()
}))

jest.mock('@/lib/db/schema', () => ({
  notifications: {
    userId: 'userId',
    id: 'id'
  }
}))

import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/server-auth'

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/notifications', () => {
    it('returns notifications for authenticated user', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      ;(db.query.notifications.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'notif1',
          userId: 'user1',
          type: 'deadline_reminder',
          title: 'Test',
          message: 'Test message',
          read: false,
          createdAt: new Date()
        }
      ])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications).toHaveLength(1)
      expect(db.query.notifications.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        limit: 100,
        orderBy: expect.any(Function)
      })
    })

    it('returns 401 for unauthenticated user', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('handles database errors', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      ;(db.query.notifications.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to load notifications')
    })
  })

  describe('POST /api/notifications', () => {
    it('creates notification for authenticated user', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      
      const mockInsert = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 'new-notif',
            userId: 'user1',
            type: 'deadline_reminder',
            title: 'Test',
            message: 'Test message'
          }])
        })
      }
      ;(db.insert as jest.Mock).mockReturnValue(mockInsert)

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deadline_reminder',
          title: 'Test',
          message: 'Test message',
          agreementId: 'agreement1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notification).toBeDefined()
      expect(mockInsert.values).toHaveBeenCalledWith({
        id: expect.any(String),
        userId: 'user1',
        type: 'deadline_reminder',
        title: 'Test',
        message: 'Test message',
        agreementId: 'agreement1'
      })
    })

    it('returns 400 for missing required fields', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deadline_reminder'
          // Missing title and message
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('returns 401 for unauthenticated user', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deadline_reminder',
          title: 'Test',
          message: 'Test message'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/notifications/[id]', () => {
    it('updates notification read status', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      
      const mockUpdate = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'notif1' }])
          })
        })
      }
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost/api/notifications/notif1', {
        method: 'PATCH',
        body: JSON.stringify({ read: true })
      })

      const response = await PATCH(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockUpdate.set).toHaveBeenCalledWith({ read: true })
    })

    it('returns 404 for non-existent notification', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      
      const mockUpdate = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      }
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost/api/notifications/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ read: true })
      })

      const response = await PATCH(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })
  })

  describe('DELETE /api/notifications/[id]', () => {
    it('deletes notification', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      
      const mockDelete = {
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'notif1' }])
        })
      }
      ;(db.delete as jest.Mock).mockReturnValue(mockDelete)

      const request = new NextRequest('http://localhost/api/notifications/notif1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'notif1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
    })

    it('returns 404 for non-existent notification', async () => {
      ;(getUserIdFromRequest as jest.Mock).mockResolvedValue('user1')
      
      const mockDelete = {
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([])
        })
      }
      ;(db.delete as jest.Mock).mockReturnValue(mockDelete)

      const request = new NextRequest('http://localhost/api/notifications/nonexistent', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })
  })
})

