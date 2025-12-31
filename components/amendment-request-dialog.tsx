"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, Edit3, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AmendmentRequestDialogProps {
  agreementId: string
  agreementTitle: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function AmendmentRequestDialog({ 
  agreementId, 
  agreementTitle, 
  onSuccess,
  trigger 
}: AmendmentRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [proposedChanges, setProposedChanges] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError("Please provide a reason for the amendment")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/agreements/${agreementId}/request-amendment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: reason.trim(),
          proposedChanges: proposedChanges.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to request amendment")
      }

      setOpen(false)
      setReason("")
      setProposedChanges("")
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Failed to request amendment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-2" />
            Request Amendment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Request Amendment</DialogTitle>
          <DialogDescription className="text-slate-400">
            Request permission from the counterparty to amend "{agreementTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              Reason for Amendment <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to amend this agreement..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              required
            />
            <p className="text-xs text-slate-400">
              The counterparty will see this reason when deciding whether to approve your request.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposedChanges" className="text-white">
              Proposed Changes (Optional)
            </Label>
            <Textarea
              id="proposedChanges"
              value={proposedChanges}
              onChange={(e) => setProposedChanges(e.target.value)}
              placeholder="Describe what changes you want to make..."
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
            />
            <p className="text-xs text-slate-400">
              Help the counterparty understand what you plan to change.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

