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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Loader2, Upload, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BreachResponseDialogProps {
  agreementId: string
  agreementTitle: string
  breachDescription: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function BreachResponseDialog({ 
  agreementId, 
  agreementTitle,
  breachDescription,
  onSuccess,
  trigger 
}: BreachResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [responseType, setResponseType] = useState<"acknowledge" | "dispute">("acknowledge")
  const [response, setResponse] = useState("")
  const [evidence, setEvidence] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidence(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!response.trim()) {
      setError("Please provide a response")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/agreements/${agreementId}/respond-to-breach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          responseType,
          response: response.trim(),
          evidenceCount: evidence.length,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit response")
      }

      setOpen(false)
      setResponse("")
      setEvidence([])
      setResponseType("acknowledge")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Respond to Breach
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Respond to Breach Report</DialogTitle>
          <DialogDescription className="text-slate-400">
            A breach has been reported for "{agreementTitle}". Review the claim and provide your response.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Show the breach report */}
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-900/50">
            <h4 className="text-sm font-semibold text-red-300 mb-2">Breach Report:</h4>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{breachDescription}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label className="text-sm text-slate-200">Response Type *</Label>
            <RadioGroup value={responseType} onValueChange={(v) => setResponseType(v as "acknowledge" | "dispute")}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="acknowledge" id="acknowledge" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="acknowledge" className="font-medium text-slate-100 cursor-pointer flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Acknowledge Breach
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    Accept responsibility and propose a resolution or next steps
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <RadioGroupItem value="dispute" id="dispute" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dispute" className="font-medium text-slate-100 cursor-pointer flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-yellow-400" />
                    Dispute Breach Claim
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    Challenge the breach claim with your explanation and evidence
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response" className="text-sm text-slate-200">
              {responseType === "acknowledge" ? "Your Response & Proposed Resolution *" : "Your Counter-Argument *"}
            </Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={
                responseType === "acknowledge"
                  ? "Acknowledge the breach and explain how you plan to remedy it or what resolution you propose..."
                  : "Explain why you disagree with the breach claim. Provide facts and context..."
              }
              rows={5}
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
              required
            />
          </div>

          {responseType === "dispute" && (
            <div className="space-y-2">
              <Label htmlFor="evidence" className="text-sm text-slate-200">
                Counter-Evidence (optional)
              </Label>
              <div className="relative">
                <Input
                  id="evidence"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="bg-slate-900 border-slate-800 text-slate-100 file:bg-slate-800 file:text-slate-200 file:border-0 file:mr-4"
                />
                <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {evidence.length > 0 && (
                <p className="text-xs text-green-400">
                  {evidence.length} file(s) selected: {evidence.map(f => f.name).join(", ")}
                </p>
              )}
              <p className="text-xs text-slate-400">
                Provide evidence that contradicts the breach claim.
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-1">
            <Button 
              type="submit"
              disabled={!response.trim() || isSubmitting}
              className={`flex-1 ${
                responseType === "acknowledge" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-yellow-600 hover:bg-yellow-700"
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                responseType === "acknowledge" ? "Acknowledge & Propose Resolution" : "Dispute Claim"
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
