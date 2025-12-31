"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Search } from "lucide-react"
import { usePartners } from "@/lib/partner-store"
import { useAgreements } from "@/lib/agreement-store"
import { UserSearchDialog } from "@/components/user-search-dialog"

interface AddPartnerDialogProps {
  agreementId: string
  existingPartnerIds: string[]
}

export function AddPartnerDialog({ agreementId, existingPartnerIds }: AddPartnerDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const { partners, addPartner } = usePartners()
  const { addPartnerToAgreement } = useAgreements()

  const availablePartners = partners.filter((p) => !existingPartnerIds.includes(p.id))

  const handleAddNew = async () => {
    if (!name.trim() || !email.trim()) return

    const newPartner = addPartner({ name: name.trim(), email: email.trim() })
    await addPartnerToAgreement(agreementId, newPartner)
    setName("")
    setEmail("")
    setOpen(false)
  }

  const handleAddExisting = async () => {
    if (!selectedPartnerId) return

    const partner = partners.find((p) => p.id === selectedPartnerId)
    if (partner) {
      await addPartnerToAgreement(agreementId, partner)
      setSelectedPartnerId(null)
      setOpen(false)
    }
  }

  return (
    <>
      <UserSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <UserPlus className="w-4 h-4" />
            Add Partner
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Accountability Partner</DialogTitle>
            <DialogDescription>
              Invite someone to help keep you accountable to this agreement. They can send you support messages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setOpen(false)
                setSearchDialogOpen(true)
              }}
              variant="default"
              className="w-full gap-2"
            >
              <Search className="w-4 h-4" />
              Search Users by @username
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or choose from existing</span>
              </div>
            </div>
          </div>

          {availablePartners.length > 0 && (
            <div className="space-y-3">
              <Label>Select Existing Partner</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {availablePartners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedPartnerId === partner.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{partner.name}</div>
                    <div className="text-sm text-muted-foreground">{partner.email}</div>
                  </button>
                ))}
              </div>
              {selectedPartnerId && (
                <Button onClick={handleAddExisting} className="w-full">
                  Add Selected Partner
                </Button>
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Name</Label>
              <Input
                id="partner-name"
                placeholder="Enter partner's name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-email">Email</Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="Enter partner's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNew} disabled={!name.trim() || !email.trim()}>
              Add New Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
