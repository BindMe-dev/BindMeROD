"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreateAgreementDialog } from "@/components/create-agreement-dialog"
import { type AgreementTemplate, AGREEMENT_TEMPLATES } from "@/lib/templates"

function CreateAgreementPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams?.get("template") ?? null
  const counterpartyId = searchParams?.get("counterpartyId") ?? null
  const counterpartyName = searchParams?.get("counterpartyName") ?? undefined
  const counterpartyEmail = searchParams?.get("counterpartyEmail") ?? undefined
  
  const [selectedTemplate, setSelectedTemplate] = useState<AgreementTemplate | null>(null)

  useEffect(() => {
    if (templateId) {
      const template = AGREEMENT_TEMPLATES.find(t => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
      } else {
        const qp = new URLSearchParams()
        if (counterpartyId) qp.set("counterpartyId", counterpartyId)
        if (counterpartyName) qp.set("counterpartyName", counterpartyName)
        if (counterpartyEmail) qp.set("counterpartyEmail", counterpartyEmail)
        router.push(`/templates?${qp.toString()}`)
      }
    } else {
      const qp = new URLSearchParams()
      if (counterpartyId) qp.set("counterpartyId", counterpartyId)
      if (counterpartyName) qp.set("counterpartyName", counterpartyName)
      if (counterpartyEmail) qp.set("counterpartyEmail", counterpartyEmail)
      router.push(`/templates?${qp.toString()}`)
    }
  }, [templateId, counterpartyId, counterpartyName, counterpartyEmail, router])

  const handleDialogClose = () => {
    router.push("/dashboard")
  }

  const handleTemplateCleared = () => {
    router.push("/templates")
  }

  if (!selectedTemplate) {
    return null
  }

  return (
    <CreateAgreementDialog
      open={true}
      onOpenChange={handleDialogClose}
      selectedTemplate={selectedTemplate}
      onTemplateCleared={handleTemplateCleared}
      prefillCounterparty={
        counterpartyEmail
          ? {
              email: counterpartyEmail,
              name: counterpartyName,
              userId: counterpartyId || undefined,
            }
          : undefined
      }
    />
  )
}

export default function CreateAgreementPage() {
  return (
    <Suspense fallback={null}>
      <CreateAgreementPageContent />
    </Suspense>
  )
}
