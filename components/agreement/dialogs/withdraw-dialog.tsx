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
import { Ban } from "lucide-react"

interface WithdrawDialogProps {
  agreementId: string
  onWithdraw: (reason?: string) => Promise<void>
  triggerId?: string
}

export function WithdrawDialog({ agreementId, onWithdraw, triggerId }: WithdrawDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onWithdraw(reason.trim() || undefined)
      setOpen(false)
      setReason("")
    } catch (error) {
      console.error("Withdraw failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          id={triggerId}
          variant="outline"
          size="sm"
          className="gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
        >
          <Ban className="w-4 h-4" />
          Withdraw Offer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Withdraw Offer</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Are you sure you want to withdraw this agreement offer? This action cannot be undone.
            The counterparty will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm text-slate-200">
              Reason (optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for withdrawing..."
              className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[100px]"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {isSubmitting ? "Withdrawing..." : "Withdraw Offer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
