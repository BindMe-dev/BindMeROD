"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import type { AgreementTemplate } from "@/lib/templates"
import { TemplateForm } from "@/components/template-form"
import { SignaturePad } from "@/components/signature-pad"
import { TermsAndConditions } from "@/components/terms-and-conditions"
import { UserSearchDialog } from "@/components/user-search-dialog"
import type { SearchableUser } from "@/lib/user-search"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Shield, ArrowLeft, X, UserPlus, Loader2 } from "lucide-react"
import { StepContent } from "@/components/step-content"
import { useClientStamp } from "@/lib/use-client-stamp"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]
type ButtonSize = React.ComponentProps<typeof Button>["size"]

interface CreateAgreementDialogProps {
  triggerVariant?: "default" | "outline" | "ghost"
  triggerClassName?: string
  triggerSize?: "sm" | "lg"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  selectedTemplate?: AgreementTemplate | null
  onTemplateCleared?: () => void
  prefillCounterparty?: { name?: string; email?: string; userId?: string }
}

export function CreateAgreementDialog({
  triggerVariant = "default",
  triggerClassName = "",
  triggerSize = "lg",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  selectedTemplate: externalTemplate,
  onTemplateCleared,
  prefillCounterparty,
}: CreateAgreementDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { addAgreement, addAuditLog } = useAgreements()
  const { toast } = useToast()
  
  // Pre-load stamp data early instead of waiting for signature step
  const { ipAddress: resolvedIp, location: resolvedLocation, loading: stampLoading } = useClientStamp(true)

  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AgreementTemplate | null>(externalTemplate || null)
  const [currentStep, setCurrentStep] = useState(1) // Start after template selection (templates picked on dedicated page)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  // Update internal template when external template changes
  useEffect(() => {
    if (externalTemplate) {
      setSelectedTemplate(externalTemplate)
      const initialValues: Record<string, any> = {}
      const initialRequirements: Record<string, boolean> = {}
      externalTemplate.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialValues[field.id] = field.defaultValue
        }
        initialRequirements[field.id] = field.required
      })
      setTemplateValues(initialValues)
      setFieldRequirements(initialRequirements)
      setCurrentStep(1)
    }
  }, [externalTemplate])

  const [templateValues, setTemplateValues] = useState<Record<string, any>>({})
  const [fieldRequirements, setFieldRequirements] = useState<Record<string, boolean>>({})
  
  // Counterparty management
  const [counterparties, setCounterparties] = useState<{ name: string; email: string; userId?: string; dateOfBirth?: string; address?: string }[]>([])
  const [counterpartyName, setCounterpartyName] = useState("")
  const [counterpartyEmail, setCounterpartyEmail] = useState("")
  const [counterpartyAddress, setCounterpartyAddress] = useState("")
  const [counterpartyDob, setCounterpartyDob] = useState("")
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [witnessSearchMode, setWitnessSearchMode] = useState(false)

  // Prefill a counterparty passed in (e.g., from search) once
  useEffect(() => {
    const prefill = prefillCounterparty
    if (!prefill || !prefill.email) return
    setCounterparties((prev) => {
      if (prev.some((p) => p.email.toLowerCase() === prefill.email!.toLowerCase())) return prev
      return [
        ...prev,
        {
          name: prefill.name || "",
          email: prefill.email,
          userId: prefill.userId,
        },
      ]
    })
  }, [prefillCounterparty])
  // Legal step
  const [showLegalStep, setShowLegalStep] = useState(false)
  const [legalIntentAccepted, setLegalIntentAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-save form data to localStorage every few seconds
  useEffect(() => {
    if (!open || !selectedTemplate) return
    
    const autoSaveTimer = setTimeout(() => {
      const autoSaveData = {
        templateId: selectedTemplate.id,
        templateValues,
        counterparties,
        fieldRequirements,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('agreement-draft-autosave', JSON.stringify(autoSaveData))
    }, 2000) // Debounce for 2 seconds
    
    return () => clearTimeout(autoSaveTimer)
  }, [open, selectedTemplate, templateValues, counterparties, fieldRequirements])

  // Restore from localStorage on template selection
  useEffect(() => {
    if (!open || !selectedTemplate) return
    
    const savedData = localStorage.getItem('agreement-draft-autosave')
    if (!savedData) return
    
    try {
      const parsed = JSON.parse(savedData)
      // Only restore if it's for the same template and less than 24 hours old
      if (parsed.templateId === selectedTemplate.id) {
        const savedTime = new Date(parsed.timestamp).getTime()
        const now = new Date().getTime()
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          setTemplateValues(parsed.templateValues || {})
          setCounterparties(parsed.counterparties || [])
          setFieldRequirements(parsed.fieldRequirements || {})
          
          toast({
            title: "Draft Restored",
            description: "Your previous progress has been restored.",
          })
        }
      }
    } catch (error) {
      console.error("Failed to restore autosave:", error)
    }
  }, [open, selectedTemplate, toast])

  useEffect(() => {
    if (!selectedTemplate || !user) return

    const hasCreatorName = selectedTemplate.fields.some((field) => field.id === "partyAName")
    const hasCreatorDob = selectedTemplate.fields.some((field) => field.id === "partyADob")
    const hasCreatorAddress = selectedTemplate.fields.some((field) => field.id === "partyAAddress")
    if (!hasCreatorName && !hasCreatorDob && !hasCreatorAddress) return

    setTemplateValues((prev) => {
      let changed = false
      const next = { ...prev }

      if (hasCreatorName && user.name && !prev.partyAName) {
        next.partyAName = user.name
        changed = true
      }
      if (hasCreatorDob && user.dateOfBirth && !prev.partyADob) {
        next.partyADob = user.dateOfBirth
        changed = true
      }
      if (hasCreatorAddress && user.address && !prev.partyAAddress) {
        next.partyAAddress = user.address
        changed = true
      }

      return changed ? next : prev
    })
  }, [selectedTemplate, user])

  useEffect(() => {
    if (!selectedTemplate) return

    const hasCounterpartyName = selectedTemplate.fields.some((field) => field.id === "partyBName")
    const hasCounterpartyDob = selectedTemplate.fields.some((field) => field.id === "partyBDob")
    const hasCounterpartyAddress = selectedTemplate.fields.some((field) => field.id === "partyBAddress")
    if (!hasCounterpartyName && !hasCounterpartyDob && !hasCounterpartyAddress) return

    // For single-counterparty templates, always mirror the sole counterparty into the template fields.
    if (selectedTemplate.counterpartyType === "single") {
      if (counterparties.length === 1) {
        const party = counterparties[0]
        setTemplateValues((prev) => ({
          ...prev,
          ...(hasCounterpartyName ? { partyBName: party.name || "" } : {}),
          ...(hasCounterpartyDob ? { partyBDob: party.dateOfBirth || "" } : {}),
          ...(hasCounterpartyAddress ? { partyBAddress: party.address || "" } : {}),
        }))
      } else if (counterparties.length === 0) {
        setTemplateValues((prev) => ({
          ...prev,
          ...(hasCounterpartyName ? { partyBName: "" } : {}),
          ...(hasCounterpartyDob ? { partyBDob: "" } : {}),
          ...(hasCounterpartyAddress ? { partyBAddress: "" } : {}),
        }))
      }
    } else if (counterparties.length === 1) {
      // For multi templates, prefill from first when only one present.
      const party = counterparties[0]
      setTemplateValues((prev) => ({
        ...prev,
        ...(hasCounterpartyName ? { partyBName: party.name || "" } : {}),
        ...(hasCounterpartyDob ? { partyBDob: party.dateOfBirth || "" } : {}),
        ...(hasCounterpartyAddress ? { partyBAddress: party.address || "" } : {}),
      }))
    }
  }, [counterparties, selectedTemplate])

  // Keep form fields in sync with selected counterparties (primary entry)
  useEffect(() => {
    if (counterparties.length === 0) return
    const primary = counterparties[0]
    setCounterpartyName(primary.name || "")
    setCounterpartyEmail(primary.email || "")
    setCounterpartyDob(primary.dateOfBirth || "")
    setCounterpartyAddress(primary.address || "")
  }, [counterparties])

  const handleTemplateFieldChange = (fieldId: string, value: any) => {
    setTemplateValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const getPreSubmissionPrompts = () => {
    if (!selectedTemplate) return []

    const prompts: string[] = []
    const witnessChecked = templateValues.witnessRequired === true

    if (selectedTemplate.id === "loan-agreement") {
      const loanAmount = Number(templateValues.loanAmount || 0)
      if (loanAmount >= 1000 && !witnessChecked) {
        prompts.push(
          `This loan is GBP ${loanAmount.toFixed(2)}. Consider adding a witness, capturing ID details, and confirming proof of funds/repayment.`,
        )
      }
      if ((templateValues.interestType || "none") !== "none" && !templateValues.interestRate) {
        prompts.push("You've selected interest but haven't set a rate. Add a rate or change the interest type to 'none'.")
      }
      if (templateValues.repaymentStructure === "instalments" && !templateValues.instalmentAmount) {
        prompts.push("Add the instalment amount and schedule so repayments are unambiguous.")
      }
    }

    if (selectedTemplate.id === "item-lending") {
      const itemValue = Number(templateValues.itemValue || 0)
      if (itemValue >= 500 && !witnessChecked) {
        prompts.push("High-value item - consider adding a witness and photos of condition at handover.")
      }
      if (!templateValues.insuranceResponsibility) {
        prompts.push("Clarify who provides insurance (owner vs borrower) to avoid gaps during the loan period.")
      }
    }

    if (selectedTemplate.id === "rental-agreement") {
      const rent = Number(templateValues.rentAmount || 0)
      const deposit = Number(templateValues.depositAmount || 0)
      if (rent && deposit) {
        const weeklyRent = (rent * 12) / 52
        const maxDeposit = weeklyRent * 5
        if (deposit > maxDeposit) {
          prompts.push("Deposit looks higher than the usual 5 weeks' rent cap. Adjust or document why it complies.")
        }
      }
      if (!templateValues.depositScheme) {
        prompts.push("Add the tenancy deposit scheme name/reference so the tenant receives the prescribed information.")
      }
    }

    if (selectedTemplate.id === "private-wager") {
      const stakeAmount = Number(templateValues.stakeAmount || 0)
      if (templateValues.stakeType === "monetary" && stakeAmount >= 500 && !witnessChecked) {
        prompts.push("Large stake wager - consider adding a witness and a clear third-party source for determining the result.")
      }
    }

    return prompts
  }

  const handlePreSubmissionPrompts = () => {
    const prompts = getPreSubmissionPrompts()
    if (prompts.length === 0) return true

    const message = `${prompts.join("\n\n")}\n\nContinue to signatures?`
    return window.confirm(message)
  }

  const handleAddCounterparty = () => {
    if (!counterpartyName.trim() || !counterpartyEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and email for the counterparty.",
        variant: "destructive",
      })
      return
    }
    const emailLower = counterpartyEmail.trim().toLowerCase()
    if (counterparties.some(p => p.email.toLowerCase() === emailLower)) {
      toast({
        title: "Duplicate Counterparty",
        description: "This counterparty has already been added.",
        variant: "destructive",
      })
      return
    }
    if (selectedTemplate?.counterpartyType === "single" && counterparties.length >= 1) {
      toast({
        title: "Counterparty Limit Reached",
        description: "This template allows only one counterparty.",
        variant: "destructive",
      })
      return
    }
    setCounterparties(prev => [...prev, { 
      name: counterpartyName.trim(), 
      email: counterpartyEmail.trim(),
      dateOfBirth: counterpartyDob ? counterpartyDob.trim() : undefined,
      address: counterpartyAddress ? counterpartyAddress.trim() : undefined, 
    }])
    setCounterpartyName("")
    setCounterpartyEmail("")
    setCounterpartyDob("")
    setCounterpartyAddress("")
  }

  const openCounterpartySearch = () => {
    setWitnessSearchMode(false)
    setUserSearchOpen(true)
  }

  const openWitnessSearch = () => {
    setWitnessSearchMode(true)
    setUserSearchOpen(true)
  }

  const handleRemoveCounterparty = (email: string) => {
    setCounterparties(prev => prev.filter(p => p.email !== email))
  }

  const handleNextStep = () => {
    if (currentStep === 1 && selectedTemplate?.counterpartyType === "none") {
      setCurrentStep(3) // Skip counterparty step if no counterparty needed
    } else if (currentStep === 6 && !templateValues.witnessRequired) {
      setCurrentStep(8) // Skip witness step if witness not required
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 3 && selectedTemplate?.counterpartyType === "none") {
      setCurrentStep(1) // Skip counterparty step when going back
    } else if (currentStep === 8 && !templateValues.witnessRequired) {
      setCurrentStep(6) // Skip witness step when going back
    } else {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSaveAsDraft = async () => {
    if (!user || !selectedTemplate) {
      toast({
        title: "Cannot Save Draft",
        description: "Template selection is required.",
        variant: "destructive",
      })
      return
    }

    const primaryCounterparty = counterparties[0]
    const derivedDeadline = templateValues.deadline || templateValues.targetDate || templateValues.loanEndDate
    const derivedBetSettlement = templateValues.betSettlementDate
    const derivedBetStake = templateValues.stakeType === "monetary" ? templateValues.stakeAmount : templateValues.stakeDescription

    const draftAgreement = {
      userId: user.id,
      title: templateValues.title || selectedTemplate.title || "Untitled Agreement",
      description: templateValues.description || selectedTemplate.description || `Draft agreement from ${selectedTemplate.title} template`,
      type: selectedTemplate.type,
      templateId: selectedTemplate.id,
      templateValues,
      effectiveDate: new Date().toISOString().split("T")[0],
      isShared: counterparties.length > 0,
      sharedWith: counterparties.map((p) => ({
        role: "counterparty" as const,
        userId: p.userId ?? null,
        userName: p.name,
        userEmail: p.email,
        joinedAt: new Date().toISOString(),
      })),
      ...(selectedTemplate.type === "recurring" && {
        recurrenceFrequency: templateValues.recurrenceFrequency || "daily",
        startDate: templateValues.startDate || new Date().toISOString().split("T")[0],
      }),
      ...(selectedTemplate.type === "deadline" && {
        deadline: derivedDeadline,
      }),
      ...(selectedTemplate.type === "bet" && {
        betStake: derivedBetStake,
        betAmount: templateValues.stakeAmount,
        betOpponentName: templateValues.partyBName || primaryCounterparty?.name,
        betOpponentEmail: primaryCounterparty?.email,
        betSettlementDate: derivedBetSettlement,
        betTerms: templateValues.determinationMethod,
      }),
    }

    try {
      setIsSubmitting(true)
      const createdId = await addAgreement(draftAgreement)
      
      toast({
        title: "Draft Saved",
        description: "Your agreement has been saved as a draft. You can complete it later.",
      })
      
      onOpenChange(false)
      resetForm()
      
      if (createdId) {
        router.push(`/agreement/${createdId}`)
      }
    } catch (error) {
      console.error("Draft save error:", error)
      toast({
        title: "Failed to Save Draft",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Your Details"
      case 2: return "Add Counterparty"
      case 3: return "Agreement Purpose"
      case 4: return "Agreement Details"
      case 5: return "Licenses & Dates"
      case 6: return "Scope & Consequences"
      case 7: return "Witness Requirements"
      case 8: return "Sign Agreement"
      default: return "Create Agreement"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Confirm your details for this agreement"
      case 2: return "Add the other party to this agreement"
      case 3: return "Define the purpose and key terms"
      case 4: return "Fill in the remaining agreement details"
      case 5: return "License IDs and important dates"
      case 6: return "Define scope and breach consequences"
      case 7: return "Configure witness requirements"
      case 8: return "Review and sign your agreement"
      default: return ""
    }
  }

  const canProceedFromStep = () => {
    switch (currentStep) {
      case 1: return !!selectedTemplate // Must have a template from dedicated page
      case 2: 
        if (selectedTemplate?.counterpartyType === "single") {
          return counterparties.length === 1
        }
        if (selectedTemplate?.counterpartyType === "multiple") {
          return counterparties.length > 0
        }
        return true
      case 3:
        return templateValues.purpose && templateValues.purpose.length >= 20 && templateValues.terms
      case 4:
        // Check required fields for current step
        const requiredFields = selectedTemplate?.fields.filter(f => 
          (fieldRequirements[f.id] ?? f.required) && 
          !['purpose', 'terms', 'scopeOfWork', 'breachConsequences', 'witnessRequired', 'witnessNotes', 'partyAName', 'partyADob', 'partyAAddress', 'partyBName', 'partyBDob', 'partyBAddress', 'partyALicenceId', 'partyBLicenceId', 'agreementDate', 'contractStartDate', 'contractEndDate', 'isPermanent'].includes(f.id)
        ) || []
        return requiredFields.every(field => templateValues[field.id])
      case 5:
      case 6:
      case 7: {
        if (templateValues.witnessRequired) {
          const hasWitness = templateValues.witnessName && templateValues.witnessEmail
          return Boolean(hasWitness)
        }
        return true // License/dates, scope/breach, and witness (when optional) are skippable
      }
      default: return true
    }
  }

  const handleSignatureComplete = (signatureData: string) => {
    setSignature(signatureData)
  }

  const validateForm = () => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a template first.",
        variant: "destructive",
      })
      return false
    }

    const parseDate = (value: any) => {
      if (!value) return null
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    }

    const isBefore = (a: Date | null, b: Date | null) => {
      if (!a || !b) return false
      return a.getTime() < b.getTime()
    }

    // Validate required template fields (non-togglable stay at template required)
    for (const field of selectedTemplate.fields) {
      const isRequired = fieldRequirements[field.id] ?? field.required
      if (isRequired && !templateValues[field.id]) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in: ${field.label}`,
          variant: "destructive",
        })
        return false
      }
      // Special validation for purpose field - minimum 20 characters
      if (field.id === "purpose" && templateValues[field.id] && templateValues[field.id].length < 20) {
        toast({
          title: "Purpose Too Short",
          description: "Purpose must be at least 20 characters long.",
          variant: "destructive",
        })
        return false
      }
    }

    // Date validation rules
    const startDate = parseDate(templateValues.startDate)
    const agreementDate = parseDate(templateValues.agreementDate)
    const contractStartDate = parseDate(templateValues.contractStartDate)
    const contractEndDate = parseDate(templateValues.contractEndDate)
    const targetDate = parseDate(templateValues.targetDate)
    const deadline = parseDate(templateValues.deadline)
    const betSettlementDate = parseDate(templateValues.betSettlementDate)
    const loanEndDate = parseDate(templateValues.loanEndDate)
    const singleRepaymentDate = parseDate(templateValues.singleRepaymentDate)
    const instalmentEnd = parseDate(templateValues.instalmentEnd)
    const endDate = parseDate(templateValues.endDate)

    // Contract start cannot be before agreement signing date
    if (agreementDate && contractStartDate && isBefore(contractStartDate, agreementDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Contract start date cannot be before the agreement date.",
        variant: "destructive",
      })
      return false
    }

    // Contract end cannot precede contract start
    if (contractEndDate && contractStartDate && isBefore(contractEndDate, contractStartDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Contract end date cannot be before the contract start date.",
        variant: "destructive",
      })
      return false
    }

    // End-style dates cannot be before the start
    const effectiveStart = contractStartDate || startDate || agreementDate
    const endCandidates = [targetDate, deadline, betSettlementDate, loanEndDate, singleRepaymentDate, instalmentEnd, contractEndDate, endDate]
    for (const d of endCandidates) {
      if (d && effectiveStart && isBefore(d, effectiveStart)) {
        toast({
          title: "Invalid Date Range",
          description: "End/deadline date cannot be before the start date.",
          variant: "destructive",
        })
        return false
      }
    }

    // Validate counterparty requirements
    if (selectedTemplate.counterpartyType === "single" && counterparties.length !== 1) {
      toast({
        title: "Counterparty Required",
        description: "This template requires exactly one counterparty.",
        variant: "destructive",
      })
      return false
    }
    if (selectedTemplate.counterpartyType === "multiple" && counterparties.length === 0) {
      toast({
        title: "Counterparty Required",
        description: "This template requires at least one counterparty.",
        variant: "destructive",
      })
      return false
    }

    if (selectedTemplate.type === "deadline") {
      const hasDeadline =
        templateValues.deadline ||
        templateValues.targetDate ||
        templateValues.loanEndDate ||
        templateValues.singleRepaymentDate ||
        templateValues.instalmentEnd ||
        templateValues.endDate

      if (!hasDeadline) {
        toast({
          title: "Deadline Required",
          description: "Please add a due or end date for this deadline agreement.",
          variant: "destructive",
        })
        return false
      }
    }

    if (selectedTemplate.type === "bet") {
      const hasStake = templateValues.stakeAmount || templateValues.stakeDescription || templateValues.betStake
      if (!hasStake) {
        toast({
          title: "Stake Required",
          description: "Please add the stake (money or other consideration) for this wager.",
          variant: "destructive",
        })
        return false
      }

      const hasSettlement = templateValues.betSettlementDate || Number(templateValues.paymentDeadlineDays || 0) > 0
      if (!hasSettlement) {
        toast({
          title: "Settlement Date Required",
          description: "Please add when the stake will be settled (date or days after the result).",
          variant: "destructive",
        })
        return false
      }
    }

    // Require witness info when witnessRequired is on
    if (templateValues.witnessRequired) {
      if (!templateValues.witnessName || !templateValues.witnessEmail) {
        toast({
          title: "Witness Information Required",
          description: "Please add witness name and email.",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("=== FORM SUBMISSION STARTED ===")
    console.log("Current step:", currentStep)
    console.log("User:", user?.email)
    console.log("Selected template:", selectedTemplate?.title)
    console.log("Legal intent accepted:", legalIntentAccepted)
    console.log("Terms accepted:", termsAccepted)
    console.log("Signature:", signature ? "Present" : "Missing")
    
    if (!user || !selectedTemplate || currentStep !== 8) {
      console.log("VALIDATION FAILED: Missing requirements", {
        hasUser: !!user,
        hasTemplate: !!selectedTemplate,
        currentStep,
      })
      return
    }

    if (!legalIntentAccepted || !termsAccepted || !signature) {
      console.log("VALIDATION FAILED: Legal requirements incomplete")
      toast({
        title: "Legal Requirements Incomplete",
        description: "Please accept all legal requirements and provide your signature.",
        variant: "destructive",
      })
      return
    }

    console.log("Validation passed, preparing agreement data...")

    const primaryCounterparty = counterparties[0]
    const derivedDeadline =
      templateValues.deadline ||
      templateValues.targetDate ||
      templateValues.loanEndDate ||
      templateValues.singleRepaymentDate ||
      templateValues.instalmentEnd ||
      templateValues.endDate

    const derivedBetSettlement =
      templateValues.betSettlementDate ||
      (Number(templateValues.paymentDeadlineDays || 0) > 0
        ? new Date(
            Date.now() + Number(templateValues.paymentDeadlineDays) * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0]
        : undefined)

    const derivedBetStake =
      templateValues.stakeType === "monetary"
        ? templateValues.stakeAmount
        : templateValues.stakeDescription || templateValues.stakeAmount

    // Create agreement based on template with proper field mapping
    const baseAgreement = {
      userId: user.id,
      title: templateValues.title || selectedTemplate.title,
      description: templateValues.description || selectedTemplate.description || `Agreement created from ${selectedTemplate.title} template`,
      type: selectedTemplate.type,
      templateId: selectedTemplate.id,
      templateValues,
      effectiveDate: new Date().toISOString().split("T")[0],
      isShared: counterparties.length > 0,
      sharedWith: counterparties.map((p) => ({
        role: "counterparty" as const,
        userId: p.userId ?? null,
        userName: p.name,
        userEmail: p.email,
        joinedAt: new Date().toISOString(),
      })),
      // Add required fields based on template type
      ...(selectedTemplate.type === "recurring" && {
        recurrenceFrequency: templateValues.recurrenceFrequency || selectedTemplate.recurrenceFrequency || "daily",
        startDate: templateValues.startDate || new Date().toISOString().split("T")[0],
      }),
      ...(selectedTemplate.type === "deadline" && {
        deadline: derivedDeadline,
      }),
      ...(selectedTemplate.type === "bet" && {
        betStake: derivedBetStake,
        betAmount: templateValues.stakeAmount,
        betOdds: templateValues.betOdds,
        betOpponentName: templateValues.partyBName || primaryCounterparty?.name || templateValues.betOpponentName,
        betOpponentEmail: primaryCounterparty?.email || templateValues.betOpponentEmail,
        betSettlementDate: derivedBetSettlement,
        betTerms: templateValues.determinationMethod || templateValues.betTerms,
      }),
      legal: {
        legalIntentAccepted: true,
        termsAcceptedVersion: "1.0.0",
        jurisdictionClause: "United Kingdom",
        emailConfirmationSent: false,
        auditLog: [],
        signatures: [
          {
            signedBy: user.id,
            signedByEmail: user.email,
            signedByName: user.name,
            signatureData: signature,
            role: "creator" as const,
            ipAddress: resolvedIp || "",
            userAgent: navigator.userAgent,
            location: resolvedLocation || "",
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }

    try {
      setIsSubmitting(true)
      
      console.log("Creating agreement with data:", baseAgreement)
      console.log("Signature:", signature)
      console.log("Legal intent accepted:", legalIntentAccepted)
      console.log("Terms accepted:", termsAccepted)
      
      const createdId = await addAgreement(baseAgreement)
      
      console.log("Agreement created successfully:", createdId)
      
      toast({
        title: "Agreement Created",
        description: "Your agreement has been created successfully.",
      })
      
      onOpenChange(false)
      resetForm()
      if (createdId) {
        router.push(`/agreement/${createdId}`)
      }
    } catch (error) {
      console.error("Agreement creation error:", error)
      toast({
        title: "Agreement Creation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    setShowLegalStep(false)
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setTemplateValues({})
    setFieldRequirements({})
    setCounterparties([])
    setCounterpartyName("")
    setCounterpartyEmail("")
    setCounterpartyDob("")
    setCounterpartyAddress("")
    setShowLegalStep(false)
    setLegalIntentAccepted(false)
    setTermsAccepted(false)
    setSignature(null)
    setCurrentStep(0)
    onTemplateCleared?.()
  }

  return (
    <>
      <UserSearchDialog
        open={userSearchOpen}
        onOpenChange={(newOpen) => {
          setUserSearchOpen(newOpen)
          if (!newOpen) setWitnessSearchMode(false)
        }}
        onUserSelect={(selected: SearchableUser) => {
          if (!selected) return
          if (witnessSearchMode) {
            setTemplateValues((prev) => ({
              ...prev,
              witnessName: selected.name || "",
              witnessEmail: selected.email || "",
              witnessRequired: true,
            }))
            setWitnessSearchMode(false)
            setUserSearchOpen(false)
            return
          }

          const exists = counterparties.some(p => p.email.toLowerCase() === selected.email.toLowerCase())
          if (exists) return
          setCounterparties(prev => [...prev, { 
            name: selected.name, 
            email: selected.email, 
            userId: selected.id,
            dateOfBirth: selected.dateOfBirth,
            address: selected.address,
          }])
          setUserSearchOpen(false)
        }}
      />

            <Dialog open={open} onOpenChange={(newOpen) => {
        // Check if user has made changes before closing
        if (!newOpen && currentStep > 0) {
          const hasChanges = 
            counterparties.length > 0 ||
            Object.keys(templateValues).length > 0 ||
            signature !== null
          
          if (hasChanges) {
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to close? Your progress has been auto-saved."
            )
            if (!confirmed) return
          }
        }
        
        onOpenChange(newOpen)
        if (!newOpen) {
          resetForm()
          setWitnessSearchMode(false)
          localStorage.removeItem('agreement-draft-autosave')
        }
      }}>
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            <Button size={triggerSize} variant={triggerVariant} className={`gap-2 ${triggerClassName}`}>
              <Plus className="w-5 h-5" />
              New Agreement
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800 bg-slate-950 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5" />
              {getStepTitle()}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {getStepDescription()}
            </DialogDescription>
            {/* Progress indicator */}
            {selectedTemplate && (
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                  const isActive = currentStep === step
                  const isCompleted = currentStep > step
                  const shouldShow = step !== 2 || selectedTemplate.counterpartyType !== "none"
                  
                  if (!shouldShow) return null
                  
                  return (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        isActive ? 'bg-blue-500' : isCompleted ? 'bg-green-500' : 'bg-slate-800'
                      }`}
                    />
                  )
                })}
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedTemplate ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">Select a template first on the Templates page to create an agreement.</p>
                <Button type="button" onClick={() => router.push("/templates")} className="mx-auto">
                  Go to Templates
                </Button>
              </div>
            ) : currentStep === 8 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrevStep}
                    className="bg-white text-black hover:bg-white hover:text-black"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Back to details</span>
                </div>

                <TermsAndConditions
                  legalIntentAccepted={legalIntentAccepted}
                  termsAccepted={termsAccepted}
                  onLegalIntentChange={setLegalIntentAccepted}
                  onTermsChange={setTermsAccepted}
                />

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Digital Signature</h4>
                  <SignaturePad onSignatureComplete={handleSignatureComplete} userName={user?.name} />
                  {!stampLoading && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Timestamp: {new Date().toLocaleString()} • {resolvedLocation || "Location verified"}</span>
                    </div>
                  )}
                  {signature && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900">
                      Signature captured successfully.
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating agreement...
                    </span>
                  ) : (
                    "Create Agreement"
                  )}
                </Button>
              </div>
            ) : (
              <StepContent
                currentStep={currentStep}
                selectedTemplate={selectedTemplate}
                user={user}
                templateValues={templateValues}
                fieldRequirements={fieldRequirements}
                counterparties={counterparties}
                counterpartyName={counterpartyName}
                counterpartyEmail={counterpartyEmail}
                counterpartyDob={counterpartyDob}
                counterpartyAddress={counterpartyAddress}
                onFieldChange={handleTemplateFieldChange}
                onRequirementChange={(fieldId, required) =>
                  setFieldRequirements((prev) => ({ ...prev, [fieldId]: required }))
                }
                onCounterpartyNameChange={setCounterpartyName}
                onCounterpartyEmailChange={setCounterpartyEmail}
                onCounterpartyDobChange={setCounterpartyDob}
                onCounterpartyAddressChange={setCounterpartyAddress}
                onAddCounterparty={handleAddCounterparty}
                onRemoveCounterparty={handleRemoveCounterparty}
                onUserSearchOpen={openCounterpartySearch}
                onWitnessSearchOpen={openWitnessSearch}
                canProceed={canProceedFromStep()}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                onSaveAsDraft={handleSaveAsDraft}
              />
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
