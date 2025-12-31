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
import { Ban, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WithdrawDialogProps {
  agreementId: string
  agreementTitle: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function WithdrawDialog({ 
  agreementId, 
  agreementTitle, 
  onSuccess,
  trigger 
}: WithdrawDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/agreements/${agreementId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: reason.trim() || "Offer withdrawn by creator",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to withdraw offer")
      }

      setOpen(false)
      setReason("")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10">
            <Ban className="w-4 h-4" />
            Withdraw Offer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Withdraw Offer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Withdraw your offer for "{agreementTitle}" before the counterparty signs. This will change the status to WITHDRAWN.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm text-slate-200">
              Reason (optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you withdrawing this offer? (Optional)"
              rows={3}
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400">
              The counterparty will be notified that this offer has been withdrawn.
            </p>
          </div>
          
          <div className="flex gap-3 pt-1">
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                "Withdraw Offer"
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
