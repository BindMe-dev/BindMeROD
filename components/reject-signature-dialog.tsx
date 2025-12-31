"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

interface RejectSignatureDialogProps {
  agreementId: string
  onReject: (reason: string, rejectionType: string, requestedChanges?: string, evidence?: File[]) => Promise<void>
}

export function RejectSignatureDialog({ agreementId, onReject }: RejectSignatureDialogProps) {
  const [open, setOpen] = useState(false)
  const [rejectionType, setRejectionType] = useState<"hard" | "soft">("hard")
  const [reason, setReason] = useState("")
  const [requestedChanges, setRequestedChanges] = useState("")
  const [evidence, setEvidence] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    if (rejectionType === "soft" && !requestedChanges.trim()) return
    
    setIsSubmitting(true)
    try {
      await onReject(reason, rejectionType, requestedChanges, evidence)
      setOpen(false)
      setReason("")
      setRequestedChanges("")
      setEvidence([])
      setRejectionType("hard")
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
          Reject Agreement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Reject Agreement</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose how you want to reject this agreement.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm text-slate-200">Rejection Type *</Label>
            <RadioGroup value={rejectionType} onValueChange={(v) => setRejectionType(v as "hard" | "soft")}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="hard" id="hard" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="hard" className="font-medium text-slate-100 cursor-pointer">
                    Not Interested
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    I don't want to proceed with this agreement at all
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="soft" id="soft" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="soft" className="font-medium text-slate-100 cursor-pointer">
                    Request Changes
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    I'll sign if certain changes are made to the agreement
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm text-slate-200">Reason for rejection *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're rejecting this agreement..."
              rows={3}
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {rejectionType === "soft" && (
            <div className="space-y-2">
              <Label htmlFor="changes" className="text-sm text-slate-200">What changes do you need? *</Label>
              <Textarea
                id="changes"
                value={requestedChanges}
                onChange={(e) => setRequestedChanges(e.target.value)}
                placeholder="Specify exactly what changes you need before you can sign..."
                rows={4}
                className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                The creator will see these requested changes and can make amendments before resending.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-sm text-slate-200">Evidence (optional)</Label>
            <input
              id="evidence"
              type="file"
              multiple
              onChange={handleFileChange}
              className="flex h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 file:border-0 file:bg-slate-800 file:text-slate-200 file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
            {evidence.length > 0 && (
              <p className="text-xs text-green-400">{evidence.length} file(s) selected</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-1">
            <Button 
              onClick={handleSubmit} 
              disabled={!reason.trim() || (rejectionType === "soft" && !requestedChanges.trim()) || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Rejecting..." : "Reject Agreement"}
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

