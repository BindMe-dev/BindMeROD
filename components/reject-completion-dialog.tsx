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
import { X } from "lucide-react"

interface RejectCompletionDialogProps {
  agreementId: string
  onReject: (reason: string, evidence?: File[]) => Promise<void>
}

export function RejectCompletionDialog({ agreementId, onReject }: RejectCompletionDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [evidence, setEvidence] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    
    setIsSubmitting(true)
    try {
      await onReject(reason, evidence)
      setOpen(false)
      setReason("")
      setEvidence([])
    } catch (error) {
      console.error("Reject failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidence(Array.from(e.target.files))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-red-500/30 text-red-300 hover:bg-red-500/10">
          <X className="w-4 h-4" />
          Reject completion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Reject Completion</DialogTitle>
          <DialogDescription className="text-slate-400">
            Explain why you're rejecting the completion request. This will notify the other party.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm text-slate-200">Reason for rejection *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the agreement terms haven't been met..."
              rows={4}
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-sm text-slate-200">Evidence *</Label>
            <input
              id="evidence"
              type="file"
              multiple
              required
              onChange={handleFileChange}
              className="flex h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 file:border-0 file:bg-slate-800 file:text-slate-200 file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
            {evidence.length > 0 ? (
              <p className="text-xs text-green-400">{evidence.length} file(s) selected</p>
            ) : (
              <p className="text-xs text-red-400">Evidence is required for rejection</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-1">
            <Button 
              onClick={handleSubmit} 
              disabled={!reason.trim() || evidence.length === 0 || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Rejecting..." : "Reject completion"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-slate-200">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
