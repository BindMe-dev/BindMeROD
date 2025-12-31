"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, RotateCcw } from "lucide-react"

// All agreement statuses
const STATUSES = [
  "draft",
  "pending_signature",
  "active",
  "pending_amendment",
  "pending_completion",
  "breach_reported",
  "disputed",
  "legal_resolution",
  "completed",
  "rejected",
  "withdrawn",
  "cancelled",
  "expired",
  "overdue",
] as const

// All available actions - COMPLETE LIST (every action shown for every status)
const ALL_ACTIONS = [
  // Draft Phase
  { key: "canEdit", label: "Edit", category: "Draft Phase" },
  { key: "canSendForSignature", label: "Send for Signature", category: "Draft Phase" },
  { key: "canSetExpiration", label: "Set Expiration", category: "Draft Phase" },
  { key: "canCancelDraft", label: "Cancel Draft", category: "Draft Phase" },
  { key: "canDelete", label: "Delete", category: "Draft Phase" },

  // Signature Phase
  { key: "canSign", label: "Sign", category: "Signature Phase" },
  { key: "canCreatorSign", label: "Creator Sign", category: "Signature Phase" },
  { key: "canReject", label: "Reject", category: "Signature Phase" },
  { key: "canWithdrawOffer", label: "Withdraw Offer", category: "Signature Phase" },
  { key: "canCancel", label: "Cancel", category: "Signature Phase" },
  { key: "canResend", label: "Resend", category: "Signature Phase" },

  // Active Phase
  { key: "canRequestCompletion", label: "Request Completion", category: "Active Phase" },
  { key: "canConfirmCompletion", label: "Confirm Completion", category: "Active Phase" },
  { key: "canRejectCompletion", label: "Reject Completion", category: "Active Phase" },
  { key: "canRaiseDispute", label: "Raise Dispute", category: "Active Phase" },
  { key: "canRequestAmendment", label: "Request Amendment", category: "Active Phase" },
  { key: "canTerminateAgreement", label: "Terminate Agreement", category: "Active Phase" },
  { key: "canReportBreach", label: "Report Breach", category: "Active Phase" },
  { key: "canWithdrawBreachReport", label: "Withdraw Breach Report", category: "Active Phase" },

  // Amendment Phase
  { key: "canAcceptAmendment", label: "Accept Amendment", category: "Amendment Phase" },
  { key: "canRejectAmendment", label: "Reject Amendment", category: "Amendment Phase" },
  { key: "canCounterProposeAmendment", label: "Counter Propose", category: "Amendment Phase" },
  { key: "canCancelAmendmentRequest", label: "Cancel Amendment Request", category: "Amendment Phase" },
  { key: "canReviseAmendment", label: "Revise Amendment", category: "Amendment Phase" },
  { key: "canDiscussAmendment", label: "Discuss Amendment", category: "Amendment Phase" },

  // Breach/Dispute Phase
  { key: "canProvideEvidence", label: "Provide Evidence", category: "Breach/Dispute Phase" },
  { key: "canProvideCounterEvidence", label: "Provide Counter Evidence", category: "Breach/Dispute Phase" },
  { key: "canDisputeRejection", label: "Dispute Rejection", category: "Breach/Dispute Phase" },
  { key: "canAcknowledgeBreach", label: "Acknowledge Breach", category: "Breach/Dispute Phase" },
  { key: "canEscalateImmediately", label: "Escalate Immediately", category: "Breach/Dispute Phase" },
  { key: "canEscalateToLegal", label: "Escalate to Legal", category: "Breach/Dispute Phase" },
  { key: "canProposeResolution", label: "Propose Resolution", category: "Breach/Dispute Phase" },
  { key: "canAcceptResolution", label: "Accept Resolution", category: "Breach/Dispute Phase" },
  { key: "canRequestMediation", label: "Request Mediation", category: "Breach/Dispute Phase" },

  // Legal Resolution Phase
  { key: "canSubmitCounterProposal", label: "Submit Counter Proposal", category: "Legal Resolution Phase" },
  { key: "canMarkSettled", label: "Mark Settled", category: "Legal Resolution Phase" },
  { key: "canMarkTerminated", label: "Mark Terminated", category: "Legal Resolution Phase" },
  { key: "canUploadLegalDocuments", label: "Upload Legal Documents", category: "Legal Resolution Phase" },

  // Expired State
  { key: "canResendExpired", label: "Resend Expired", category: "Expired State" },

  // Universal Actions
  { key: "canDuplicate", label: "Duplicate", category: "Universal Actions" },
  { key: "canViewAudit", label: "View Audit", category: "Universal Actions" },
  { key: "canDownloadReceipt", label: "Download Receipt", category: "Universal Actions" },
  { key: "canExportPDF", label: "Export PDF", category: "Universal Actions" },
  { key: "canAddComments", label: "Add Comments", category: "Universal Actions" },
  { key: "canViewHistory", label: "View History", category: "Universal Actions" },
  { key: "canViewVersions", label: "View Versions", category: "Universal Actions" },
] as const

