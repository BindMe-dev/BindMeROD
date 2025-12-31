"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Mail, Download } from "lucide-react"

interface EmailConfirmationPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailContent: string
}

export function EmailConfirmationPreview({ open, onOpenChange, emailContent }: EmailConfirmationPreviewProps) {
  const handleDownload = () => {
    const blob = new Blob([emailContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bindme-agreement-confirmation-${new Date().getTime()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <DialogTitle>Email Confirmation</DialogTitle>
          </div>
          <DialogDescription>
            This confirmation would be sent to your email. You can download it for your records.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] w-full rounded-lg border">
          <div dangerouslySetInnerHTML={{ __html: emailContent }} />
        </ScrollArea>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="flex-1 gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Download HTML
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
