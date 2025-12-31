"use client"

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  required: boolean
}

interface SubmissionSnapshot {
  status?: string
  reviewNotes?: string | null
  rejectionReason?: string | null
  documentUrl?: string | null
  selfieUrl?: string | null
  updatedAt?: string | null
}

export function IdentityVerification() {
  const { user, refreshUser } = useAuth()
  const isIdentityVerified = !!(user?.verificationType || user?.verifiedName)
  const [isProcessing, setIsProcessing] = useState(false)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [userIP, setUserIP] = useState<string>('')
  const [submissionCreated, setSubmissionCreated] = useState(false)
  const [submission, setSubmission] = useState<SubmissionSnapshot | null>(null)
  const [loadingSubmission, setLoadingSubmission] = useState(false)

  const documentInputRef = useRef<HTMLInputElement>(null)

  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: 'document',
      title: 'Upload ID Document',
      description: 'Upload a clear photo of your passport, driving license, or national ID',
      status: 'pending',
      required: true
    },
    {
      id: 'verification',
      title: 'Manual Review',
      description: 'Our team will review your document and verify your identity',
      status: 'pending',
      required: true
    }
  ])

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })

  const syncStepsFromSubmission = (sub: SubmissionSnapshot | null) => {
    if (!sub || !sub.status) return
    const status = sub.status.toLowerCase()
    if (status === 'approved') {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: 'success',
        })),
      )
      setIsProcessing(false)
      setSubmissionCreated(true)
      refreshUser()
      return
    }
    if (status === 'rejected' || status === 'needs_info') {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 'verification') return { ...step, status: 'failed' }
          if (step.id === 'document') return { ...step, status: 'pending' } // Reset to allow re-upload
          return step
        }),
      )
      setIsProcessing(false)
      setSubmissionCreated(false) // allow re-submission
      setDocumentFile(null) // Clear previous document
      setVerificationResult({ success: false, rejectionReason: sub.rejectionReason || sub.reviewNotes })
      return
    }

    // pending / processing
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === 'verification') return { ...step, status: 'processing' }
        if (step.id === 'document') return { ...step, status: 'success' }
        return step
      }),
    )
    setIsProcessing(true)
    setSubmissionCreated(true)
  }

  // Get user IP on component mount
  useEffect(() => {
    fetch('/api/get-ip')
      .then(res => res.json())
      .then(data => setUserIP(data.ip))
      .catch(() => setUserIP('unknown'))
  }, [])

  // Load any existing submission ONCE when user is available
  const [hasLoadedSubmission, setHasLoadedSubmission] = useState(false)
  useEffect(() => {
    if (!user || hasLoadedSubmission) return
    let mounted = true
    const load = async () => {
      setLoadingSubmission(true)
      try {
        const res = await fetch('/api/admin/verifications?scope=me', { credentials: 'include' })
        if (!res.ok || !mounted) return
        const data = await res.json()
        if (data?.submission && mounted) {
          setSubmission(data.submission)
          syncStepsFromSubmission(data.submission)
        }
      } finally {
        if (mounted) {
          setLoadingSubmission(false)
          setHasLoadedSubmission(true)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [user, hasLoadedSubmission]) // Run once when user is available

  // REMOVED: Auto-polling - no longer needed
  // REMOVED: Submission sync effect - handled in initial load only

  // Set initial UI state based on verification status (only on mount)
  useEffect(() => {
    if (isIdentityVerified) {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: 'success',
        })),
      )
      setIsProcessing(false)
    }
  }, []) // Only run once on mount

  // Auto-submit when document is uploaded
  useEffect(() => {
    if (!documentFile || isIdentityVerified || submissionCreated) return
    let cancelled = false
    setIsProcessing(true)
    updateStepStatus('verification', 'processing')

    const createSubmission = async () => {
      try {
        const docData = await fileToDataUrl(documentFile)
        const res = await fetch('/api/admin/verifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            intent: 'submit',
            documentData: docData,
            selfieData: null, // No selfie required
            extractedName: user?.name || '',
            extractedDob: null,
            extractedDocNumber: null,
            verificationType: 'manual_review',
          }),
        })
        if (!cancelled && res.ok) {
          const data = await res.json().catch(() => ({}))
          setSubmissionCreated(true)
          setSubmission((prev) => ({ ...(prev || {}), status: 'processing', ...(data || {}) }))
        }
      } catch (e) {
        console.warn('Failed to register verification submission', e)
      }
    }

    createSubmission()
    return () => {
      cancelled = true
    }
  }, [documentFile, isIdentityVerified, submissionCreated, user])

  // REMOVED: Camera/selfie functionality - no longer needed

  const updateStepStatus = (stepId: string, status: VerificationStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocumentFile(file)
      updateStepStatus('document', 'success')
      // No extraction - manual review only
    }
  }

  const getStepIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'processing':
        return <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepBadge = (step: VerificationStep) => {
    const colors = {
      pending: 'bg-slate-800 text-slate-200 border border-slate-700',
      processing: 'bg-blue-900/60 text-blue-200 border border-blue-700/60',
      success: 'bg-green-900/60 text-green-200 border border-green-700/60',
      failed: 'bg-red-900/60 text-red-200 border border-red-700/60',
    }
    return (
      <Badge className={cn('capitalize', colors[step.status])}>
        {step.status}
      </Badge>
    )
  }

  // No manual verification button needed - auto-submits on upload

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-white">
      <Card className="bg-slate-900/80 border border-slate-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-6 h-6 text-blue-400" />
            Identity Verification
          </CardTitle>
          <p className="text-sm text-slate-300">
            Verify your identity to increase trust and enable legally binding agreements
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingSubmission && (
            <div className="flex items-center gap-2 text-sm text-blue-200 bg-blue-900/40 border border-blue-800 rounded-lg px-3 py-2">
              <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
              Checking your latest verification status...
            </div>
          )}
          {!loadingSubmission && submission?.status && !isIdentityVerified && (
            <div
              className={cn(
                "rounded-lg px-4 py-3 text-sm border",
                submission.status === 'rejected'
                  ? "bg-red-900/40 text-red-100 border-red-800"
                  : submission.status === 'needs_info'
                    ? "bg-amber-900/40 text-amber-100 border-amber-800"
                    : "bg-emerald-900/40 text-emerald-100 border-emerald-800"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {submission.status === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : submission.status === 'needs_info' ? (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium">
                    {submission.status === 'rejected'
                      ? 'Verification Rejected'
                      : submission.status === 'needs_info'
                        ? 'Additional Information Required'
                        : 'Verification In Progress'}
                  </p>
                  {(submission.rejectionReason || submission.reviewNotes) && (
                    <p className="text-sm opacity-90">
                      <span className="font-medium">Reason: </span>
                      {submission.rejectionReason || submission.reviewNotes}
                    </p>
                  )}
                  {submission.status === 'rejected' && (
                    <p className="text-sm opacity-75">
                      Please upload a new document below to try again.
                    </p>
                  )}
                  {submission.status === 'needs_info' && (
                    <p className="text-sm opacity-75">
                      Please upload a clearer document that addresses the issue above.
                    </p>
                  )}
                  {submission.status !== 'rejected' && submission.status !== 'needs_info' && (
                    <p className="text-sm opacity-75">
                      We'll email you when verification is complete.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Verification Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4 p-4 border border-slate-800 rounded-lg bg-slate-900/70">
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">{step.title}</h3>
                  {getStepBadge(step)}
                </div>
                  <p className="text-sm text-slate-300 mb-3">
                    {step.description}
                  </p>
                  
                  {/* Document Upload */}
                  {step.id === 'document' && (
                    <div className="space-y-3">
                      {/* Accepted Documents Info */}
                      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-xs space-y-2">
                        <p className="font-medium text-slate-200">Accepted Documents:</p>
                        <ul className="space-y-1 text-slate-300 ml-4 list-disc">
                          <li>Passport</li>
                          <li>National ID Card</li>
                          <li>Driving License</li>
                          <li>Utility Bills (Energy bills dating less than 3 months for address verification)</li>
                        </ul>
                        <p className="text-slate-400 italic mt-2">
                          Please ensure the document is clear, readable, and all corners are visible.
                        </p>
                      </div>

                      <input
                        ref={documentInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        disabled={isProcessing}
                      />
                      <Button
                        variant="outline"
                        onClick={() => documentInputRef.current?.click()}
                        className="gap-2 border-slate-700 text-slate-900 bg-white hover:bg-slate-100"
                        disabled={step.status === 'success' || isProcessing}
                      >
                        <Upload className="w-4 h-4" />
                        {documentFile ? 'Document Uploaded' : (submission?.status === 'rejected' || submission?.status === 'needs_info') ? 'Upload New Document' : 'Upload ID Document'}
                      </Button>
                      {documentFile && (
                        <div className="space-y-2">
                          <p className="text-xs text-green-400">
                            ✓ {documentFile.name} uploaded successfully
                          </p>
                          <div className="p-3 bg-blue-900/40 border border-blue-700 rounded text-xs space-y-1">
                            <p className="font-medium text-blue-200">Document submitted for manual review</p>
                            <p className="text-slate-300">Our team will verify your identity and notify you via email.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification Status */}
                  {step.id === 'verification' && isProcessing && (
                    <div className="mt-3 p-3 bg-blue-900/40 border border-blue-700 rounded">
                      <div className="flex items-center gap-2 text-blue-200">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Your document is being reviewed by our team...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No manual verification button - auto-submits on upload */}

          {/* Current Verification Status */}
          {(isProcessing && !isIdentityVerified) && (
            <div className="mt-6 p-4 bg-blue-900/40 border border-blue-700 rounded-lg">
              <div className="flex items-center gap-2 text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Verification in progress</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                We received your document. Our team is reviewing it and will email you once done.
              </p>
            </div>
          )}

          {isIdentityVerified && (
            <div className="mt-6 p-4 bg-green-900/40 border border-green-700 rounded-lg">
              <div className="flex items-center gap-2 text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Identity Verified</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Your identity has been successfully verified. You can now create legally binding agreements.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
