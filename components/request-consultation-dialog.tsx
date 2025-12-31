"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar, MessageSquare, Loader2, CheckCircle } from "lucide-react"

interface RequestConsultationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  firmId: string
  firmName: string
  agreementId?: string
  agreementTitle?: string
}

export function RequestConsultationDialog({
  open,
  onOpenChange,
  firmId,
  firmName,
  agreementId,
  agreementTitle,
}: RequestConsultationDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!user) {
      setError("You must be logged in to request a consultation")
      return
    }

    if (!message.trim()) {
      setError("Please describe your case")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/consultations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmId,
          agreementId,
          message: message.trim(),
          preferredDate: preferredDate || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to request consultation")
      }

      setSuccess(true)
      
      // Redirect to agreement page or dashboard after 2 seconds
      setTimeout(() => {
        if (agreementId) {
          router.push(`/agreement/${agreementId}`)
        } else {
          router.push("/dashboard")
        }
        onOpenChange(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to request consultation")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Request Sent!</h3>
            <p className="text-slate-600 mb-4">
              Your consultation request has been sent to <strong>{firmName}</strong>.
            </p>
            <p className="text-sm text-slate-500">
              They will review your case and respond within 24-48 hours.
              You'll receive an email notification when they respond.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Consultation with {firmName}</DialogTitle>
          <DialogDescription>
            {agreementTitle 
              ? `Request legal help for: ${agreementTitle}`
              : "Describe your legal issue and preferred consultation date"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Case Description */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Describe Your Case *
            </Label>
            <Textarea
              id="message"
              placeholder="Please provide details about your legal issue, what you need help with, and any relevant background information..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              {message.length}/500 characters
            </p>
          </div>

          {/* Preferred Date */}
          <div className="space-y-2">
            <Label htmlFor="preferredDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Preferred Consultation Date (Optional)
            </Label>
            <Input
              id="preferredDate"
              type="datetime-local"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-slate-500">
              The firm will contact you to confirm availability
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

