import { Server } from 'socket.io'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'

interface SocketServer extends HTTPServer {
  io?: Server | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    res.end()
    return
  }

  const io = new Server(res.socket.server, {
    path: '/api/chat/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  })

  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join agreement chat room
    socket.on('join-chat', (agreementId: string) => {
      socket.join(`chat-${agreementId}`)
      console.log(`Socket ${socket.id} joined chat-${agreementId}`)
    })

    // Leave agreement chat room
    socket.on('leave-chat', (agreementId: string) => {
      socket.leave(`chat-${agreementId}`)
      console.log(`Socket ${socket.id} left chat-${agreementId}`)
    })

    // Handle new message
    socket.on('send-message', (data: {
      agreementId: string
      message: {
        id: string
        content: string
        userId: string
        userName: string
        timestamp: string
      }
    }) => {
      // Broadcast to all users in the chat room except sender
      socket.to(`chat-${data.agreementId}`).emit('new-message', data.message)
    })

    // Handle typing indicators
    socket.on('typing-start', (data: { agreementId: string, userId: string, userName: string }) => {
      socket.to(`chat-${data.agreementId}`).emit('user-typing', data)
    })

    socket.on('typing-stop', (data: { agreementId: string, userId: string }) => {
      socket.to(`chat-${data.agreementId}`).emit('user-stopped-typing', data)
    })

    // Handle read receipts
    socket.on('message-read', (data: { agreementId: string, messageId: string, userId: string }) => {
      socket.to(`chat-${data.agreementId}`).emit('message-read-by', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  res.end()
}