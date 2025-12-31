"use client"

import type { AgreementType, RecurrenceFrequency, AgreementCategory } from "@/lib/agreement-types"
import { Badge } from "@/components/ui/badge"

interface AgreementDraftPreviewProps {
  title: string
  description: string
  type: AgreementType
  recurrenceFrequency?: RecurrenceFrequency
  targetDate?: string
  deadline?: string
  startDate?: string
  effectiveDate?: string
  endDate?: string
  isPermanent?: boolean
  category?: AgreementCategory
  tags?: string[]
  signerName?: string
  signerEmail?: string
  ipAddress?: string
  location?: string
  isShared?: boolean
  counterparties?: { name: string; email: string; addedBy?: "creator" | "counterparty" }[]
  witnesses?: { name: string; email: string; addedBy?: "creator" | "counterparty" }[]
  rentalDetails?: { carModel?: string; startDate?: string; endDate?: string; notes?: string }
}

export function AgreementDraftPreview({
  title,
  description,
  type,
  recurrenceFrequency,
  targetDate,
  deadline,
  startDate,
  effectiveDate,
  endDate,
  isPermanent,
  category,
  tags = [],
  signerName,
  signerEmail,
  ipAddress,
  location,
  isShared,
  counterparties = [],
  witnesses = [],
  rentalDetails,
}: AgreementDraftPreviewProps) {
  const hasRentalDetails =
    !!rentalDetails &&
    (!!rentalDetails.carModel || !!rentalDetails.startDate || !!rentalDetails.endDate || !!rentalDetails.notes)

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Agreement Draft</p>
          <h4 className="text-lg font-semibold">Summary Preview</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {isShared ? "Shared" : "Personal"}
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Title</p>
          <p className="font-semibold text-lg leading-tight">{title || "Untitled Agreement"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {description || "Add details about the commitment to generate a clean draft."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-medium capitalize">
              {type === "recurring" && recurrenceFrequency ? `${type} (${recurrenceFrequency})` : type}
            </p>
          </div>
          {targetDate && (
            <div>
              <p className="text-xs text-muted-foreground">Target Date</p>
              <p className="font-medium">{targetDate}</p>
            </div>
          )}
          {effectiveDate && (
            <div>
              <p className="text-xs text-muted-foreground">Effective From</p>
              <p className="font-medium">{effectiveDate}</p>
            </div>
          )}
          {isPermanent ? (
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-medium">Permanent</p>
            </div>
          ) : (
            endDate && (
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium">{endDate}</p>
              </div>
            )
          )}
          {startDate && (
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium">{startDate}</p>
            </div>
          )}
          {deadline && (
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium">{deadline}</p>
            </div>
          )}
          {category && (
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{category.replace("-", " ")}</p>
            </div>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {hasRentalDetails && (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted/70 px-3 py-2 text-sm font-medium">Car Rental Details</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {rentalDetails?.carModel && (
                    <tr className="border-b">
                      <th className="text-left px-3 py-2 w-32 bg-muted/40">Car Model</th>
                      <td className="px-3 py-2">{rentalDetails.carModel}</td>
                    </tr>
                  )}
                  {rentalDetails?.startDate && (
                    <tr className="border-b">
                      <th className="text-left px-3 py-2 bg-muted/40">From</th>
                      <td className="px-3 py-2">{rentalDetails.startDate}</td>
                    </tr>
                  )}
                  {rentalDetails?.endDate && (
                    <tr className="border-b">
                      <th className="text-left px-3 py-2 bg-muted/40">To</th>
                      <td className="px-3 py-2">{rentalDetails.endDate}</td>
                    </tr>
                  )}
                  {rentalDetails?.notes && (
                    <tr>
                      <th className="text-left px-3 py-2 align-top bg-muted/40">Notes</th>
                      <td className="px-3 py-2 whitespace-pre-wrap">{rentalDetails.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
          <p>Prepared by: {signerName || "Your name"} {signerEmail ? `(${signerEmail})` : ""}</p>
          {ipAddress && <p>IP stamp: {ipAddress}</p>}
          {location && <p>Location: {location}</p>}
        </div>

        <div className="border-t pt-4 space-y-2 text-sm text-slate-800">
          <p className="font-semibold">Narrative (Draft)</p>
          <p className="text-muted-foreground">
            The creator confirms legal capacity and intent to enter into a binding agreement. All named counterparties
            accept mutual obligations under the stated terms, and any listed witnesses are designated to attest to
            authenticity and execution.
          </p>

          <div className="space-y-1">
            <p className="font-medium text-sm">Counterparties</p>
            {counterparties.length > 0 ? (
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {counterparties.map((p) => (
                  <li key={p.email}>
                    {p.name} ({p.email}) — identified as a counterparty and accepting legal obligations.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No counterparties listed yet.</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-medium text-sm">Witnesses</p>
            {witnesses.length > 0 ? (
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {witnesses.map((w) => (
                  <li key={w.email}>
                    {w.name} ({w.email}) — designated as a witness by the {w.addedBy === "counterparty" ? "counterparty" : "creator"} to
                    attest to the execution and authenticity of this agreement.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No witnesses designated at this draft stage.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
