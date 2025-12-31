"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Handshake } from "lucide-react"

interface FriendlyArrangementDialogProps {
  onPropose: (terms: string) => Promise<void>
}

export function FriendlyArrangementDialog({ onPropose }: FriendlyArrangementDialogProps) {
  const [open, setOpen] = useState(false)
  const [terms, setTerms] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!terms.trim()) return
    
    setIsSubmitting(true)
    try {
      await onPropose(terms)
      setOpen(false)
      setTerms("")
    } catch (error) {
      console.error("Friendly arrangement failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-green-500 text-green-700 hover:bg-green-50">
          <Handshake className="w-4 h-4" />
          Propose friendly arrangement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-green-600" />
            Propose Friendly Arrangement
          </DialogTitle>
          <DialogDescription>
            Suggest a mutually acceptable solution to resolve this dispute without legal intervention.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms">Proposed arrangement terms *</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Describe your proposed solution, compromise, or alternative arrangement..."
              rows={5}
            />
          </div>
          
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            <p className="font-medium mb-1">Friendly Arrangement Process:</p>
            <ul className="text-xs space-y-1">
              <li>• Your proposal will be sent to the other party</li>
              <li>• They can accept, counter-propose, or decline</li>
              <li>• If accepted, the agreement will be updated accordingly</li>
              <li>• This avoids costly legal proceedings</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={!terms.trim() || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Proposing..." : "Propose arrangement"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}