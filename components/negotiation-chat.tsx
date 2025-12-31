"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  chatId: string
  userId: string
  userName: string
  content: string
  type: string
  createdAt: Date
  isEdited: boolean
}

interface NegotiationChatProps {
  agreementId: string
  currentUserId: string
  currentUserName: string
}

export function NegotiationChat({
  agreementId,
  currentUserId,
  currentUserName,
}: NegotiationChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [otherPartyTyping, setOtherPartyTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    initializeChat()
    // TODO: Replace polling with WebSocket/Pusher for real-time updates
    // Current polling every 3 seconds can create server load with many users
    const interval = setInterval(fetchMessages, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [agreementId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const initializeChat = async () => {
    try {
      const response = await fetch(`/api/agreements/${agreementId}/messages`, {
        method: "POST",
      })
      
      if (response.ok) {
        const data = await response.json()
        setChatId(data.chatId)
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error)
    }
  }

  const fetchMessages = async () => {
    if (!chatId) return

    try {
      const response = await fetch(`/api/agreements/${agreementId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setOtherPartyTyping(data.someoneTyping || false)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/agreements/${agreementId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: "text",
        }),
      })

      if (response.ok) {
        setNewMessage("")
        await fetchMessages()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator
    fetch(`/api/agreements/${agreementId}/messages/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    })

    // Auto-clear typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/agreements/${agreementId}/messages/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: false }),
      })
    }, 3000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <h3 className="font-semibold">Negotiation Chat</h3>
        <p className="text-sm text-muted-foreground">
          Discuss terms and conditions with the other party
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.userId === currentUserId
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!isOwnMessage && (
                        <span className="text-sm font-semibold">
                          {message.userName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                      {message.isEdited && (
                        <Badge variant="outline" className="text-xs">
                          Edited
                        </Badge>
                      )}
                    </div>

                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {otherPartyTyping && (
            <div className="flex gap-3 items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Other party is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
