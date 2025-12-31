import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { agreementComments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/agreements/[id]/comments/[commentId]
 * Update a comment (resolve/unresolve)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = params
    const body = await request.json()
    const { resolved, content } = body

    // Fetch comment
    const comment = await db.query.agreementComments.findFirst({
      where: eq(agreementComments.id, commentId),
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Update comment
    const updates: any = { updatedAt: new Date() }
    
    if (typeof resolved === 'boolean') {
      updates.resolved = resolved
      updates.resolvedBy = resolved ? userId : null
      updates.resolvedAt = resolved ? new Date() : null
    }

    if (content !== undefined) {
      // Only allow editing your own comments
      if (comment.userId !== userId) {
        return NextResponse.json(
          { error: 'You can only edit your own comments' },
          { status: 403 }
        )
      }
      updates.content = content
    }

    const [updatedComment] = await db
      .update(agreementComments)
      .set(updates)
      .where(eq(agreementComments.id, commentId))
      .returning()

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agreements/[id]/comments/[commentId]
 * Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = params

    // Fetch comment
    const comment = await db.query.agreementComments.findFirst({
      where: eq(agreementComments.id, commentId),
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only allow deleting your own comments
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Delete comment
    await db
      .delete(agreementComments)
      .where(eq(agreementComments.id, commentId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
