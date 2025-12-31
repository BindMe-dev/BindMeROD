import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agreementChats, chatMessages, chatParticipants, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { triggerChatMessage } from '@/lib/realtime'

export async function GET(request: NextRequest, { params }: { params: Promise<{ agreementId: string }> }) {
  try {
    const { agreementId } = await params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Get or create chat for agreement
    let chat = await db.query.agreementChats.findFirst({
      where: eq(agreementChats.agreementId, agreementId)
    })

    if (!chat) {
      const [newChat] = await db.insert(agreementChats).values({
        id: nanoid(),
        agreementId,
        isActive: true,
      }).returning()
      chat = newChat
    }

    // Get messages with pagination
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.chatId, chat.id),
      orderBy: [desc(chatMessages.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({
      chatId: chat.id,
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ agreementId: string }> }) {
  try {
    const { agreementId } = await params
    const contentType = request.headers.get('content-type')
    
    let content, userId, type
    let attachments: any[] = []
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File
      userId = formData.get('userId') as string
      type = formData.get('type') as string || 'file'
      content = formData.get('content') as string || (type === 'voice' ? 'Voice message' : `Shared ${file.name}`)
      
      if (file) {
        attachments = [{
          name: file.name,
          size: file.size,
          type: file.type,
          url: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`
        }]
      }
    } else {
      // Handle JSON request
      const body = await request.json()
      content = body.content
      userId = body.userId
      type = body.type || 'text'
    }

    if (!content || !userId) {
      return NextResponse.json({ error: 'Content and userId are required' }, { status: 400 })
    }

    // Get or create chat for agreement
    let chat = await db.query.agreementChats.findFirst({
      where: eq(agreementChats.agreementId, agreementId)
    })

    if (!chat) {
      const [newChat] = await db.insert(agreementChats).values({
        id: nanoid(),
        agreementId,
        isActive: true,
      }).returning()
      chat = newChat
    }

    // Create message
    const [message] = await db.insert(chatMessages).values({
      id: nanoid(),
      chatId: chat.id,
      userId,
      content,
      type,
      attachments,
    }).returning()

    // Update chat last message timestamp
    await db.update(agreementChats)
      .set({ lastMessageAt: new Date() })
      .where(eq(agreementChats.id, chat.id))

    // Get user info for response
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true }
    })

    const messageResponse = {
      ...message,
      user
    }

    // Trigger Pusher event
    await triggerChatMessage(agreementId, messageResponse)

    return NextResponse.json(messageResponse)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}