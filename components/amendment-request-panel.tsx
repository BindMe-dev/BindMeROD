"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit3, Check, X } from "lucide-react"
import type { Agreement } from "@/lib/agreement-types"

interface AmendmentRequestPanelProps {
  agreement: Agreement
  onAccept: () => Promise<void>
  onDecline: (message?: string) => Promise<void>
}

export function AmendmentRequestPanel({ agreement, onAccept, onDecline }: AmendmentRequestPanelProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept()
    } catch (error) {
      console.error("Failed to accept amendment:", error)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    setIsDeclining(true)
    try {
      await onDecline("Creator declined amendment request")
    } catch (error) {
      console.error("Failed to decline amendment:", error)
    } finally {
      setIsDeclining(false)
    }
  }

  if (agreement.status !== "pending_amendment") {
    return null
  }

  return (
    <Card className="border-orange-500/50 bg-orange-500/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Edit3 className="w-5 h-5" />
            Amendment Requested
          </CardTitle>
          <Badge variant="outline" className="border-orange-500/50 text-orange-400">
            Pending Changes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Rejected by:</p>
            <p className="font-medium text-slate-100">{agreement.rejectedBy || "Unknown"}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-400">Reason for rejection:</p>
            <p className="text-slate-100">{agreement.rejectionReason || "No reason provided"}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-400">Requested changes:</p>
            <div className="mt-1 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <p className="whitespace-pre-wrap text-slate-100">
                {agreement.amendmentRequestedChanges || "No specific changes requested"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            {isAccepting ? "Accepting..." : "Make Changes"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-2" />
            {isDeclining ? "Declining..." : "Decline & Cancel"}
          </Button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          If you accept, the agreement will be unlocked for editing. After making changes, send it for signature again.
        </p>
      </CardContent>
    </Card>
  )
}

