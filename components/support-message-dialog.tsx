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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageCircle } from "lucide-react"
import { useAgreements } from "@/lib/agreement-store"
import type { Partner } from "@/lib/agreement-types"

interface SupportMessageDialogProps {
  agreementId: string
  partner: Partner
}

export function SupportMessageDialog({ agreementId, partner }: SupportMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const { addMessageToAgreement } = useAgreements()

  const handleSend = async () => {
    if (!message.trim()) return

    await addMessageToAgreement(agreementId, {
      id: crypto.randomUUID(),
      partnerId: partner.id,
      partnerName: partner.name,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })

    setMessage("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Send Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Support Message</DialogTitle>
          <DialogDescription>Send an encouraging message as {partner.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Write an encouraging message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            This message will appear as support from {partner.name} on this agreement.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!message.trim()}>
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