type PermissionConfig = Record<string, Record<string, boolean>>

export default function ActionPermissionsPage() {
  const [creatorPermissions, setCreatorPermissions] = useState<PermissionConfig>({})
  const [counterpartyPermissions, setCounterpartyPermissions] = useState<PermissionConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/action-permissions")
      if (!response.ok) throw new Error("Failed to load permissions")
      const data = await response.json()
      setCreatorPermissions(data.creator || {})
      setCounterpartyPermissions(data.counterparty || {})
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load action permissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const savePermissions = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/action-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: creatorPermissions,
          counterparty: counterpartyPermissions,
        }),
      })
      if (!response.ok) throw new Error("Failed to save permissions")
      toast({
        title: "Success",
        description: "Action permissions saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save action permissions",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (
    role: "creator" | "counterparty",
    status: string,
    action: string
  ) => {
    const setter = role === "creator" ? setCreatorPermissions : setCounterpartyPermissions
    setter((prev) => ({
      ...prev,
      [status]: {
        ...(prev[status] || {}),
        [action]: !prev[status]?.[action],
      },
    }))
  }

  const resetToDefaults = () => {
    if (confirm("Reset all permissions to default values? This cannot be undone.")) {
      loadPermissions()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Action Permissions Configuration</h1>
          <p className="text-slate-400 mt-2">
            Configure which actions are available for each agreement status and role
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} variant="outline" disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={savePermissions} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Creator Permissions Table */}
      <PermissionTable
        title="Creator Permissions"
        description="Actions available to the agreement creator"
        role="creator"
        permissions={creatorPermissions}
        onToggle={togglePermission}
      />

      {/* Counterparty Permissions Table */}
      <PermissionTable
        title="Counterparty Permissions"
        description="Actions available to the counterparty"
        role="counterparty"
        permissions={counterpartyPermissions}
        onToggle={togglePermission}
      />
    </div>
  )
}

interface PermissionTableProps {
  title: string
  description: string
  role: "creator" | "counterparty"
  permissions: PermissionConfig
  onToggle: (role: "creator" | "counterparty", status: string, action: string) => void
}

function PermissionTable({ title, description, role, permissions, onToggle }: PermissionTableProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 font-semibold text-slate-300 sticky left-0 bg-slate-900 z-10 min-w-[200px]">
                  Action
                </th>
                {STATUSES.map((status) => (
                  <th
                    key={status}
                    className="text-center p-3 font-semibold text-slate-300 min-w-[120px] text-xs"
                  >
                    <div className="transform -rotate-45 origin-center whitespace-nowrap">
                      {status.replace(/_/g, " ")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Group actions by category
                const categories: Record<string, typeof ALL_ACTIONS> = {}
                ALL_ACTIONS.forEach((action) => {
                  if (!categories[action.category]) {
                    categories[action.category] = []
                  }
                  categories[action.category].push(action)
                })

                return Object.entries(categories).map(([category, actions]) => (
                  <>
                    <tr key={category} className="bg-slate-800/80">
                      <td colSpan={STATUSES.length + 1} className="p-3 font-bold text-sm text-slate-300 uppercase tracking-wide">
                        {category}
                      </td>
                    </tr>
                    {actions.map((action) => (
                      <tr key={action.key} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="p-3 text-sm sticky left-0 bg-slate-900 z-10 text-slate-200 font-medium">
                          {action.label}
                        </td>
                        {STATUSES.map((status) => (
                          <td key={status} className="p-3 text-center">
                            <Checkbox
                              checked={permissions[status]?.[action.key] || false}
                              onCheckedChange={() => onToggle(role, status, action.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

