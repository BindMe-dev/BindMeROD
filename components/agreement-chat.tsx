"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Send, X, Paperclip, FileText, Image, Mic, Smile, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRealtimeClient } from '@/lib/realtime-client'

interface MessageAttachment {
  url: string
  name: string
  type?: string
}

interface Message {
  id: string
  content?: string
  userId: string
  user: { id: string; name: string }
  createdAt: string
  type: 'text' | 'file' | 'system' | 'voice'
  attachments?: MessageAttachment[]
}

interface AgreementChatProps {
  agreementId: string
}

export function AgreementChat({ agreementId }: AgreementChatProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (isOpen && user) {
      loadMessages()
      
      const client = getRealtimeClient()
      if (client) {
        const channel = client.subscribe(`chat-${agreementId}`)
        channel.bind('new-message', (data: Message) => {
          setMessages(prev => {
            if (prev.find(m => m.id === data.id)) return prev
            return [...prev, data]
          })
        })
        
        return () => {
          channel.unbind('new-message')
          client.unsubscribe(`chat-${agreementId}`)
        }
      }
    }
  }, [isOpen, agreementId, user])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [isOpen, messages])

  const loadMessages = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const response = await fetch(`/api/chat/${agreementId}`)
      const data = await response.json()
      const newMessages = data.messages || []
      
      // Only update if there are actually new messages
      setMessages(prev => {
        if (prev.length === newMessages.length) return prev
        return newMessages
      })
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile && !audioBlob) || !user || isSending) return

    setIsSending(true)
    const messageContent = newMessage
    const file = selectedFile
    const audio = audioBlob
    setNewMessage('')
    setSelectedFile(null)
    setAudioBlob(null)

    try {
      if (file || audio) {
        const formData = new FormData()
        if (audio) {
          formData.append('file', audio, 'voice-note.webm')
          formData.append('type', 'voice')
        } else {
          formData.append('file', file!)
          formData.append('type', 'file')
        }
        formData.append('userId', user.id)
        if (messageContent) formData.append('content', messageContent)

        const response = await fetch(`/api/chat/${agreementId}`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const savedMessage = await response.json()
          setMessages(prev => [...prev, savedMessage])
          scrollToBottom()
        } else {
          throw new Error('Failed to send file')
        }
      } else {
        const response = await fetch(`/api/chat/${agreementId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: messageContent,
            userId: user.id,
            type: 'text'
          })
        })

        if (response.ok) {
          const savedMessage = await response.json()
          setMessages(prev => [...prev, savedMessage])
          scrollToBottom()
        } else {
          throw new Error('Failed to send message')
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setNewMessage(messageContent)
      setSelectedFile(file)
      setAudioBlob(audio)
    } finally {
      setIsSending(false)
    }
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser')
        return
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return date.toLocaleDateString()
  }

  if (!user) return null

  return (
    <>
      {/* Floating Chat Bubble */}
      <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-8 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-blue-600 hover:bg-blue-700 text-white",
            isOpen && "scale-0 opacity-0"
          )}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Panel */}
      <div className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100%-1.5rem)] max-w-sm sm:w-80 h-[60vh] sm:h-96 bg-slate-950 text-slate-100 rounded-2xl sm:rounded-xl shadow-2xl border border-slate-800 transition-all duration-300 flex flex-col",
        isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 rounded-t-2xl sm:rounded-t-xl">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-sm text-white">Agreement Chat</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 p-0 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-925">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.userId === user.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm",
                    message.userId === user.id
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700"
                  )}>
                    {message.userId !== user.id && (
                      <div className="text-xs opacity-70 mb-1">{message.user.name}</div>
                    )}
                    {message.type === 'file' && message.attachments?.[0] ? (
                      <div className="space-y-2">
                        {message.attachments[0].type?.startsWith('image/') ? (
                          <div className="space-y-2">
                            <img 
                              src={message.attachments[0].url} 
                              alt={message.attachments[0].name}
                              className="max-w-full h-auto rounded border border-slate-700 max-h-48 object-cover"
                            />
                            <div className="text-xs opacity-80">{message.attachments[0].name}</div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-700">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs">{message.attachments[0].name}</span>
                          </div>
                        )}
                        {message.content && <div>{message.content}</div>}
                      </div>
                    ) : message.type === 'voice' && message.attachments?.[0] ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-white/10 rounded border">
                          <Mic className="w-4 h-4" />
                          <audio controls className="max-w-full">
                            <source src={message.attachments[0].url} type="audio/webm" />
                          </audio>
                        </div>
                        {message.content && <div>{message.content}</div>}
                      </div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                    <div className={cn(
                      "text-xs mt-1 opacity-70",
                      message.userId === user.id ? "text-right" : "text-left"
                    )}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-2xl sm:rounded-b-xl">
          {(selectedFile || audioBlob) && (
            <div className="mb-2 p-2 bg-slate-800 border border-slate-700 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                {audioBlob ? (
                  <Mic className="w-4 h-4 text-blue-400" />
                ) : selectedFile?.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-blue-400" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-400" />
                )}
                <span className="text-sm text-slate-100">
                  {audioBlob ? 'Voice note' : selectedFile?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  setAudioBlob(null)
                }}
                className="h-6 w-6 p-0 text-slate-300 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {showEmojiPicker && (
            <div className="mb-2 p-2 bg-white border rounded shadow-lg">
              <div className="grid grid-cols-8 gap-1 text-lg">
                {['😀','😂','😍','🥰','😊','😎','🤔','😢','😡','👍','👎','❤️','🎉','🔥','💯','✅'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="hover:bg-gray-100 p-1 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setSelectedFile(file)
              }}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="px-2"
              disabled={isSending || isRecording}
            >
              <Paperclip className="h-4 w-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-2"
              disabled={isSending || isRecording}
            >
              <Smile className="h-4 w-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "px-2",
                isRecording && "bg-red-100 text-red-600"
              )}
              disabled={isSending}
            >
              <Mic className="h-4 w-4 text-slate-400" />
            </Button>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={selectedFile || audioBlob ? "Add a message..." : "Type a message..."}
              className="flex-1 text-sm bg-transparent border-0 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
              disabled={isSending}
            />
            <Button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending}
              size="sm"
              className="px-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
