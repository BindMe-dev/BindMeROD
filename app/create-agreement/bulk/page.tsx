"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Users, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface BulkRecipient {
  name: string
  email: string
  status: 'pending' | 'success' | 'error'
  agreementId?: string
  error?: string
}

export default function BulkAgreementCreation() {
  const router = useRouter()
  const [agreementTitle, setAgreementTitle] = useState("")
  const [agreementDescription, setAgreementDescription] = useState("")
  const [agreementTerms, setAgreementTerms] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [recipients, setRecipients] = useState<BulkRecipient[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)

    // Parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    // Skip header row
    const dataLines = lines.slice(1)
    
    const parsed: BulkRecipient[] = dataLines.map(line => {
      const [name, email] = line.split(',').map(s => s.trim())
      return {
        name,
        email,
        status: 'pending'
      }
    }).filter(r => r.name && r.email)

    setRecipients(parsed)
  }

  const handleBulkCreate = async () => {
    if (!agreementTitle || recipients.length === 0) {
      alert('Please provide agreement details and upload a CSV file')
      return
    }

    setProcessing(true)
    setProgress(0)

    try {
      const response = await fetch('/api/agreements/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementData: {
            title: agreementTitle,
            description: agreementDescription,
            keyTerms: agreementTerms,
          },
          recipients: recipients.map(r => ({ name: r.name, email: r.email })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update recipients with results
        const updatedRecipients = recipients.map((r, i) => ({
          ...r,
          status: data.results[i]?.success ? 'success' : 'error',
          agreementId: data.results[i]?.agreementId,
          error: data.results[i]?.error,
        })) as BulkRecipient[]

        setRecipients(updatedRecipients)
        setProgress(100)
      } else {
        alert('Failed to create agreements')
      }
    } catch (error) {
      console.error('Bulk creation error:', error)
      alert('An error occurred during bulk creation')
    } finally {
      setProcessing(false)
    }
  }

  const successCount = recipients.filter(r => r.status === 'success').length
  const errorCount = recipients.filter(r => r.status === 'error').length
  const pendingCount = recipients.filter(r => r.status === 'pending').length

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Agreement Creation</h1>
        <p className="text-muted-foreground">
          Create the same agreement for multiple recipients at once
        </p>
      </div>

      <div className="grid gap-6">
        {/* Agreement Details */}
        <Card>
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
            <CardDescription>
              These details will be used for all agreements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Agreement Title *</Label>
              <Input
                id="title"
                value={agreementTitle}
                onChange={(e) => setAgreementTitle(e.target.value)}
                placeholder="e.g., Service Agreement"
                disabled={processing}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={agreementDescription}
                onChange={(e) => setAgreementDescription(e.target.value)}
                placeholder="Brief description of the agreement"
                disabled={processing}
              />
            </div>

            <div>
              <Label htmlFor="terms">Key Terms</Label>
              <Textarea
                id="terms"
                value={agreementTerms}
                onChange={(e) => setAgreementTerms(e.target.value)}
                placeholder="Main terms and conditions"
                rows={6}
                disabled={processing}
              />
            </div>
          </CardContent>
        </Card>

        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
            <CardDescription>
              Upload a CSV file with columns: name, email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={processing}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" asChild>
                  <a href="/sample-bulk-agreements.csv" download>
                    Download Sample
                  </a>
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold">
                      {recipients.length} Recipients
                    </p>
                    <div className="flex gap-2">
                      {successCount > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          {successCount} Success
                        </Badge>
                      )}
                      {errorCount > 0 && (
                        <Badge variant="destructive">
                          {errorCount} Failed
                        </Badge>
                      )}
                      {pendingCount > 0 && (
                        <Badge variant="secondary">
                          {pendingCount} Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recipients.map((recipient, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <p className="font-medium">{recipient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {recipient.email}
                          </p>
                          {recipient.error && (
                            <p className="text-sm text-destructive">
                              {recipient.error}
                            </p>
                          )}
                        </div>
                        <div>
                          {recipient.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {recipient.status === 'error' && (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          {recipient.status === 'pending' && processing && (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {processing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating agreements...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleBulkCreate}
            disabled={processing || !agreementTitle || recipients.length === 0}
            className="flex-1"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create {recipients.length} Agreements
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
