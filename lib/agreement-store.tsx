"use client"

import { createContext, useCallback, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import type { Agreement, Partner, SupportMessage } from "./agreement-types"
import { calculateStreak } from "./achievements"
import { useAchievements } from "./achievement-store"
import { useAuth } from "./auth-context"
import { getRealtimeClient } from "./realtime-client"

function generateEmailConfirmation(agreement: Agreement, userEmail: string): string {
  const legal = agreement.legal
  if (!legal) return ""

  const creatorName = legal.signatures?.[0]?.signedByName || "Creator"
  const creatorEmail = legal.signatures?.[0]?.signedByEmail || userEmail
  const termsVersion = legal.termsAcceptedVersion || "1.0.0"
  const counterparties =
    agreement.sharedWith?.filter((p) => (p.role ?? "counterparty") === "counterparty") ?? []
  const witnesses = agreement.sharedWith?.filter((p) => (p.role ?? "counterparty") === "witness") ?? []

  const counterpartyList =
    counterparties.length > 0
      ? counterparties
          .map((p) => `<li>${p.userName} (${p.userEmail}) confirms capacity and agrees to be bound.</li>`)
          .join("")
      : "<li>No counterparties listed.</li>"

  const witnessList =
    witnesses.length > 0
      ? witnesses
          .map(
            (w) =>
              `<li>${w.userName} (${w.userEmail}) designated by the creator to witness execution and attest to authenticity.</li>`,
          )
          .join("")
      : "<li>No witnesses designated.</li>"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>BindMe Agreement Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #3b82f6; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; }
        .section h3 { margin-top: 0; color: #1f2937; }
        .signature-box { border: 2px dashed #d1d5db; padding: 20px; text-align: center; margin: 20px 0; }
        .signature { font-size: 32px; font-family: 'Brush Script MT', cursive; font-style: italic; color: #1f2937; }
        .metadata { font-size: 12px; color: #6b7280; margin-top: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        td:first-child { font-weight: bold; width: 40%; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BindMe Agreement Confirmation</h1>
          <p>Legal Agreement Record - Confirmation ID: ${agreement.id}</p>
        </div>

        <div class="section">
          <h3>Agreement Details</h3>
          <table>
            <tr><td>Title:</td><td>${agreement.title}</td></tr>
            <tr><td>Description:</td><td>${agreement.description || "N/A"}</td></tr>
            <tr><td>Type:</td><td>${agreement.type}</td></tr>
            <tr><td>Created:</td><td>${new Date(agreement.createdAt).toLocaleString("en-GB")}</td></tr>
            ${agreement.deadline ? `<tr><td>Deadline:</td><td>${new Date(agreement.deadline).toLocaleDateString("en-GB")}</td></tr>` : ""}
          </table>
        </div>

        ${
          legal.signatures?.[0]
            ? `
        <div class="section">
          <h3>Digital Signature</h3>
          <div class="signature-box">
            <div class="signature">${legal.signatures[0].signatureData.startsWith("data:") ? "[Drawn Signature]" : legal.signatures[0].signatureData}</div>
            <div class="metadata">
              <p><strong>Signed by:</strong> ${legal.signatures[0].signedByName} (${legal.signatures[0].signedByEmail})</p>
              <p><strong>Signed at:</strong> ${new Date(legal.signatures[0].timestamp).toLocaleString("en-GB")}</p>
              <p><strong>IP Address:</strong> ${legal.signatures[0].ipAddress || "N/A"}</p>
              ${
                legal.signatures[0].location
                  ? `<p><strong>Location:</strong> ${legal.signatures[0].location}</p>`
                  : ""
              }
            </div>
          </div>
        </div>
        `
            : ""
        }

        <div class="section">
          <h3>Electronic Signatures Compliance</h3>
          <p>This agreement complies with the Electronic Signatures Regulations 2002 (UK). Your electronic signature is legally valid and binding under UK law.</p>
          <p><strong>Evidence recorded:</strong></p>
          <ul>
            <li>Digital signature with timestamp</li>
            <li>IP address: ${legal.signatures?.[0]?.ipAddress || "N/A"}</li>
            <li>Device information: ${legal.signatures?.[0]?.userAgent || "N/A"}</li>
            <li>Complete audit trail of actions</li>
          </ul>
        </div>

        <div class="section">
          <h3>Standard Legal Section</h3>
          <p><strong>Binding Parties</strong></p>
          <ul>
            <li><strong>Creator:</strong> ${creatorName} (${creatorEmail}) confirms full legal capacity to contract.</li>
            ${counterpartyList}
          </ul>
          <p><strong>Designated Witnesses</strong></p>
          <ul>
            ${witnessList}
          </ul>
          <p><strong>Intent to Create Legal Relations:</strong> All parties expressly intend this agreement to be legally binding and enforceable.</p>
          <p><strong>Electronic Signature & Evidence:</strong> Parties agree electronic signatures have the same force as handwritten signatures under the Electronic Communications Act 2000 and the Electronic Signatures Regulations 2002. Evidence captured: signature data, timestamp, IP address, device/user agent, and location at signing.</p>
          <p><strong>Jurisdiction & Governing Law:</strong> This agreement is governed by the laws of England &amp; Wales. Courts of England &amp; Wales have exclusive jurisdiction.</p>
          <p><strong>Acceptance of Terms:</strong> The Creator accepts BindMe Terms of Service (v${termsVersion}) and incorporates them by reference. All parties accept the above terms and understand their obligations.</p>
        </div>

        <div class="footer">
          <p><strong>Important:</strong> This is a legally binding confirmation. Please save this email for your records.</p>
          <p>If you have any questions or concerns about this agreement, please contact support or consult with a legal professional.</p>
          <p>&copy; ${new Date().getFullYear()} BindMe - Accountability Platform</p>
        </div>
      </div>
    </body>
    </html>
  `
}

interface AgreementContextType {
  agreements: Agreement[]
  isLoading: boolean
  refresh: () => Promise<void>
  refreshAgreements: () => Promise<void>
  addAgreement: (agreement: Omit<Agreement, "id" | "createdAt" | "status">) => Promise<string>
  updateAgreement: (id: string, updates: Partial<Agreement>) => Promise<void>
  deleteAgreement: (id: string) => Promise<void>
  completeAgreement: (id: string) => Promise<void>
  getAgreementById: (id: string) => Agreement | undefined
  addPartnerToAgreement: (agreementId: string, partner: Partner) => Promise<void>
  removePartnerFromAgreement: (agreementId: string, partnerId: string) => Promise<void>
  addMessageToAgreement: (agreementId: string, message: SupportMessage) => Promise<void>
  addAuditLog: (agreementId: string, action: string, details: string) => Promise<void>
  getEmailConfirmation: (agreementId: string, userEmail: string) => string
  addWitnessSignature: (
    agreementId: string,
    signatureData: string,
    stamp?: { ipAddress?: string; location?: string },
  ) => Promise<void>
  signAsCounterparty: (
    agreementId: string,
    signatureData: string,
    stamp?: { ipAddress?: string; location?: string },
  ) => Promise<void>
  performWorkflowAction: (
    agreementId: string,
    action: string,
    payload?: {
      reason?: string
      evidence?: any
      terms?: string
      subAction?: "ACCEPT" | "REJECT_DEADLOCK" | "COUNTER"
    },
  ) => Promise<void>
}

const AgreementContext = createContext<AgreementContextType | undefined>(undefined)

export function AgreementProvider({ children }: { children: ReactNode }) {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, isLoading: isAuthLoading } = useAuth()
  const achievementContext = useAchievements()
  const lastFocusRefreshRef = useRef(0)

  const refresh = useCallback(async () => {
    if (isAuthLoading) return

    if (!user) {
      setIsLoading(false)
      setAgreements([])
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/agreements", { credentials: "include" })
      if (res.status === 401) {
        setAgreements([])
        return
      }
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "")
        throw new Error(`Failed to load agreements${errorBody ? `: ${errorBody}` : ""}`)
      }
      const data = await res.json()
      setAgreements(data.agreements || [])
    } catch (error) {
      console.error("Failed to fetch agreements", error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthLoading, user])

  useEffect(() => {
    if (isAuthLoading) return
    refresh()
  }, [isAuthLoading, refresh])

  useEffect(() => {
    if (isAuthLoading || !user) return
    const client = getRealtimeClient()
    if (!client) return
    const channel = client.subscribe("agreements")
    const handler = () => {
      refresh()
    }
    channel.bind("refresh", handler)
    return () => {
      channel.unbind("refresh", handler)
      client.unsubscribe("agreements")
    }
  }, [isAuthLoading, refresh, user])

  // Fallback: refresh on focus/visibility for environments without realtime
  useEffect(() => {
    if (isAuthLoading || !user) return
    const maybeRefresh = () => {
      const now = Date.now()
      if (now - lastFocusRefreshRef.current < 1000) return // throttle
      lastFocusRefreshRef.current = now
      refresh()
    }
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") maybeRefresh()
    }
    window.addEventListener("focus", maybeRefresh)
    document.addEventListener("visibilitychange", visibilityHandler)
    return () => {
      window.removeEventListener("focus", maybeRefresh)
      document.removeEventListener("visibilitychange", visibilityHandler)
    }
  }, [isAuthLoading, refresh, user])

  const addAgreement = async (agreementData: any) => {
    try {
      console.log("Sending agreement data:", agreementData)
      
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agreementData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        const errorMessage = errorData?.error || `HTTP ${res.status}`
        console.error("API Error:", errorMessage, errorData)
        throw new Error(`Failed to create agreement: ${errorMessage}`)
      }
      
      const data = await res.json()
      const createdAgreement: Agreement | undefined = data.agreement

      if (!createdAgreement?.id) {
        throw new Error("API did not return an agreement id")
      }

      setAgreements((prev) => [createdAgreement, ...prev])
      
      return createdAgreement.id
    } catch (error) {
      console.error("Agreement creation failed:", error)
      throw error
    }
  }

  const addAuditLog = async (agreementId: string, action: string, details: string) => {
    const res = await fetch(`/api/agreements/${agreementId}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, details }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Failed to add audit log (${res.status}): ${text || "unknown error"}`)
    }
    const data = await res.json()
    setAgreements((prev) => prev.map((a) => (a.id === agreementId ? data.agreement : a)))
  }

  const addWitnessSignature = async (
    agreementId: string,
    signatureData: string,
    stamp?: { ipAddress?: string; location?: string }
  ) => {
    try {
      if (!signatureData) {
        throw new Error("Signature data is required")
      }

      const res = await fetch(`/api/agreements/${agreementId}/witness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          signatureData,
          signatureType: signatureData.startsWith("data:") ? "drawn" : "typed",
          ipAddress: stamp?.ipAddress,
          location: stamp?.location,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to witness agreement (${res.status})`)
      }

      const data = await res.json()
      
      // Update local state immediately
      setAgreements(prev => prev.map(a => a.id === agreementId ? data.agreement : a))
      
      // Force refresh for consistency
      await refresh()
      
      return data.agreement
    } catch (error) {
      console.error("Witness signature failed:", error)
      throw error
    }
  }

  const signAsCounterparty = async (
    agreementId: string,
    signatureData: string,
    stamp?: { ipAddress?: string; location?: string },
  ) => {
    console.log("signAsCounterparty called with agreementId:", agreementId)
    
    if (!agreementId) {
      throw new Error("Agreement ID is required")
    }
    
    const url = `/api/agreements/${agreementId}/sign`
    console.log("Making request to:", url)
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        signatureData,
        ipAddress: stamp?.ipAddress,
        location: stamp?.location,
        userAgent: navigator.userAgent,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Failed to sign agreement (${res.status}): ${text || "unknown error"}`)
    }
    const data = await res.json()
    
    console.log("Signature successful for agreement:", agreementId)
    console.log("Updated agreement data:", data.agreement)
    
    // Immediately update local state with the fresh agreement data
    setAgreements((prev) => prev.map((a) => (a.id === agreementId ? data.agreement : a)))
    
    // Force a complete refresh to ensure all components get fresh data
    await refresh()
    
    // Additional verification - fetch the specific agreement again
    try {
      const verifyRes = await fetch(`/api/agreements/${agreementId}`, {
        credentials: "include"
      })
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json()
        setAgreements((prev) => prev.map((a) => (a.id === agreementId ? verifyData.agreement : a)))
      }
    } catch (e) {
      console.warn("Verification fetch failed:", e)
    }
    
    return data.agreement
  }

  const getEmailConfirmation = (agreementId: string, userEmail: string): string => {
    const agreement = agreements.find((a) => a.id === agreementId)
    if (!agreement) return ""
    return generateEmailConfirmation(agreement, userEmail)
  }

  const updateAgreement = async (id: string, updates: Partial<Agreement>) => {
    const res = await fetch(`/api/agreements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error("Failed to update agreement")
    const data = await res.json()
    setAgreements((prev) => prev.map((agreement) => (agreement.id === id ? data.agreement : agreement)))
  }

  const deleteAgreement = async (id: string) => {
    const res = await fetch(`/api/agreements/${id}`, { method: "DELETE", credentials: "include" })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Failed to delete agreement (${res.status}): ${text || "unknown error"}`)
    }
    setAgreements((prev) => prev.filter((agreement) => agreement.id !== id))
  }

  const completeAgreement = async (id: string) => {
    const res = await fetch(`/api/agreements/${id}/complete`, { method: "POST", credentials: "include" })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Failed to complete agreement (${res.status}): ${text || "unknown error"}`)
    }
    const data = await res.json()

    let updatedAgreements: Agreement[] = []
    setAgreements((prev) => {
      updatedAgreements = prev.map((agreement) => (agreement.id === id ? data.agreement : agreement))
      return updatedAgreements
    })

    const completedCount = updatedAgreements.filter((a) => a.status === "completed").length
    const allCompletions = updatedAgreements
      .filter((a) => a.type === "recurring")
      .flatMap((a) => a.completions || [])
    const currentStreak = calculateStreak(allCompletions)
    achievementContext.checkAndUnlockAchievements(completedCount, currentStreak)
  }

  const getAgreementById = (id: string) => {
    return agreements.find((agreement) => agreement.id === id)
  }

  const addPartnerToAgreement = async (agreementId: string, partner: Partner) => {
    const res = await fetch(`/api/agreements/${agreementId}/partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(partner),
    })
    if (!res.ok) throw new Error("Failed to add partner")
    const data = await res.json()
    setAgreements((prev) => prev.map((agreement) => (agreement.id === agreementId ? data.agreement : agreement)))
  }

  const removePartnerFromAgreement = async (agreementId: string, partnerId: string) => {
    const res = await fetch(`/api/agreements/${agreementId}/partners/${partnerId}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (!res.ok) throw new Error("Failed to remove partner")
    const data = await res.json()
    setAgreements((prev) => prev.map((agreement) => (agreement.id === agreementId ? data.agreement : agreement)))
  }

  const addMessageToAgreement = async (agreementId: string, message: SupportMessage) => {
    const res = await fetch(`/api/agreements/${agreementId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(message),
    })
    if (!res.ok) throw new Error("Failed to add message")
    const data = await res.json()
    setAgreements((prev) => prev.map((agreement) => (agreement.id === agreementId ? data.agreement : agreement)))
  }

  const performWorkflowAction = async (
    agreementId: string,
    action: string,
    payload?: any
  ) => {
    const res = await fetch(`/api/agreements/${agreementId}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, ...payload }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `Workflow action failed (${res.status})`)
    }

    // Realtime will trigger refresh, but we update locally for snappiness
    await refresh()
  }

  return (
    <AgreementContext.Provider
      value={{
        agreements,
        isLoading,
        refresh,
        refreshAgreements: refresh,
        addAgreement,
        updateAgreement,
        deleteAgreement,
        completeAgreement,
        getAgreementById,
        addPartnerToAgreement,
        removePartnerFromAgreement,
        addMessageToAgreement,
        addAuditLog,
        getEmailConfirmation,
        addWitnessSignature,
        signAsCounterparty,
        performWorkflowAction,
      }}
    >
      {children}
    </AgreementContext.Provider>
  )
}

export function useAgreements() {
  const context = useContext(AgreementContext)
  if (context === undefined) {
    throw new Error("useAgreements must be used within an AgreementProvider")
  }
  return context
}





