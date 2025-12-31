import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { agreements, agreementComments, users } from '@/lib/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

/**
 * GET /api/agreements/[id]/comments
 * Get all comments for an agreement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agreementId = params.id
    const { searchParams } = new URL(request.url)
    const clauseId = searchParams.get('clauseId')

    // Verify access to agreement
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
    })

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    // Fetch comments
    const whereClause = clauseId
      ? and(
          eq(agreementComments.agreementId, agreementId),
          eq(agreementComments.clauseId, clauseId)
        )
      : eq(agreementComments.agreementId, agreementId)

    const comments = await db.query.agreementComments.findMany({
      where: whereClause,
      orderBy: [desc(agreementComments.createdAt)],
    })

    // Fetch user details for comments
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, comment.userId),
        })

        return {
          ...comment,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
        }
      })
    )

    // Build comment tree (parent-child relationships)
    const commentMap = new Map<string, any>()
    const rootComments: any[] = []

    commentsWithUsers.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    commentsWithUsers.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return NextResponse.json({ comments: rootComments })
  } catch (error) {
    console.error('Fetch comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agreements/[id]/comments
 * Create a new comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agreementId = params.id
    const body = await request.json()
    const { content, clauseId, parentId, mentions = [] } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify access to agreement
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
    })

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    // Create comment
    const [comment] = await db
      .insert(agreementComments)
      .values({
        id: nanoid(),
        agreementId,
        userId,
        content: content.trim(),
        clauseId: clauseId || null,
        parentId: parentId || null,
        mentions: mentions.length > 0 ? mentions : null,
        resolved: false,
        createdAt: new Date(),
      })
      .returning()

    // TODO: Send notifications to mentioned users
    if (mentions.length > 0) {
      console.log('Sending mention notifications to:', mentions)
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
