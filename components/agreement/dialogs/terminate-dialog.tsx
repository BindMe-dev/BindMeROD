"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { XCircle, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TerminateDialogProps {
  agreementId: string
  agreementTitle: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function TerminateDialog({ 
  agreementId, 
  agreementTitle, 
  onSuccess,
  trigger 
}: TerminateDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError("Please provide a reason for termination")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/agreements/${agreementId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to terminate agreement")
      }

      setOpen(false)
      setReason("")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to terminate agreement")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" className="gap-2">
            <XCircle className="w-4 h-4" />
            Terminate Agreement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Terminate Agreement</DialogTitle>
          <DialogDescription className="text-slate-400">
            Terminate the active agreement "{agreementTitle}". This action will change the status to CANCELLED.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <Alert className="bg-red-950/50 border-red-900">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              <strong>Warning:</strong> This will terminate the active agreement. This action cannot be undone.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm text-slate-200">
              Reason for Termination *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're terminating this agreement..."
              rows={4}
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
              required
            />
            <p className="text-xs text-slate-400">
              Both parties will be notified and the termination will be recorded in the audit log.
            </p>
          </div>
          
          <div className="flex gap-3 pt-1">
            <Button 
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Terminating...
                </>
              ) : (
                "Terminate Agreement"
              )}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="border-slate-700 text-slate-200"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
