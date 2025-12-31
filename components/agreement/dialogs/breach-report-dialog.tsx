"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BreachReportDialogProps {
  agreementId: string
  agreementTitle: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function BreachReportDialog({ 
  agreementId, 
  agreementTitle, 
  onSuccess,
  trigger 
}: BreachReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
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
    
    if (!description.trim()) {
      setError("Please describe the breach")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // For now, send as JSON. In production, you might want to use FormData for file uploads
      const res = await fetch(`/api/agreements/${agreementId}/report-breach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description: description.trim(),
          evidenceCount: evidence.length,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to report breach")
      }

      setOpen(false)
      setDescription("")
      setEvidence([])
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report breach")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-red-500/30 text-red-300 hover:bg-red-500/10">
            <AlertTriangle className="w-4 h-4" />
            Report Breach
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Report Agreement Breach</DialogTitle>
          <DialogDescription className="text-slate-400">
            Report a breach of the agreement "{agreementTitle}". This will notify the other party and change the status to BREACH_REPORTED.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-slate-200">
              Breach Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the breach in detail. Include specific terms that were violated and how..."
              rows={5}
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
              required
            />
            <p className="text-xs text-slate-400">
              Be specific and factual. This report will be shared with the other party.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-sm text-slate-200">
              Evidence (optional)
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
              Upload screenshots, documents, or other evidence to support your claim.
            </p>
          </div>

          <Alert className="bg-yellow-950/50 border-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200 text-sm">
              <strong>Note:</strong> Reporting a breach is a serious action. The other party will have the opportunity to acknowledge, dispute, or provide counter-evidence. If unresolved, the dispute can be escalated to legal resolution.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3 pt-1">
            <Button 
              type="submit"
              disabled={!description.trim() || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Report Breach"
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
