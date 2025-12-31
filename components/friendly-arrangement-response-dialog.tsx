"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Handshake, CheckCircle, AlertCircle, X } from "lucide-react"

interface FriendlyArrangementResponseDialogProps {
  agreementId: string
  proposedTerms: string
  onResponse: (response: "accepted" | "conditional" | "rejected", conditions?: string) => Promise<void>
}

export function FriendlyArrangementResponseDialog({
  agreementId,
  proposedTerms,
  onResponse,
}: FriendlyArrangementResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [responseType, setResponseType] = useState<"accepted" | "conditional" | "rejected" | null>(null)
  const [conditions, setConditions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!responseType) return
    
    setIsSubmitting(true)
    try {
      await onResponse(responseType, responseType === "conditional" ? conditions : undefined)
      setOpen(false)
      setResponseType(null)
      setConditions("")
    } catch (error) {
      console.error("Response failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Handshake className="w-4 h-4" />
          Respond to Arrangement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Respond to Friendly Arrangement</DialogTitle>
          <DialogDescription>
            Review the proposed terms and choose your response
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-sm font-medium text-blue-800">Proposed Terms:</Label>
            <p className="text-sm text-blue-700 mt-1 whitespace-pre-wrap">{proposedTerms}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Your Response:</Label>
            
            <div className="space-y-2">
              <Button
                variant={responseType === "accepted" ? "default" : "outline"}
                onClick={() => setResponseType("accepted")}
                className="w-full justify-start gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Accept Terms - I agree to the proposed arrangement
              </Button>
              
              <Button
                variant={responseType === "conditional" ? "default" : "outline"}
                onClick={() => setResponseType("conditional")}
                className="w-full justify-start gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Accept with Conditions - I agree but with modifications
              </Button>
              
              <Button
                variant={responseType === "rejected" ? "destructive" : "outline"}
                onClick={() => setResponseType("rejected")}
                className="w-full justify-start gap-2"
              >
                <X className="w-4 h-4" />
                Reject - Proceed to legal resolution
              </Button>
            </div>
          </div>

          {responseType === "conditional" && (
            <div className="space-y-2">
              <Label htmlFor="conditions">Your Conditions/Modifications:</Label>
              <Textarea
                id="conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Describe your conditions or modifications to the proposed terms..."
                rows={4}
                required
              />
            </div>
          )}

          {responseType === "rejected" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> Rejecting this arrangement will automatically trigger legal resolution. 
                This action cannot be undone and will involve legal proceedings.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!responseType || (responseType === "conditional" && !conditions.trim()) || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}