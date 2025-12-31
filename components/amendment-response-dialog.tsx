"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AmendmentResponseDialogProps {
  agreementId: string
  agreementTitle: string
  amendmentReason: string
  amendmentProposedChanges?: string | null
  requestedBy: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AmendmentResponseDialog({ 
  agreementId, 
  agreementTitle,
  amendmentReason,
  amendmentProposedChanges,
  requestedBy,
  open,
  onOpenChange,
  onSuccess
}: AmendmentResponseDialogProps) {
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRespond = async (approved: boolean) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/agreements/${agreementId}/respond-amendment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          approved,
          response: response.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to respond to amendment request")
      }

      onOpenChange(false)
      setResponse("")
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Failed to respond to amendment request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Amendment Request</DialogTitle>
          <DialogDescription className="text-slate-400">
            The creator has requested permission to amend "{agreementTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-white">Requested By</Label>
            <p className="text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg p-3">
              {requestedBy}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Reason for Amendment</Label>
            <p className="text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg p-3 whitespace-pre-wrap">
              {amendmentReason}
            </p>
          </div>

          {amendmentProposedChanges && (
            <div className="space-y-2">
              <Label className="text-white">Proposed Changes</Label>
              <p className="text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg p-3 whitespace-pre-wrap">
                {amendmentProposedChanges}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="response" className="text-white">
              Your Response (Optional)
            </Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Add a message to the creator..."
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
            />
          </div>

          <Alert className="bg-amber-500/10 border-amber-500/50">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              If you approve, the agreement will be temporarily unlocked for the creator to make changes. 
              They will need to send it for signature again after making amendments.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRespond(false)}
              disabled={isSubmitting}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              type="button"
              onClick={() => handleRespond(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

