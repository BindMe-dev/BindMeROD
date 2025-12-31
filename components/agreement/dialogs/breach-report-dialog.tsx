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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Upload } from "lucide-react"

interface BreachReportDialogProps {
  agreementId: string
  onReport: (description: string, evidence?: File[]) => Promise<void>
  triggerId?: string
}

export function BreachReportDialog({ agreementId, onReport, triggerId }: BreachReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [evidence, setEvidence] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("Please describe the breach")
      return
    }
    
    setIsSubmitting(true)
    try {
      await onReport(description.trim(), evidence.length > 0 ? evidence : undefined)
      setOpen(false)
      setDescription("")
      setEvidence([])
    } catch (error) {
      console.error("Report breach failed:", error)
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
          className="gap-2 border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 px-4 min-h-[44px]"
        >
          <AlertTriangle className="w-5 h-5" />
          Report Breach
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Report Agreement Breach</DialogTitle>
          <DialogDescription className="text-slate-400">
            Report a violation of the agreement terms. The other party will be notified and given
            a chance to respond.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-slate-200">
              Breach Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the breach in detail..."
              className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-sm text-slate-200">
              Supporting Evidence (optional)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="evidence"
                type="file"
                multiple
                onChange={handleFileChange}
                className="bg-slate-900/50 border-slate-700 text-slate-100 file:bg-slate-800 file:text-slate-100 file:border-0 file:mr-4"
              />
            </div>
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
            disabled={isSubmitting || !description.trim()}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isSubmitting ? "Reporting..." : "Report Breach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
