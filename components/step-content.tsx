import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ArrowLeft, ArrowRight, User, Users, UserX, X, UserPlus, HelpCircle } from 'lucide-react'
import type { AgreementTemplate } from '@/lib/templates'
import { TemplateForm } from '@/components/template-form'

interface StepContentProps {
  currentStep: number
  selectedTemplate: AgreementTemplate | null
  user: any
  templateValues: Record<string, any>
  fieldRequirements: Record<string, boolean>
  counterparties: any[]
  counterpartyName: string
  counterpartyEmail: string
  counterpartyDob: string
  counterpartyAddress: string
  onFieldChange: (fieldId: string, value: any) => void
  onRequirementChange: (fieldId: string, required: boolean) => void
  onCounterpartyNameChange: (value: string) => void
  onCounterpartyEmailChange: (value: string) => void
  onCounterpartyDobChange: (value: string) => void
  onCounterpartyAddressChange: (value: string) => void
  onAddCounterparty: () => void
  onRemoveCounterparty: (email: string) => void
  onUserSearchOpen: () => void
  onWitnessSearchOpen: () => void
  canProceed: boolean
  onNext: () => void
  onPrev: () => void
  onSaveAsDraft?: () => void
}

export function StepContent({
  currentStep,
  selectedTemplate,
  user,
  templateValues,
  fieldRequirements,
  counterparties,
  counterpartyName,
  counterpartyEmail,
  counterpartyDob,
  counterpartyAddress,
  onFieldChange,
  onRequirementChange,
  onCounterpartyNameChange,
  onCounterpartyEmailChange,
  onCounterpartyDobChange,
  onCounterpartyAddressChange,
  onAddCounterparty,
  onRemoveCounterparty,
  onUserSearchOpen,
  onWitnessSearchOpen,
  canProceed,
  onNext,
  onPrev,
  onSaveAsDraft,
}: StepContentProps) {
  if (!selectedTemplate) return null

  const dateInputClass =
    "bg-slate-950 border-slate-800 text-slate-100 h-9 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Creator Details
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h3 className="font-semibold mb-4 text-white">Your Information</h3>
              <div className="space-y-4 text-slate-200">
                <div>
                  <Label className="text-slate-300">Full Name</Label>
                  <Input value={user?.name || ''} disabled className="bg-slate-950 border-slate-800 text-slate-200" />
                </div>
                <div>
                  <Label className="text-slate-300">Date of Birth</Label>
                  <Input value={user?.dateOfBirth || ''} disabled className="bg-slate-950 border-slate-800 text-slate-200" />
                </div>
                <div>
                  <Label className="text-slate-300">Address</Label>
                  <Input value={user?.address || ''} disabled className="bg-slate-950 border-slate-800 text-slate-200" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                These details are from your verified profile and cannot be changed.
              </p>
            </div>
          </div>
        )

      case 2: // Counterparty
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">
                  {selectedTemplate.counterpartyType === 'single' ? 'Counterparty' : 'Counterparties'}
                </h3>
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  {selectedTemplate.counterpartyType === 'single' ? (
                    <><User className="w-3 h-3" /> Exactly 1 person</>
                  ) : (
                    <><Users className="w-3 h-3" /> At least 1 person</>
                  )}
                </Badge>
              </div>

              {counterparties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {counterparties.map((party) => (
                    <Badge key={party.email} variant="secondary" className="gap-1 pr-1">
                      {party.name} ({party.email})
                      <button
                        type="button"
                        onClick={() => onRemoveCounterparty(party.email)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-slate-300">Name *</Label>
                    <div className="relative">
                      <Input
                        className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                        placeholder="Full legal name"
                        value={counterpartyName}
                        onChange={(e) => onCounterpartyNameChange(e.target.value)}
                        disabled={counterparties.some(p => p.userId)}
                      />
                      {counterpartyName && counterpartyName.length >= 2 && (
                        <button
                          type="button"
                          onClick={onUserSearchOpen}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300"
                        >
                          Search users →
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Email *</Label>
                    <div className="space-y-1">
                      <Input
                        className={`mt-2 bg-slate-950 border-slate-800 text-slate-100 ${
                          counterpartyEmail && !counterpartyEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                            ? "border-yellow-500"
                            : counterpartyEmail
                            ? "border-green-500"
                            : ""
                        }`}
                        placeholder="Email address"
                        type="email"
                        value={counterpartyEmail}
                        onChange={(e) => onCounterpartyEmailChange(e.target.value)}
                        disabled={counterparties.some(p => p.userId)}
                      />
                      {counterpartyEmail && !counterpartyEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) && (
                        <p className="text-xs text-yellow-600">Please enter a valid email address</p>
                      )}
                      {counterpartyEmail && counterpartyEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) && (
                        <p className="text-xs text-green-600">✓ Valid email format</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-slate-300">Date of Birth</Label>
                    <Input
                      className={dateInputClass}
                      type="date"
                      value={counterpartyDob}
                      onChange={(e) => onCounterpartyDobChange(e.target.value)}
                      disabled={counterparties.some(p => p.userId)}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Address</Label>
                    <Input
                      className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                      placeholder="Full address"
                      value={counterpartyAddress}
                      onChange={(e) => onCounterpartyAddressChange(e.target.value)}
                      disabled={counterparties.some(p => p.userId)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onAddCounterparty}
                    disabled={selectedTemplate.counterpartyType === 'single' && counterparties.length >= 1}
                  >
                    Add Counterparty
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onUserSearchOpen}
                    disabled={selectedTemplate.counterpartyType === 'single' && counterparties.length >= 1}
                    className="bg-white text-black hover:bg-white hover:text-black"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Search Users
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Purpose and Terms
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h3 className="font-semibold mb-6 text-white">Agreement Foundation</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-slate-300">Purpose of Agreement *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Explain the main reason for this agreement. Example: "To establish a partnership for developing and marketing software products"
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                    placeholder="Why this agreement exists and what it covers (minimum 20 characters)"
                    value={templateValues.purpose || ''}
                    onChange={(e) => onFieldChange('purpose', e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {templateValues.purpose?.length || 0}/20 characters minimum
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-slate-300">Key Terms *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          List the main obligations, payment terms, or deliverables. Example: "Party A will deliver 10 units monthly. Party B pays $5000 upon delivery."
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                    placeholder="Obligations, deliverables, payment schedules, etc."
                    value={templateValues.terms || ''}
                    onChange={(e) => onFieldChange('terms', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4: // Other Details
        const otherFields = selectedTemplate.fields.filter(f => 
          !['purpose', 'terms', 'scopeOfWork', 'breachConsequences', 'witnessRequired', 'witnessNotes', 'partyAName', 'partyADob', 'partyAAddress', 'partyBName', 'partyBDob', 'partyBAddress', 'partyALicenceId', 'partyBLicenceId', 'agreementDate', 'contractStartDate', 'contractEndDate', 'isPermanent', 'governingLaw'].includes(f.id)
        )
        
        const governingLawField = selectedTemplate.fields.find(f => f.id === 'governingLaw')
        
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h3 className="font-semibold mb-4 text-white">Additional Details</h3>
              <div className="space-y-5">
                {/* Governing Law with IP detection */}
                {governingLawField && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>
                        {governingLawField.label}
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-slate-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            Select the jurisdiction whose laws will govern this agreement. Auto-detected based on your IP address, but you can change it.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <select
                        multiple
                        value={templateValues.governingLaw || []}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value)
                          if (values.length === 0) return // Ensure at least one is selected
                          onFieldChange('governingLaw', values)
                        }}
                        className="w-full p-2 border rounded-md min-h-[100px] bg-slate-950 border-slate-800 text-slate-100"
                      >
                        {governingLawField.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ We capture your IP address for e-signature verification and to help suggest the appropriate governing law based on your location. You can change this selection.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Other fields */}
                {otherFields.map((field) => {
                  const isRequired = fieldRequirements[field.id] ?? field.required
                  const value = templateValues[field.id] ?? field.defaultValue ?? ''
                  
                      return (
                        <div key={field.id}>
                          <Label className="text-slate-300">
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                          </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                          value={value}
                          onChange={(e) => onFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                        />
                      ) : field.type === 'date' ? (
                        <Input
                          className={dateInputClass}
                          type="date"
                          value={value}
                          onChange={(e) => onFieldChange(field.id, e.target.value)}
                        />
                      ) : (
                            <Input
                              className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                              value={value}
                              onChange={(e) => onFieldChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                            />
                          )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 5: // Licenses and Dates
        const licenseFields = selectedTemplate.fields.filter(f => 
          ['partyALicenceId', 'partyBLicenceId', 'agreementDate', 'contractStartDate', 'contractEndDate', 'isPermanent'].includes(f.id)
        )
        
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h3 className="font-semibold mb-4 text-white">Licenses & Important Dates</h3>
              <div className="space-y-4">
                {/* License IDs in same row */}
                <div className="grid gap-3 md:grid-cols-2 items-end">
                  {licenseFields.filter(f => f.id === 'partyALicenceId').map((field) => {
                    const value = templateValues[field.id] ?? field.defaultValue ?? ''
                    return (
                      <div key={field.id}>
                        <Label className="text-slate-300">{field.label}</Label>
                        <Input
                          className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                          value={value}
                          onChange={(e) => onFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      </div>
                    )
                  })}
                  {licenseFields.filter(f => f.id === 'partyBLicenceId').map((field) => {
                    const value = templateValues[field.id] ?? field.defaultValue ?? ''
                    return (
                      <div key={field.id}>
                        <Label className="text-slate-300">{field.label}</Label>
                        <Input
                          className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                          value={value}
                          onChange={(e) => onFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      </div>
                    )
                  })}
                </div>
                
                {/* Date fields */}
                {licenseFields.filter(f => ['agreementDate', 'contractStartDate', 'contractEndDate'].includes(f.id)).map((field) => {
                  const isRequired = fieldRequirements[field.id] ?? field.required
                  const value = templateValues[field.id] ?? field.defaultValue ?? ''
                  
                  if (field.id === 'contractEndDate' && templateValues.isPermanent) return null
                  
                    return (
                      <div key={field.id}>
                        <Label className="text-slate-300">
                          {field.label}
                          {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <div className="mt-2 flex gap-2 items-center">
                          <Input
                            className={dateInputClass}
                            type="date"
                            value={value}
                            onChange={(e) => onFieldChange(field.id, e.target.value)}
                          />
                          {/* Date helper buttons */}
                          {field.id === 'agreementDate' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0]
                                onFieldChange(field.id, today)
                              }}
                              className="shrink-0 h-8 px-3 py-1 bg-white text-black hover:bg-white hover:text-black"
                            >
                              Today
                            </Button>
                          )}
                          {field.id === 'contractStartDate' && (
                            <div className="flex gap-1 items-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const today = new Date().toISOString().split('T')[0]
                                  onFieldChange(field.id, today)
                                }}
                                className="shrink-0 h-8 px-3 py-1 bg-white text-black hover:bg-white hover:text-black"
                              >
                                Today
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const nextWeek = new Date()
                                  nextWeek.setDate(nextWeek.getDate() + 7)
                                  onFieldChange(field.id, nextWeek.toISOString().split('T')[0])
                                }}
                                className="shrink-0 h-8 px-3 py-1 bg-white text-black hover:bg-white hover:text-black"
                              >
                                +7d
                              </Button>
                            </div>
                          )}
                          {field.id === 'contractEndDate' && templateValues.contractStartDate && (
                            <div className="flex gap-1 items-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const startDate = new Date(templateValues.contractStartDate)
                                  startDate.setMonth(startDate.getMonth() + 6)
                                  onFieldChange(field.id, startDate.toISOString().split('T')[0])
                                }}
                                className="shrink-0 h-8 px-3 py-1 bg-white text-black hover:bg-white hover:text-black"
                              >
                                +6mo
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const startDate = new Date(templateValues.contractStartDate)
                                  startDate.setFullYear(startDate.getFullYear() + 1)
                                  onFieldChange(field.id, startDate.toISOString().split('T')[0])
                                }}
                                className="shrink-0 h-8 px-3 py-1 bg-white text-black hover:bg-white hover:text-black"
                              >
                                +1yr
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                })}
                
                {/* Permanent contract checkbox */}
                {licenseFields.filter(f => f.id === 'isPermanent').map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPermanent"
                      checked={templateValues.isPermanent || false}
                      onChange={(e) => {
                        onFieldChange('isPermanent', e.target.checked)
                        if (e.target.checked) {
                          onFieldChange('contractEndDate', '')
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="isPermanent">{field.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 6: // Scope and Breach Consequences
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h3 className="font-semibold mb-4 text-white">Scope & Consequences</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Scope / Subject Matter</Label>
                  <Textarea
                    className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                    placeholder="What is being promised or exchanged"
                    value={templateValues.scopeOfWork || ''}
                    onChange={(e) => onFieldChange('scopeOfWork', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Breach Consequences</Label>
                  <Textarea
                    className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                    placeholder="What happens if either party breaches the agreement"
                    value={templateValues.breachConsequences || ''}
                    onChange={(e) => onFieldChange('breachConsequences', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                These fields are optional but recommended for clarity.
              </p>
            </div>
          </div>
        )

      case 7: // Witness Requirements
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h3 className="font-semibold mb-4 text-white">Witness Requirements</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="witnessRequired"
                    checked={templateValues.witnessRequired || false}
                    onChange={(e) => onFieldChange('witnessRequired', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="witnessRequired" className="text-slate-300">Witness required</Label>
                </div>
                
                {templateValues.witnessRequired && (
                  <>
                    {/* Witness Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">Select Witness</h4>
                        <Badge variant="secondary" className="text-xs">
                          Cannot be a counterparty
                        </Badge>
                      </div>
                      
                      {templateValues.witnessEmail && (
                        <div className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{templateValues.witnessName}</p>
                            <p className="text-sm text-slate-400">{templateValues.witnessEmail}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onFieldChange('witnessName', '')
                              onFieldChange('witnessEmail', '')
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {!templateValues.witnessEmail && (
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label className="text-slate-300">Witness Name *</Label>
                        <Input
                          className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                          placeholder="Full name"
                          value={templateValues.witnessName || ''}
                          onChange={(e) => onFieldChange('witnessName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Witness Email *</Label>
                        <Input
                          className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                          placeholder="Email address"
                          type="email"
                          value={templateValues.witnessEmail || ''}
                          onChange={(e) => {
                            const email = e.target.value
                                  // Check if email matches any counterparty
                                  const isCounterparty = counterparties.some(cp => 
                                    cp.email.toLowerCase() === email.toLowerCase()
                                  )
                                  if (isCounterparty && email) {
                                    alert('Witness cannot be the same person as a counterparty')
                              return
                            }
                            onFieldChange('witnessEmail', email)
                          }}
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onWitnessSearchOpen}
                      className="w-full bg-white text-black hover:bg-white hover:text-black"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Search for Witness
                    </Button>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-slate-300">Witness Notes</Label>
                      <Textarea
                        className="mt-2 bg-slate-950 border-slate-800 text-slate-100"
                        placeholder="When they sign, conditions that trigger witness requirement, or other witness instructions"
                        value={templateValues.witnessNotes || ''}
                        onChange={(e) => onFieldChange('witnessNotes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-4">
                A witness provides independent verification of the agreement signing and cannot be a counterparty.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {renderStep()}
      
      {/* Navigation */}
      <div className="flex justify-between gap-2">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            className="bg-white text-black hover:bg-white hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        ) : (
          <div /> // spacer to keep layout aligned
        )}
        
        <div className="flex gap-2">
          {onSaveAsDraft && (
            <Button
              type="button"
              variant="outline"
              onClick={onSaveAsDraft}
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              Save as Draft
            </Button>
          )}
          
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
          >
            {currentStep === 7 ? 'Review & Sign' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
