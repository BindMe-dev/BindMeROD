"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, CheckCircle, XCircle } from "lucide-react"

interface BreachResponseDialogProps {
  agreementId: string
  breachId: string
  onRespond: (
    responseType: "acknowledge" | "dispute" | "resolve",
    message: string,
    evidence?: File[]
  ) => Promise<void>
  triggerId?: string
}

export function BreachResponseDialog({
  agreementId,
  breachId,
  onRespond,
  triggerId,
}: BreachResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [responseType, setResponseType] = useState<"acknowledge" | "dispute" | "resolve">("acknowledge")
  const [message, setMessage] = useState("")
  const [evidence, setEvidence] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please provide a response message")
      return
    }
    
    setError("")
    setIsSubmitting(true)
    try {
      await onRespond(responseType, message.trim(), evidence.length > 0 ? evidence : undefined)
      setOpen(false)
      setMessage("")
      setEvidence([])
      setResponseType("acknowledge")
    } catch (error) {
      console.error("Respond to breach failed:", error)
      setError(error instanceof Error ? error.message : "Failed to respond to breach")
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
        <Button
          id={triggerId}
          variant="outline"
          className="gap-2 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 py-3 px-4 min-h-[44px]"
        >
          <MessageSquare className="w-5 h-5" />
          Respond to Breach
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Respond to Breach Report</DialogTitle>
          <DialogDescription className="text-slate-400">
            Provide your response to the reported breach.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Label className="text-sm text-slate-200">Response Type *</Label>
            <RadioGroup
              value={responseType}
              onValueChange={(v) => setResponseType(v as "acknowledge" | "dispute" | "resolve")}
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="acknowledge" id="acknowledge" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="acknowledge" className="font-medium text-slate-100 cursor-pointer">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Acknowledge
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    Accept the breach and provide explanation or remedy plan
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="dispute" id="dispute" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dispute" className="font-medium text-slate-100 cursor-pointer">
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Dispute
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    Contest the breach claim with counter-evidence
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="resolve" id="resolve" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="resolve" className="font-medium text-slate-100 cursor-pointer">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Propose Resolution
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    Suggest a solution to resolve the issue
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm text-slate-200">
              Response Message *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide your response..."
              className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-sm text-slate-200">
              Supporting Evidence (optional)
            </Label>
            <Input
              id="evidence"
              type="file"
              multiple
              onChange={handleFileChange}
              className="bg-slate-900/50 border-slate-700 text-slate-100 file:bg-slate-800 file:text-slate-100 file:border-0 file:mr-4"
            />
            {evidence.length > 0 && (
              <div className="text-sm text-slate-400">
                {evidence.length} file(s) selected
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
