"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  RefreshCcw,
  Scale
} from "lucide-react"
import type { Agreement } from "@/lib/agreement-types"
import { cn } from "@/lib/utils"

interface DisputeResolutionPanelProps {
  agreement: Agreement
  userId: string
  onAction: (action: string, payload?: any) => Promise<void>
}

export function DisputeResolutionPanel({ agreement, userId, onAction }: DisputeResolutionPanelProps) {
  const [proposal, setProposal] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maxIterations = 5
  const iterationReached = (agreement.iterationNumber || 0) >= maxIterations

  const isProposer = agreement.proposalBy === userId
  const isCounterProposer = agreement.counterProposalBy === userId
  const isMyTurn = 
    (agreement.disputePhase === 'open') ||
    (agreement.disputePhase === 'conditional_offer' && !isProposer) ||
    (agreement.disputePhase === 'counter_offer' && !isCounterProposer)

  const handlePropose = async () => {
    if (!proposal.trim()) return
    setIsSubmitting(true)
    try {
      await onAction("PROPOSE_RESOLUTION", { terms: proposal })
      setProposal("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to propose resolution")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResponse = async (subAction: "ACCEPT" | "REJECT_DEADLOCK" | "COUNTER") => {
    if (subAction === "COUNTER" && !proposal.trim()) return
    if (subAction === "REJECT_DEADLOCK" && !proposal.trim()) return
    setIsSubmitting(true)
    try {
      await onAction("RESPOND_PROPOSAL", { 
        subAction, 
        terms: subAction === "COUNTER" ? proposal : undefined,
        reason: subAction === "REJECT_DEADLOCK" ? proposal : undefined
      })
      setProposal("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to respond to proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEscalate = async () => {
    setIsSubmitting(true)
    try {
      await onAction("ESCALATE_LEGAL")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to escalate")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-amber-800">Dispute Resolution</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 capitalize">
            {agreement.disputePhase?.replace('_', ' ') || 'Open'}
          </Badge>
        </div>
        <p className="text-sm text-amber-700">
          {isMyTurn ? "Your turn to respond." : "Waiting for the other party to respond."}
        </p>
        <p className="text-xs text-amber-600">
          Iteration {agreement.iterationNumber || 0} / 5
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-white/80 rounded-lg border border-amber-200 shadow-sm">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">Dispute Origin</h4>
            <p className="text-sm text-amber-800 mb-1"><strong>Reason:</strong> {agreement.disputeReason}</p>
            <p className="text-xs text-amber-600">Disputed by {agreement.disputedBy === userId ? 'You' : 'Counterparty'} at {agreement.disputedAt ? new Date(agreement.disputedAt).toLocaleString() : ''}</p>
          </div>

          {(agreement.proposalTerms || agreement.counterProposalTerms) && (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 shadow-sm">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Last {agreement.disputePhase === 'counter_offer' ? 'Counter-Proposal' : 'Proposal'}
              </h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap mb-2">
                {agreement.disputePhase === 'counter_offer' ? agreement.counterProposalTerms : agreement.proposalTerms}
              </p>
              <p className="text-xs text-blue-600">
                Made by {(agreement.proposalBy === userId || agreement.counterProposalBy === userId) ? 'You' : 'Counterparty'} 
                at {new Date((agreement.proposalAt || agreement.counterProposalAt)!).toLocaleString()}
              </p>
            </div>
          )}

          {agreement.disputePhase === 'deadlock' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900">Negotiation Deadlock</h4>
                <p className="text-sm text-red-800">Parties have failed to reach a friendly resolution. Legal escalation is recommended.</p>
                {agreement.refusalReason && (
                   <p className="text-sm text-red-700 mt-1"><strong>Reason:</strong> {agreement.refusalReason}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {agreement.status === 'disputed' && agreement.disputePhase !== 'deadlock' && (
          <div className="space-y-4">
            {isMyTurn ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proposal" className="text-amber-900 font-medium">
                    {agreement.disputePhase === 'open' ? 'Your Proposal' : 'Respond to Offer'}
                  </Label>
                  <Textarea
                    id="proposal"
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    placeholder={
                      iterationReached
                        ? "Further counters disabled (max iterations reached)."
                        : agreement.disputePhase === 'open'
                        ? "Suggest how to resolve this dispute..."
                        : "Explain your counter-offer or reason for rejection..."
                    }
                    rows={3}
                    className="bg-white border-amber-200 focus:ring-amber-500"
                    disabled={iterationReached && agreement.disputePhase !== 'open'}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {agreement.disputePhase === 'open' ? (
                    <Button onClick={handlePropose} disabled={!proposal.trim() || isSubmitting || iterationReached} className="bg-amber-600 hover:bg-amber-700">
                      <Send className="w-4 h-4 mr-2" />
                      Propose Resolution
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => handleResponse("ACCEPT")} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Terms
                      </Button>
                      <Button 
                        onClick={() => handleResponse("COUNTER")} 
                        variant="outline" 
                        disabled={!proposal.trim() || isSubmitting || iterationReached}
                        className="border-amber-200 text-amber-700 hover:bg-amber-100"
                      >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Counter-Propose
                      </Button>
                      <Button 
                        onClick={() => handleResponse("REJECT_DEADLOCK")} 
                        variant="destructive" 
                        disabled={!proposal.trim() || isSubmitting}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject & Deadlock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-100/50 rounded-lg border border-slate-200 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <p className="text-sm text-slate-600 italic">Waiting for the other party to respond...</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-amber-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-amber-700">
              Iteration {agreement.iterationNumber || 0} / 5
            </div>
            {agreement.disputePhase === 'deadlock' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleEscalate} 
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Escalate to Legal
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
