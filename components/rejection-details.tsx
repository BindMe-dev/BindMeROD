"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { AlertTriangle, FileText, Scale, CheckCircle, X } from "lucide-react"

interface RejectionDetailsProps {
  rejection: {
    reason: string
    rejectedBy: string
    rejectedAt: string
    evidence?: Array<{ name: string; url: string; type: string }>
  }
  canRespond: boolean
  onAcceptRejection: () => Promise<void>
  onDisputeRejection: (counterReason: string, counterEvidence?: File[]) => Promise<void>
  onTriggerLegalResolution: () => Promise<void>
}

export function RejectionDetails({ 
  rejection, 
  canRespond, 
  onAcceptRejection, 
  onDisputeRejection,
  onTriggerLegalResolution 
}: RejectionDetailsProps) {
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [counterReason, setCounterReason] = useState("")
  const [counterEvidence, setCounterEvidence] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDispute = async () => {
    if (!counterReason.trim()) return

    setIsSubmitting(true)
    try {
      await onDisputeRejection(counterReason, counterEvidence)
      setDisputeOpen(false)
      setCounterReason("")
      setCounterEvidence([])
    } catch (error) {
      console.error("Dispute failed:", error)
      alert(error instanceof Error ? error.message : "Failed to submit dispute")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCounterEvidence(Array.from(e.target.files))
    }
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <CardTitle className="text-red-800">Completion Rejected</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white border border-red-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-red-800">Rejected by: {rejection.rejectedBy}</p>
              <p className="text-xs text-red-600">
                {new Date(rejection.rejectedAt).toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
              Rejected
            </Badge>
          </div>
          
          <div className="mt-3">
            <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{rejection.reason}</p>
          </div>
          
          {rejection.evidence && rejection.evidence.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 mb-2">Evidence:</p>
              <div className="flex flex-wrap gap-2">
                {rejection.evidence.map((evidence, index) => (
                  <div key={index} className="relative">
                    {evidence.type?.startsWith('image/') ? (
                      <img
                        src={evidence.url}
                        alt={evidence.name}
                        className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(evidence.url, '_blank')}
                      />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => window.open(evidence.url, '_blank')}
                      >
                        <FileText className="w-3 h-3" />
                        {evidence.name}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {canRespond && (
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={onAcceptRejection}
              variant="outline"
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept rejection
            </Button>
            
            <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <X className="w-4 h-4" />
                  Dispute rejection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-white">Dispute Rejection</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Provide your counter-argument and evidence to dispute this rejection.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="counter-reason" className="text-sm text-slate-200">Your counter-argument *</Label>
                    <Textarea
                      id="counter-reason"
                      value={counterReason}
                      onChange={(e) => setCounterReason(e.target.value)}
                      placeholder="Explain why you believe the rejection is incorrect..."
                      rows={4}
                      className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="counter-evidence" className="text-sm text-slate-200">Counter-evidence *</Label>
                    <input
                      id="counter-evidence"
                      type="file"
                      multiple
                      required
                      onChange={handleFileChange}
                      className="flex h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 file:border-0 file:bg-slate-800 file:text-slate-200 file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    />
                    {counterEvidence.length > 0 ? (
                      <p className="text-xs text-green-400">
                        {counterEvidence.length} file(s) selected
                      </p>
                    ) : (
                      <p className="text-xs text-red-400">
                        Evidence is required to dispute
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleDispute} 
                      disabled={!counterReason.trim() || counterEvidence.length === 0 || isSubmitting}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isSubmitting ? "Submitting..." : "Submit dispute"}
                    </Button>
                    <Button variant="outline" onClick={() => setDisputeOpen(false)} className="border-slate-700 text-slate-200">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="gap-2"
                >
                  <Scale className="w-4 h-4" />
                  Legal resolution
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <Scale className="w-5 h-5" />
                    Legal Resolution
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>Are you sure you want to take this matter to court?</p>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">⚠️ This action is irreversible</p>
                      <p className="text-xs text-red-700 mt-1">
                        Once triggered, this dispute will be escalated to legal proceedings and cannot be undone.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onTriggerLegalResolution}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, proceed to court
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
