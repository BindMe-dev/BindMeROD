"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { XCircle } from "lucide-react"

interface TerminateDialogProps {
  agreementId: string
  onTerminate: (reason: string) => Promise<void>
  triggerId?: string
}

export function TerminateDialog({ agreementId, onTerminate, triggerId }: TerminateDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for termination")
      return
    }
    
    setError("")
    setIsSubmitting(true)
    try {
      await onTerminate(reason.trim())
      setOpen(false)
      setReason("")
    } catch (error) {
      console.error("Terminate failed:", error)
      setError(error instanceof Error ? error.message : "Failed to terminate agreement")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          id={triggerId}
          variant="destructive"
          className="gap-2 py-3 px-4 min-h-[44px]"
        >
          <XCircle className="w-5 h-5" />
          Terminate Agreement
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Terminate Agreement</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            This will permanently terminate the active agreement. Both parties will be notified.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm text-slate-200">
              Reason for Termination *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are terminating this agreement..."
              className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[120px]"
              required
            />
            <p className="text-xs text-slate-500">
              This reason will be recorded in the agreement audit log.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isSubmitting ? "Terminating..." : "Terminate Agreement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
