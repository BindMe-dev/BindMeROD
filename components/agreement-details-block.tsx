"use client"

import type { Agreement } from "@/lib/agreement-types"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  Tag,
  Clock,
  Shield,
  AlertCircle,
  Target,
  Repeat,
  Lock,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAgreements } from "@/lib/agreement-store"
import { AGREEMENT_TEMPLATES } from "@/lib/templates"
import { AmendmentRequestDialog } from "@/components/amendment-request-dialog"
import { AmendmentResponseDialog } from "@/components/amendment-response-dialog"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AgreementDetailsBlockProps {
  agreement: Agreement
}

export function AgreementDetailsBlock({ agreement }: AgreementDetailsBlockProps) {
  const { updateAgreement, refreshAgreements } = useAgreements()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [draftValues, setDraftValues] = useState<Record<string, any>>(agreement.templateValues || {})
  const [isSaving, setIsSaving] = useState(false)
  const [showAmendmentResponse, setShowAmendmentResponse] = useState(false)

  useEffect(() => {
    setDraftValues(agreement.templateValues || {})
  }, [agreement.templateValues])

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not set"
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getTypeIcon = () => {
    switch (agreement.type) {
      case "one-time":
        return <Target className="w-4 h-4" />
      case "recurring":
        return <Repeat className="w-4 h-4" />
      case "deadline":
        return <Clock className="w-4 h-4" />
      case "bet":
        return <DollarSign className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = () => {
    switch (agreement.type) {
      case "one-time":
        return "One-Time Agreement"
      case "recurring":
        return "Recurring Agreement"
      case "deadline":
        return "Deadline Agreement"
      case "bet":
        return "Bet/Wager"
      default:
        return agreement.type
    }
  }

  const templateDef = useMemo(
    () => AGREEMENT_TEMPLATES.find((t) => t.id === agreement.templateId),
    [agreement.templateId],
  )

  const templateEntries = useMemo(() => {
    if (templateDef?.fields?.length) {
      const source = isEditing ? draftValues : agreement.templateValues || {}
      return templateDef.fields.map((field) => [field.id, source[field.id] ?? ""])
    }
    return Object.entries(isEditing ? draftValues : agreement.templateValues || {})
  }, [templateDef, isEditing, draftValues, agreement.templateValues])
  const purpose = (isEditing ? draftValues : agreement.templateValues)?.purpose || ""
  const terms = (isEditing ? draftValues : agreement.templateValues)?.terms || ""
  const scope = (isEditing ? draftValues : agreement.templateValues)?.scopeOfWork || ""
  const consequences = (isEditing ? draftValues : agreement.templateValues)?.breachConsequences || ""
  const witnessRequired =
    (isEditing ? draftValues : agreement.templateValues)?.witnessRequired ?? agreement.witnessRequired ?? false
  const witnessNotes = (isEditing ? draftValues : agreement.templateValues)?.witnessNotes || ""

  const formatLabel = (key: string) =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b(id)\b/gi, "ID")
      .replace(/\b(dob)\b/gi, "DOB")
      .replace(/\b(otp)\b/gi, "OTP")
      .replace(/\b(ip)\b/gi, "IP")
      .replace(/\b(url)\b/gi, "URL")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase())

  const formatValue = (value: any) => {
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "number") return value.toString()
    if (typeof value === "string") {
      const tryDate = new Date(value)
      if (!isNaN(tryDate.getTime()) && /\d{4}-\d{2}-\d{2}/.test(value)) {
        return formatDate(value)
      }
      return value
    }
    if (value && typeof value === "object") return JSON.stringify(value)
    return String(value ?? "")
  }

  const counterparty = agreement.sharedWith?.find((p) => (p.role ?? "counterparty") === "counterparty")
  const witnesses = agreement.sharedWith?.filter((p) => (p.role ?? "counterparty") === "witness") || []
  const hasCounterpartySigned = useMemo(() => {
    const sigs = agreement.legalSignatures || agreement.legal?.signatures || []
    return sigs.some((s) => s.role === "counterparty")
  }, [agreement.legalSignatures, agreement.legal?.signatures])

  const isCreator = user?.id === agreement.userId
  const isCounterparty = agreement.sharedWith?.some(
    p => (p.role ?? "counterparty") === "counterparty" &&
         (p.userId === user?.id || p.userEmail?.toLowerCase() === user?.email?.toLowerCase())
  )
  const isLocked = agreement.isLocked || false
  const hasPendingAmendment = agreement.amendmentStatus === "pending"

  const handleFieldChange = (key: string, value: any) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateAgreement(agreement.id, { templateValues: draftValues })
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update agreement", err)
      alert("Failed to update agreement fields. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-xl shadow-2xl h-full">
      <CardHeader className="border-b border-slate-700/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Agreement Details
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-300 border-blue-500/30 flex items-center gap-1"
          >
            {getTypeIcon()}
            {getTypeLabel()}
          </Badge>
        </div>

        {/* Lock Status and Amendment Workflow */}
        {isLocked && (
          <Alert className="mt-4 bg-amber-500/10 border-amber-500/50">
            <Lock className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              <div className="space-y-2">
                <p className="font-semibold">This agreement is locked</p>
                <p className="text-sm">
                  The agreement was locked when sent for signature. Changes require counterparty approval.
                </p>

                {hasPendingAmendment && isCreator && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-sm text-blue-200">
                      ⏳ Amendment request pending approval from counterparty
                    </p>
                    {agreement.amendmentReason && (
                      <p className="text-xs text-blue-300 mt-1">Reason: {agreement.amendmentReason}</p>
                    )}
                  </div>
                )}

                {hasPendingAmendment && isCounterparty && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => setShowAmendmentResponse(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Review Amendment Request
                    </Button>
                  </div>
                )}

                {!hasPendingAmendment && isCreator && agreement.status !== "cancelled" && (
                  <div className="mt-2">
                    <AmendmentRequestDialog
                      agreementId={agreement.id}
                      agreementTitle={agreement.title}
                      onSuccess={() => refreshAgreements()}
                      trigger={
                        <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10">
                          <Unlock className="w-4 h-4 mr-2" />
                          Request Amendment
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {hasPendingAmendment && isCounterparty && agreement.amendmentReason && (
          <AmendmentResponseDialog
            agreementId={agreement.id}
            agreementTitle={agreement.title}
            amendmentReason={agreement.amendmentReason}
            amendmentProposedChanges={agreement.amendmentProposedChanges as string | null}
            requestedBy={agreement.amendmentRequestedBy || "Creator"}
            open={showAmendmentResponse}
            onOpenChange={setShowAmendmentResponse}
            onSuccess={() => refreshAgreements()}
          />
        )}

        {/* Core Clauses */}
        {(purpose || terms || scope || consequences || witnessNotes || witnessRequired) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span className="font-semibold">Core Clauses</span>
                </div>
              </div>
              {purpose && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Purpose</p>
                  <p className="text-white leading-relaxed">{purpose}</p>
                </div>
              )}
              {terms && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Terms</p>
                  <p className="text-white leading-relaxed">{terms}</p>
                </div>
              )}
              {scope && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Scope of Work</p>
                  <p className="text-white leading-relaxed">{scope}</p>
                </div>
              )}
              {consequences && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Breach Consequences</p>
                  <p className="text-white leading-relaxed">{consequences}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <Shield className="w-4 h-4 text-emerald-300" />
                  <span className="font-semibold">Witness & Safeguards</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    witnessRequired
                      ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/30"
                      : "bg-slate-800 text-slate-200 border-slate-700"
                  }
                >
                  Witness {witnessRequired ? "Required" : "Optional"}
                </Badge>
              </div>
              {witnessNotes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Witness Notes</p>
                  <p className="text-white leading-relaxed">{witnessNotes}</p>
                </div>
              )}
              {!witnessNotes && !witnessRequired && (
                <p className="text-slate-400 text-sm">No additional witness instructions provided.</p>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Title & Description */}
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">{agreement.title}</h3>
            {agreement.description && <p className="text-slate-300 leading-relaxed">{agreement.description}</p>}
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Effective Date
            </div>
            <p className="text-white font-semibold">{formatDate(agreement.effectiveDate)}</p>
          </div>

          {(agreement.deadline || agreement.endDate || agreement.targetDate || agreement.isPermanent === true) && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                {agreement.isPermanent === true
                  ? "Valid Until"
                  : agreement.deadline
                    ? "Deadline"
                    : agreement.targetDate
                      ? "Target Date"
                      : "End Date"}
              </div>
              <p className="text-white font-semibold">
                {agreement.isPermanent === true
                  ? formatDate(agreement.effectiveDate)
                  : formatDate(agreement.deadline || agreement.targetDate || agreement.endDate)}
              </p>
            </div>
          )}

          {agreement.betAmount && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Stake Amount
              </div>
              <p className="text-white font-semibold">{agreement.betAmount}</p>
            </div>
          )}

          {agreement.recurrenceFrequency && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Repeat className="w-4 h-4" />
                Frequency
              </div>
              <p className="text-white font-semibold capitalize">{agreement.recurrenceFrequency}</p>
            </div>
          )}

          {agreement.priority && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Shield className="w-4 h-4" />
                Priority
              </div>
              <p className="text-white font-semibold capitalize">{agreement.priority}</p>
            </div>
          )}
        </div>

        {/* Full Template Details */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <FileText className="w-4 h-4 text-blue-300" />
              <span className="font-semibold text-white">Full Agreement Inputs</span>
            </div>
            <div className="flex items-center gap-2">
              {(hasCounterpartySigned || isLocked) && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-200 border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {hasCounterpartySigned ? "Locked after counterparty signature" : "Locked"}
                </Badge>
              )}
              {!hasCounterpartySigned && !isLocked && (
                isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )
              )}
            </div>
          </div>
          {templateEntries.length === 0 ? (
            <p className="text-slate-400 text-sm">No additional template fields captured for this agreement.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {templateEntries.map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{formatLabel(key)}</p>
                  {isEditing && !hasCounterpartySigned && !isLocked ? (
                    typeof value === "boolean" ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => handleFieldChange(key, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-white">{value ? "Yes" : "No"}</span>
                      </div>
                    ) : (
                      <Input
                        value={value === undefined || value === null ? "" : String(value)}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                      />
                    )
                  ) : (
                    <p className="text-white font-semibold mt-1 break-words">{formatValue(value)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participants & Status */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Counterparty
            </div>
            {counterparty ? (
              <div className="space-y-1">
                <p className="text-white font-semibold">{counterparty.userName || counterparty.userEmail}</p>
                <p className="text-slate-400 text-sm">{counterparty.userEmail}</p>
                <Badge variant="outline" className="border-amber-400/40 text-amber-300 bg-amber-500/10">
                  {counterparty.status || "Pending"}
                </Badge>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No counterparty added.</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Shield className="w-4 h-4" />
              Confidentiality
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-900 text-white border-slate-700">
                {agreement.confidentialityLevel || "Standard"}
              </Badge>
              {agreement.witnessRequired && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-200 border-purple-400/30">
                  Witness required
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Witnesses */}
        {witnesses.length > 0 && (
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Shield className="w-4 h-4" />
              Witnesses
            </div>
            <div className="space-y-1">
              {witnesses.map((w) => (
                <div key={w.userEmail} className="flex items-center gap-2 text-sm text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="font-semibold">{w.userName || w.userEmail}</span>
                  <span className="text-slate-400">{w.userEmail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category & Tags */}
        {(agreement.category || (agreement.tags && agreement.tags.length > 0)) && (
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Tag className="w-4 h-4" />
              Classification
            </div>
            <div className="flex flex-wrap gap-2">
              {agreement.category && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-400/30">
                  {agreement.category}
                </Badge>
              )}
              {agreement.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-slate-900 text-slate-200 border-slate-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
