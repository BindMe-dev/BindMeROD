"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface TermsAndConditionsProps {
  legalIntentAccepted?: boolean
  termsAccepted?: boolean
  hideCheckboxes?: boolean
  onLegalIntentChange?: (accepted: boolean) => void
  onTermsChange?: (accepted: boolean) => void
}

export function TermsAndConditions({
  legalIntentAccepted = false,
  termsAccepted = false,
  hideCheckboxes = false,
  onLegalIntentChange,
  onTermsChange,
}: TermsAndConditionsProps) {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[320px] w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner">
        <div className="space-y-4 text-sm text-slate-200">
        <h3 className="text-lg font-semibold text-white">BindMe Terms of Service</h3>
        <p className="text-slate-400">Version 1.0.0 - Effective Date: {new Date().toLocaleDateString()}</p>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">1. Legally Binding Agreements</h4>
          <p className="text-slate-300">
            By using BindMe to create agreements, you acknowledge that these commitments may be legally binding under UK
            law. By accepting these terms, you agree that:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-slate-300">
            <li>You have the legal capacity to enter into binding agreements</li>
            <li>You intend to create legal relations through this platform</li>
            <li>Your digital signature is legally equivalent to a handwritten signature</li>
            <li>You will honor the commitments you make on this platform</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">2. Electronic Signatures Compliance</h4>
          <p className="text-slate-300">
            BindMe complies with the Electronic Signatures Regulations 2002 (UK). Your electronic signature (typed or
            drawn) is legally valid and enforceable. We record:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-slate-300">
            <li>Your signature data and timestamp</li>
            <li>Your IP address at the time of signing</li>
            <li>Your user agent and device information</li>
            <li>A complete audit trail of all actions</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">3. Audit Trail & Record Keeping</h4>
          <p className="text-slate-300">
            We maintain a comprehensive audit trail of all agreement-related actions including creation, modification,
            completion, and deletion. This audit trail serves as evidence in case of disputes.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">4. Email Confirmation</h4>
          <p className="text-slate-300">
            Upon creating a legally binding agreement, you will receive an email confirmation containing the full
            agreement terms, your signature, and legal metadata. Retain this email for your records.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">5. Accountability Partners</h4>
          <p className="text-slate-300">
            When you add accountability partners to an agreement, they can view the agreement details and send support
            messages. Partners do not have legal obligations unless they also sign the agreement.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">6. Jurisdiction & Governing Law</h4>
          <p className="text-slate-300">
            All agreements created through BindMe are governed by the laws of England and Wales. Any disputes shall be
            subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">7. Consideration</h4>
          <p className="text-slate-300">
            The consideration for these agreements may include personal accountability, mutual support with partners,
            and the value of tracking and maintaining commitments.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">8. Dispute Resolution</h4>
          <p className="text-slate-300">
            In the event of a dispute, parties agree to first attempt resolution through good faith negotiation. If
            unsuccessful, disputes may be resolved through mediation or the UK court system.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">9. Data Protection</h4>
          <p className="text-slate-300">
            Your data is stored securely and used only for the purposes of managing your agreements. We comply with UK
            GDPR and Data Protection Act 2018.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-slate-100">10. Acceptance</h4>
          <p className="text-slate-300">
            By checking the acceptance box and providing your signature, you confirm that you have read, understood, and
            agree to be bound by these Terms of Service.
          </p>
        </section>
      </div>
    </ScrollArea>
    
    {!hideCheckboxes && (
      <div className="space-y-4 p-4 bg-slate-900/70 rounded-lg border border-slate-800">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="legal-intent"
            checked={legalIntentAccepted}
            onCheckedChange={(checked) => onLegalIntentChange?.(checked === true)}
          />
          <Label htmlFor="legal-intent" className="text-sm leading-relaxed cursor-pointer text-slate-200">
            I confirm that I have the legal capacity to enter into binding agreements and I intend to create legal relations through this platform.
          </Label>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms-accepted"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange?.(checked === true)}
          />
          <Label htmlFor="terms-accepted" className="text-sm leading-relaxed cursor-pointer text-slate-200">
            I have read, understood, and agree to be bound by the BindMe Terms of Service (Version 1.0.0).
          </Label>
        </div>
      </div>
    )}
  </div>
  )
}
