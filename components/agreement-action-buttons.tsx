"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import {
  CheckCircle,
  Shield,
  Trash2,
  Scale,
  Handshake,
  XCircle,
  Send,
  FileSignature
} from "lucide-react"
import { getAvailableActions, type UserContext } from "@/lib/agreement-actions"
import type { Agreement } from "@/lib/agreement-types"
import { CounterpartySignDialog } from "./counterparty-sign-dialog"
import { CreatorSignDialog } from "./creator-sign-dialog"
import { WitnessAgreementDialog } from "./witness-agreement-dialog"
import { RejectCompletionDialog } from "./reject-completion-dialog"
import { RejectSignatureDialog } from "./reject-signature-dialog"
import { FriendlyArrangementDialog } from "./friendly-arrangement-dialog"

interface ActionButtonsProps {
  agreement: Agreement
  userContext: UserContext
  onComplete: () => Promise<void>
  onDelete: () => Promise<void>
  onSignAsCounterparty: (signature: string, type: "drawn" | "typed", stamp?: any) => Promise<void>
  onSignAsCreator?: (signature: string, type: "drawn" | "typed", stamp?: any) => Promise<void>
  onWitnessSign?: () => void
  onRejectCompletion?: (reason: string, evidence?: File[]) => Promise<void>
  onRejectSignature?: (reason: string, rejectionType: string, requestedChanges?: string, evidence?: File[]) => Promise<void>
  onTriggerLegal: () => Promise<void>
  onProposeFriendly?: (terms: string) => Promise<void>
  onSendForSignature?: () => Promise<void>
  onCancel?: (reason: string) => Promise<void>
  onWithdraw?: () => Promise<void>
  onDuplicate?: () => Promise<void>
  counterpartySignTriggerId?: string
  creatorSignTriggerId?: string
}

export function AgreementActionButtons({
  agreement,
  userContext,
  onComplete,
  onDelete,
  onSignAsCounterparty,
  onSignAsCreator,
  onWitnessSign,
  onRejectCompletion,
  onRejectSignature,
  onTriggerLegal,
  onProposeFriendly,
  onSendForSignature,
  onCancel,
  onWithdraw,
  onDuplicate,
  counterpartySignTriggerId,
  creatorSignTriggerId,
}: ActionButtonsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const actions = getAvailableActions(agreement, userContext)

  return (
    <div className="flex flex-wrap gap-3">
      {/* Send for Signature - Draft state */}
      {actions.canSendForSignature && onSendForSignature && (
        <Button
          onClick={onSendForSignature}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Send className="w-4 h-4 mr-2" />
          Send for Signature
        </Button>
      )}

      {/* Cancel Draft/Pending */}
      {actions.canCancel && onCancel && (
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Agreement
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-slate-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Cancel Agreement</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will cancel the agreement before any signatures are collected. You can provide a reason.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white"
              rows={3}
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">
                Keep Agreement
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onCancel(cancelReason || "Cancelled by creator")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel Agreement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    )}

      {/* Sign as Counterparty */}
      {actions.canSign && (
        <CounterpartySignDialog
          agreement={agreement}
          triggerId={counterpartySignTriggerId}
          onSign={onSignAsCounterparty}
        />
      )}

      {/* Sign as Creator */}
      {actions.canCreatorSign && onSignAsCreator && (
        <CreatorSignDialog
          agreement={agreement}
          triggerId={creatorSignTriggerId}
          onSign={onSignAsCreator}
        />
      )}

      {/* Reject Signature */}
      {actions.canReject && onRejectSignature && (
        <RejectSignatureDialog
          agreementId={agreement.id}
          onReject={onRejectSignature}
        />
      )}

      {/* Witness Sign */}
      {userContext.isWitness && !userContext.hasSignedAsWitness && agreement.status === "active" && onWitnessSign && (
        <WitnessAgreementDialog
          agreement={agreement}
          onWitnessed={onWitnessSign}
        />
      )}

      {/* Request/Confirm Completion */}
      {actions.canRequestCompletion && (
        <Button
          onClick={onComplete}
          variant="outline"
          className="border-green-500/30 text-green-300 hover:bg-green-500/10"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Request Completion
        </Button>
      )}

      {actions.canConfirmCompletion && (
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Completion
        </Button>
      )}

      {/* Reject Completion */}
      {actions.canRejectCompletion && onRejectCompletion && (
        <RejectCompletionDialog
          agreementId={agreement.id}
          onReject={onRejectCompletion}
        />
      )}

      {/* Propose Friendly Arrangement */}
      {agreement.status === "disputed" && onProposeFriendly && (
        <FriendlyArrangementDialog
          onPropose={onProposeFriendly}
        />
      )}

      {/* Trigger Legal Resolution */}
      {actions.canRaiseDispute && agreement.status === "disputed" && (
        <Button
          onClick={onTriggerLegal}
          variant="outline"
          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
        >
          <Scale className="w-4 h-4 mr-2" />
          Legal Resolution
        </Button>
      )}

      {/* Delete */}
      {actions.canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="bg-red-600 text-white hover:bg-red-600 hover:text-white">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-slate-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Agreement</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This action cannot be undone. The agreement will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Withdraw */}
      {onWithdraw && (
        <Button onClick={onWithdraw} className="bg-blue-600 hover:bg-blue-700">
          Withdraw
        </Button>
      )}

      {/* Duplicate */}
      {actions.canDuplicate && onDuplicate && (
        <Button onClick={onDuplicate} className="bg-blue-600 hover:bg-blue-700">
          Duplicate
        </Button>
      )}
    </div>
  )
}
