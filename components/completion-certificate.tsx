"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Award, Download, Share2, Linkedin, Twitter, Mail, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface CompletionCertificateProps {
  agreementId: string
  agreementType: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CompletionCertificate({
  agreementId,
  agreementType,
  open = false,
  onOpenChange,
}: CompletionCertificateProps) {
  const [copied, setCopied] = useState(false)
  const certificateUrl = `${window.location.origin}/api/certificates/${agreementId}`
  const shareUrl = `${window.location.origin}/certificates/${agreementId}`

  async function downloadCertificate() {
    try {
      const response = await fetch(`${certificateUrl}?format=svg`)
      const svg = await response.text()
      const blob = new Blob([svg], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bindme-certificate-${agreementId}.svg`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Certificate downloaded!")
    } catch (error) {
      toast.error("Failed to download certificate")
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  function shareOnLinkedIn() {
    const text = encodeURIComponent(
      `Just completed a ${agreementType} with BindMe - professional, secure, and done in minutes! 🚀`
    )
    const url = encodeURIComponent(shareUrl)
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank"
    )
  }

  function shareOnTwitter() {
    const text = encodeURIComponent(
      `Just completed a ${agreementType} with @BindMe - professional, secure, and done in minutes! 🚀`
    )
    const url = encodeURIComponent(shareUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
  }

  function shareViaEmail() {
    const subject = encodeURIComponent("Agreement Completed - BindMe")
    const body = encodeURIComponent(
      `I just completed a ${agreementType} using BindMe.\n\nView the certificate: ${shareUrl}\n\nBindMe makes creating professional agreements quick and easy!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">🎉 Agreement Completed!</DialogTitle>
          <DialogDescription className="text-center">
            Your {agreementType} has been successfully completed and secured.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Certificate</CardTitle>
              <CardDescription>
                Download or share your completion certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-800">
                <div className="text-center space-y-2">
                  <Award className="h-12 w-12 mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Certificate Preview
                  </p>
                  <Button onClick={downloadCertificate} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Your Success
              </CardTitle>
              <CardDescription>
                Let your network know about your achievement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Share Link */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button onClick={copyLink} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={shareOnLinkedIn} variant="outline" className="w-full">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button onClick={shareOnTwitter} variant="outline" className="w-full">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button onClick={shareViaEmail} variant="outline" className="w-full col-span-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium mb-2">Love BindMe?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Invite friends and get 1 month premium free for each referral!
            </p>
            <Button size="sm" variant="default">
              Get Your Referral Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

