"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, CreditCard, Shield } from "lucide-react"

interface IdentityVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerificationComplete: () => void
}

export function IdentityVerificationDialog({ 
  open, 
  onOpenChange, 
  onVerificationComplete 
}: IdentityVerificationDialogProps) {
  const [step, setStep] = useState(1)
  const [documentType, setDocumentType] = useState("")
  const [documentReference, setDocumentReference] = useState("")
  const [verifiedName, setVerifiedName] = useState("")
  const [verifiedAddress, setVerifiedAddress] = useState("")
  const [verifiedDob, setVerifiedDob] = useState("")
  const [documentImage, setDocumentImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setDocumentImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!documentType || !documentReference || !verifiedName || !documentImage) {
      alert("Please fill in all required fields and upload your document")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentType,
          documentReference,
          verifiedName,
          verifiedAddress,
          verifiedDob,
          documentImage,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Verification failed")
      }

      const data = await response.json()
      
      if (!data.nameMatch) {
        alert("Warning: The name on your document doesn't exactly match your signup name. This will be reviewed manually.")
      }

      onVerificationComplete()
      onOpenChange(false)
      
    } catch (error) {
      console.error("Verification error:", error)
      alert(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const documentTypes = [
    { value: "passport", label: "UK Passport", icon: <FileText className="w-4 h-4" /> },
    { value: "driving_licence", label: "UK Driving Licence", icon: <CreditCard className="w-4 h-4" /> },
    { value: "ni_letter", label: "HMRC National Insurance Letter", icon: <Shield className="w-4 h-4" /> },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Identity Verification Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              To create legal agreements, we need to verify your identity using government-issued ID. 
              This is a one-time process and helps ensure all users are properly identified.
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">Select Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentUpload">Upload Document Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="documentUpload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="documentUpload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload a clear photo of your document
                    </p>
                  </label>
                  {documentImage && (
                    <p className="text-sm text-green-600 mt-2">Document uploaded ✓</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                disabled={!documentType || !documentImage}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please enter the details exactly as they appear on your {documentTypes.find(t => t.value === documentType)?.label}:
              </p>

              <div>
                <Label htmlFor="verifiedName">Full Name (as on document)</Label>
                <Input
                  id="verifiedName"
                  value={verifiedName}
                  onChange={(e) => setVerifiedName(e.target.value)}
                  placeholder="Enter your full legal name"
                />
              </div>

              <div>
                <Label htmlFor="documentReference">Document Number</Label>
                <Input
                  id="documentReference"
                  value={documentReference}
                  onChange={(e) => setDocumentReference(e.target.value)}
                  placeholder={
                    documentType === "passport" ? "Passport number" :
                    documentType === "driving_licence" ? "Driving licence number" :
                    "National Insurance number"
                  }
                />
              </div>

              <div>
                <Label htmlFor="verifiedDob">Date of Birth</Label>
                <Input
                  id="verifiedDob"
                  type="date"
                  value={verifiedDob}
                  onChange={(e) => setVerifiedDob(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="verifiedAddress">Address (optional)</Label>
                <Textarea
                  id="verifiedAddress"
                  value={verifiedAddress}
                  onChange={(e) => setVerifiedAddress(e.target.value)}
                  placeholder="Your current address"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !verifiedName || !documentReference}
                  className="flex-1"
                >
                  {isSubmitting ? "Verifying..." : "Complete Verification"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}