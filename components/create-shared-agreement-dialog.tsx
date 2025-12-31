"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import { UserSearchDialog } from "@/components/user-search-dialog"
import type { AgreementType, RecurrenceFrequency, AgreementCategory, SharedParticipant } from "@/lib/agreement-types"
import { CategorySelector } from "@/components/category-selector"
import { TagInput } from "@/components/tag-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, X, UserPlus } from "lucide-react"
import { AgreementDraftPreview } from "@/components/agreement-draft-preview"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]
type ButtonSize = React.ComponentProps<typeof Button>["size"]

interface CreateSharedAgreementDialogProps {
  triggerVariant?: ButtonVariant
  triggerClassName?: string
  triggerSize?: ButtonSize
}

export function CreateSharedAgreementDialog({
  triggerVariant = "outline",
  triggerClassName = "bg-transparent",
  triggerSize = "lg",
}: CreateSharedAgreementDialogProps) {
  const [open, setOpen] = useState(false)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<AgreementType>("one-time")
  const [targetDate, setTargetDate] = useState("")
  const [deadline, setDeadline] = useState("")
  const [startDate, setStartDate] = useState("")
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [isPermanent, setIsPermanent] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("daily")
  const [category, setCategory] = useState<AgreementCategory>("uncategorized")
  const [tags, setTags] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; name: string; email: string }[]>(
    [],
  )

  const { user } = useAuth()
  const { addAgreement, addAuditLog } = useAgreements()

  const handleUserSelect = (selectedUser: { id: string; name: string; email: string }) => {
    if (!selectedUsers.find((u) => u.id === selectedUser.id)) {
      setSelectedUsers([...selectedUsers, selectedUser])
    }
    setUserSearchOpen(false)
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (selectedUsers.length === 0) {
      alert("Please select at least one user to share this agreement with.")
      return
    }

    if (!effectiveDate) {
      alert("Please select the effective date.")
      return
    }

    if (!isPermanent && !endDate) {
      alert("Please select an end date or mark as permanent.")
      return
    }

    // Date validation - target/deadline dates cannot be before start/effective date
    if (targetDate && new Date(targetDate) < new Date(effectiveDate)) {
      alert("Target date cannot be before the effective date.")
      return
    }

    if (deadline && new Date(deadline) < new Date(effectiveDate)) {
      alert("Deadline cannot be before the effective date.")
      return
    }

    if (startDate && new Date(startDate) < new Date(effectiveDate)) {
      alert("Start date cannot be before the effective date.")
      return
    }

    if (!isPermanent && endDate && new Date(endDate) <= new Date(effectiveDate)) {
      alert("End date must be after the effective date.")
      return
    }

    const sharedWith: SharedParticipant[] = selectedUsers.map((u) => ({
      role: "counterparty",
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      joinedAt: new Date().toISOString(),
      completions: type === "recurring" ? [] : undefined,
    }))

    const baseAgreement = {
      userId: user.id,
      title,
      description,
      type,
      effectiveDate,
      endDate: isPermanent ? undefined : endDate,
      isPermanent,
      category,
      tags,
      isShared: true,
      sharedWith,
    }

    let agreementId: string

    if (type === "one-time") {
      agreementId = await addAgreement({
        ...baseAgreement,
        targetDate: targetDate || undefined,
      })
    } else if (type === "recurring") {
      agreementId = await addAgreement({
        ...baseAgreement,
        recurrenceFrequency,
        startDate: startDate || new Date().toISOString().split("T")[0],
        completions: [],
      })
    } else if (type === "deadline") {
      agreementId = await addAgreement({
        ...baseAgreement,
        deadline,
      })
    } else {
      return
    }

    try {
      await addAuditLog(
        agreementId,
        "Shared Agreement Created",
        `Shared agreement "${title}" created with ${selectedUsers.map((u) => u.name).join(", ")}`,
      )
    } catch (err) {
      console.warn("Audit log failed", err)
    }

    // Reset form
    setTitle("")
    setDescription("")
    setType("one-time")
    setTargetDate("")
    setDeadline("")
    setStartDate("")
    setRecurrenceFrequency("daily")
    setCategory("uncategorized")
    setTags([])
    setSelectedUsers([])
    setOpen(false)
  }

  return (
    <>
      <UserSearchDialog
        open={userSearchOpen}
        onOpenChange={setUserSearchOpen}
        onUserSelect={(user) =>
          handleUserSelect({
            id: user.id,
            name: user.name,
            email: user.email,
          })
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={triggerVariant} size={triggerSize} className={`gap-2 ${triggerClassName}`}>
            <Users className="w-5 h-5" />
            Create Shared Agreement
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create Shared Agreement
            </DialogTitle>
            <DialogDescription>
              Create a joint commitment that both you and your selected users will track together.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Share with</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map((u) => (
                  <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
                    {u.name} (@{u.username})
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(u.id)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserSearchOpen(true)}
                className="w-full gap-2 bg-transparent"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-title">Title</Label>
              <Input
                id="shared-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Morning run together"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-description">Description</Label>
              <Textarea
                id="shared-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about your shared commitment..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-type">Agreement Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as AgreementType)}>
                <SelectTrigger id="shared-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-Time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="deadline">Deadline-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shared-effectiveDate">Effective Date</Label>
                <Input
                  id="shared-effectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shared-endDate">End Date</Label>
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      id="shared-permanent"
                      checked={isPermanent}
                      onCheckedChange={(checked) => {
                        const permanent = checked === true
                        setIsPermanent(permanent)
                        if (permanent) setEndDate("")
                      }}
                    />
                    <label htmlFor="shared-permanent" className="cursor-pointer">
                      Permanent
                    </label>
                  </div>
                </div>
                <Input
                  id="shared-endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isPermanent}
                  required={!isPermanent}
                />
              </div>
            </div>

            {type === "one-time" && (
              <div className="space-y-2">
                <Label htmlFor="shared-targetDate">Target Date (Optional)</Label>
                <Input
                  id="shared-targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            )}

            {type === "recurring" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shared-frequency">Frequency</Label>
                  <Select
                    value={recurrenceFrequency}
                    onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                  >
                    <SelectTrigger id="shared-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shared-startDate">Start Date</Label>
                  <Input
                    id="shared-startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {type === "deadline" && (
              <div className="space-y-2">
                <Label htmlFor="shared-deadline">Deadline</Label>
                <Input
                  id="shared-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            )}

            <CategorySelector value={category} onChange={setCategory} />

            <TagInput tags={tags} onChange={setTags} />

            <AgreementDraftPreview
              title={title}
              description={description}
              type={type}
              recurrenceFrequency={recurrenceFrequency}
              targetDate={targetDate || undefined}
              startDate={startDate || undefined}
              deadline={deadline || undefined}
              effectiveDate={effectiveDate || undefined}
              endDate={isPermanent ? undefined : endDate || undefined}
              isPermanent={isPermanent}
              category={category}
              tags={tags}
              signerName={user?.name}
              signerEmail={user?.email}
              isShared
              counterparties={selectedUsers.map((u) => ({
                name: u.name,
                email: u.email,
                addedBy: "creator",
              }))}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={selectedUsers.length === 0}>
                Create Shared Agreement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
