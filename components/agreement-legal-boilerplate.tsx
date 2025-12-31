"use client"

import type { Agreement } from "@/lib/agreement-types"
import { useAuth } from "@/lib/auth-context"

interface AgreementLegalBoilerplateProps {
  agreement: Agreement
}

export function AgreementLegalBoilerplate({ agreement }: AgreementLegalBoilerplateProps) {
  const { user } = useAuth()

  const creatorName =
    agreement.legal?.signatures?.[0]?.signedByName ||
    (user && agreement.userId === user.id ? user.name : user?.name) ||
    "Creator"
  const creatorEmail =
    agreement.legal?.signatures?.[0]?.signedByEmail ||
    (user && agreement.userId === user.id ? user.email : user?.email) ||
    "unknown@example.com"
  const counterparties = (agreement.sharedWith || []).filter((p) => (p.role ?? "counterparty") === "counterparty")
  const termsVersion = agreement.legal?.termsAcceptedVersion || "1.0.0"

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <h4 className="text-base font-semibold">Standard Legal Section</h4>

      <div className="space-y-2">
        <p className="font-medium">Binding Parties</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Creator:</strong> {creatorName} ({creatorEmail}) confirms full legal capacity to contract.
          </li>
          {counterparties.length > 0 ? (
            counterparties.map((p) => (
              <li key={p.userEmail}>
                <strong>Counterparty:</strong> {p.userName} ({p.userEmail}) confirms full legal capacity and agrees to
                be bound.
              </li>
            ))
          ) : (
            <li>
              <strong>Counterparties:</strong> None listed yet.
            </li>
          )}
        </ul>
      </div>

      {counterparties.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">Witness Responsibility</p>
          <p>
            Signing as a witness affirms that you observed the parties execute this agreement, that you reasonably
            verified their identities, and that you attest to the authenticity of the signatures. This statement may be
            relied upon in any dispute or enforcement action.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <p className="font-medium">Intent to Create Legal Relations</p>
        <p>All parties expressly intend this agreement to be legally binding and enforceable.</p>
      </div>

      <div className="space-y-1">
        <p className="font-medium">Electronic Signature & Evidence</p>
        <p>
          Parties agree electronic signatures have the same force as handwritten signatures under the Electronic
          Communications Act 2000 and the Electronic Signatures Regulations 2002.
        </p>
        <p>Evidence captured: signature data, timestamp, IP address, device/user agent, and location at signing.</p>
      </div>

      <div className="space-y-1">
        <p className="font-medium">Jurisdiction & Governing Law</p>
        <p>This agreement is governed by the laws of England &amp; Wales.</p>
        <p>Courts of England &amp; Wales have exclusive jurisdiction.</p>
      </div>

      <div className="space-y-1">
        <p className="font-medium">Acceptance of Terms</p>
        <p>The Creator accepts BindMe Terms of Service (v{termsVersion}) and incorporates them by reference.</p>
        <p>All parties accept the above terms and understand their obligations.</p>
      </div>
    </div>
  )
}
