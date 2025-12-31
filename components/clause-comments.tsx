"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Check, Reply, MoreVertical, AtSign } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Comment {
  id: string
  agreementId: string
  userId: string
  userName: string
  userEmail: string
  clauseId?: string
  content: string
  parentId?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
  mentions?: string[]
  createdAt: Date
  updatedAt?: Date
  replies?: Comment[]
}

interface ClauseCommentsProps {
  agreementId: string
  clauseId?: string
  onCommentAdded?: () => void
}

export function ClauseComments({
  agreementId,
  clauseId,
  onCommentAdded,
}: ClauseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [agreementId, clauseId])

  const fetchComments = async () => {
    try {
      const url = clauseId
        ? `/api/agreements/${agreementId}/comments?clauseId=${clauseId}`
        : `/api/agreements/${agreementId}/comments`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      // Extract mentions (@username)
      const mentionMatches = newComment.match(/@(\w+)/g) || []
      const mentions = mentionMatches.map(m => m.substring(1))

      const response = await fetch(`/api/agreements/${agreementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          clauseId,
          parentId: replyingTo,
          mentions,
        }),
      })

      if (response.ok) {
        setNewComment("")
        setReplyingTo(null)
        fetchComments()
        onCommentAdded?.()
      }
    } catch (error) {
      console.error("Failed to post comment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(
        `/api/agreements/${agreementId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved }),
        }
      )

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error("Failed to resolve comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/agreements/${agreementId}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const unresolvedReplies = comment.replies?.filter(r => !r.resolved) || []
    const hasUnresolvedReplies = unresolvedReplies.length > 0

    if (comment.resolved && !showResolved) return null

    return (
      <div
        key={comment.id}
        className={`border-l-2 ${
          comment.resolved ? "border-green-500" : "border-blue-500"
        } pl-4 py-2 ${isReply ? "ml-8 mt-2" : "mb-4"}`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {comment.userName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.userName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
              {comment.resolved && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>

            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

            {comment.mentions && comment.mentions.length > 0 && (
              <div className="flex gap-1 mt-2">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Mentioned: {comment.mentions.join(", ")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {!comment.resolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolveComment(comment.id, true)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              )}

              {comment.resolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolveComment(comment.id, false)}
                >
                  Reopen
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  const topLevelComments = comments.filter(c => !c.parentId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {clauseId ? "Clause Comments" : "Agreement Comments"}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? "Hide" : "Show"} Resolved
        </Button>
      </div>

      {/* Comment input */}
      <div className="space-y-2">
        {replyingTo && (
          <div className="text-sm text-muted-foreground">
            Replying to comment...{" "}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <Textarea
          placeholder="Add a comment... (use @username to mention)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
        />
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Tip: Use @username to mention someone
          </span>
          <Button
            onClick={handleSubmitComment}
            disabled={loading || !newComment.trim()}
          >
            {loading ? "Posting..." : replyingTo ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-2">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}
