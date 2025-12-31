"use client"

import type { AgreementTemplate, TemplateField } from "@/lib/templates"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, User, UserX, X, CircleHelp } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { useEffect } from "react"

interface TemplateFormProps {
  template: AgreementTemplate
  onFieldChange: (fieldId: string, value: any) => void
  values: Record<string, any>
  fieldRequirements: Record<string, boolean>
  onRequirementChange: (fieldId: string, required: boolean) => void
  creatorName?: string
  creatorDob?: string
  creatorAddress?: string
  counterparties?: { userId?: string; name: string; email: string; dateOfBirth?: string; address?: string }[]
  counterpartyControls?: React.ReactNode
}

export function TemplateForm({
  template,
  onFieldChange,
  values,
  fieldRequirements,
  onRequirementChange,
  creatorName,
  creatorDob,
  creatorAddress,
  counterparties = [],
  counterpartyControls,
}: TemplateFormProps) {
  // Auto-fill governing law based on IP
  useEffect(() => {
    const autoFillGoverningLaw = async () => {
      if (values.governingLaw && values.governingLaw.length > 0) return // Don't override if already set
      
      try {
        const response = await fetch('/api/geolocation')
        const data = await response.json()
        if (data.governingLaw) {
          onFieldChange('governingLaw', [data.governingLaw])
        }
      } catch (error) {
        // Fallback to default
        onFieldChange('governingLaw', ['England and Wales'])
      }
    }
    
    autoFillGoverningLaw()
  }, [])

  // Ensure governing law always has at least one value
  useEffect(() => {
    if (!values.governingLaw || values.governingLaw.length === 0) {
      onFieldChange('governingLaw', ['England and Wales'])
    }
  }, [values.governingLaw])
  const TOGGLABLE_FIELD_IDS = new Set([
    "scopeOfWork",
    "paymentOrConsideration",
    "timeline",
    "disputeResolution",
    "breachConsequences",
  ])

  const getCounterpartyIcon = (counterpartyType: string) => {
    switch (counterpartyType) {
      case "none": return <UserX className="w-4 h-4" />
      case "single": return <User className="w-4 h-4" />
      case "multiple": return <Users className="w-4 h-4" />
      default: return null
    }
  }

  const getCounterpartyLabel = (counterpartyType: string) => {
    switch (counterpartyType) {
      case "none": return "Personal commitment - no counterparties needed"
      case "single": return "Requires exactly one counterparty"
      case "multiple": return "Allows multiple counterparties"
      default: return ""
    }
  }

  const isWitnessRequired = Boolean(values.witnessRequired)

  const renderField = (field: TemplateField, isRequired: boolean) => {
    const value = values[field.id] ?? field.defaultValue ?? ""
    
    // Disable creator fields - they should be read-only
    const isCreatorField = field.id === "partyAName" || field.id === "partyADob" || field.id === "partyAAddress"
    // Disable counterparty fields if they come from user search
    const isCounterpartyField = field.id === "partyBName" || field.id === "partyBDob" || field.id === "partyBAddress"
    const hasCounterpartyData = Boolean(counterparties && counterparties.length > 0 && counterparties[0].userId)
    
    switch (field.type) {
      case "text":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={isRequired}
            disabled={isCreatorField || (isCounterpartyField && hasCounterpartyData)}
            className={isCreatorField || (isCounterpartyField && hasCounterpartyData) ? "bg-muted" : ""}
          />
        )
      
      case "textarea":
        const charCount = value?.length || 0
        const isPurposeField = field.id === "purpose"
        const minChars = isPurposeField ? 20 : 0
        const isValid = !isPurposeField || charCount >= minChars
        
        return (
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={isRequired}
              rows={3}
              className={!isValid && charCount > 0 ? "border-yellow-500" : ""}
            />
            {isPurposeField && (
              <div className="flex items-center justify-between text-xs">
                <span className={charCount < minChars ? "text-yellow-600" : "text-green-600"}>
                  {charCount >= minChars ? "✓ " : ""}{charCount} / {minChars} characters minimum
                </span>
                {charCount > 0 && charCount < minChars && (
                  <span className="text-yellow-600">{minChars - charCount} more needed</span>
                )}
              </div>
            )}
          </div>
        )
      
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            required={isRequired}
            disabled={isCreatorField || (isCounterpartyField && hasCounterpartyData)}
            className={isCreatorField || (isCounterpartyField && hasCounterpartyData) ? "bg-muted" : ""}
          />
        )
      
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onFieldChange(field.id, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={isRequired}
          />
        )
      
      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => onFieldChange(field.id, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              required={isRequired}
              className="pl-12"
            />
          </div>
        )
      
      case "select":
        return (
          <Select value={value} onValueChange={(val) => onFieldChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedValues.length === 0
                    ? "Select governing laws..."
                    : `${selectedValues.length} law${selectedValues.length > 1 ? 's' : ''} selected`
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search laws..." />
                  <CommandEmpty>No laws found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {field.options?.map((option) => (
                      <CommandItem
                        key={option}
                        onSelect={() => {
                          const newValues = selectedValues.includes(option)
                            ? selectedValues.filter(v => v !== option)
                            : [...selectedValues, option]
                          // Ensure at least one governing law is always selected
                          if (newValues.length === 0) return
                          onFieldChange(field.id, newValues)
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedValues.includes(option)}
                            onChange={() => {}}
                          />
                          <span>{option}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedValues.map((selectedValue) => (
                  <Badge
                    key={selectedValue}
                    variant="secondary"
                    className="text-xs"
                  >
                    {selectedValue}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => {
                        const newValues = selectedValues.filter(v => v !== selectedValue)
                        // Ensure at least one governing law is always selected
                        if (newValues.length === 0) return
                        onFieldChange(field.id, newValues)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => {
                onFieldChange(field.id, checked)
                // If permanent is checked, clear end date
                if (field.id === "isPermanent" && checked) {
                  onFieldChange("contractEndDate", "")
                }
              }}
            />
            <span className="text-sm">{field.label}</span>
          </div>
        )
      
      default:
        return null
    }
  }

  const firstCounterpartyFieldId = template.fields.find((field) => field.id.startsWith("partyB"))?.id

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="rounded-lg border p-4 bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{template.icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold">{values.purpose || template.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{values.terms || template.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {getCounterpartyIcon(template.counterpartyType)}
                {getCounterpartyLabel(template.counterpartyType)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Template Fields */}
      <div className="space-y-4">
        {template.fields.map((field) => {
          const isRequired = fieldRequirements[field.id] ?? field.required
          return (
            <div key={field.id} className="space-y-2">
              {field.id === firstCounterpartyFieldId && counterpartyControls}
              {field.type !== "checkbox" && !(field.id === "witnessNotes" && !isWitnessRequired) && !(field.id === "contractEndDate" && values.isPermanent) && (
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={field.id} className="flex items-center gap-1">
                    <span>{field.label}</span>
                    {isRequired && <span className="text-destructive">*</span>}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`What is ${field.label}?`}
                        >
                          <CircleHelp className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm">
                          {field.id === "witnessRequired"
                            ? "Tick if a witness must sign. Use only when you want an independent person to observe and attest."
                            : field.placeholder || `Please provide ${field.label.toLowerCase()}.`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  {TOGGLABLE_FIELD_IDS.has(field.id) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Mandatory</span>
                      <Switch
                        checked={isRequired}
                        onCheckedChange={(checked) => onRequirementChange(field.id, checked === true)}
                      />
                    </div>
                  )}
                </div>
              )}
              {field.id === "witnessNotes" && !isWitnessRequired ? null : 
               field.id === "contractEndDate" && values.isPermanent ? null : 
               renderField(field, isRequired)}
              {field.id === "governingLaw" && (
                <p className="text-xs text-muted-foreground mt-1">
                  ℹ️ We capture your IP address for e-signature verification and to help suggest the appropriate governing law based on your location. You can change this selection.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
