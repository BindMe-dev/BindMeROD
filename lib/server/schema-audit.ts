import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

const requiredAgreementColumns = [
  "id",
  "userId",
  "title",
  "description",
  "type",
  "status",
  "category",
  "tags",
  "isShared",
  "isPublic",
  "effectiveDate",
  "endDate",
  "isPermanent",
  "targetDate",
  "recurrenceFrequency",
  "startDate",
  "deadline",
  "betStake",
  "betAmount",
  "betOdds",
  "betOpponentName",
  "betOpponentEmail",
  "betSettlementDate",
  "betTerms",
  "notes",
  "legalIntentAccepted",
  "termsAcceptedVersion",
  "jurisdictionClause",
  "emailConfirmationSent",
  "emailConfirmationTimestamp",
  "witnessRequired",
  "witnessStatus",
  "createdAt",
  "completedAt",
]

let agreementSchemaCheck:
  | Promise<{
      columns: string[]
      missing: string[]
    }>
  | null = null

export async function getAgreementSchemaStatus() {
  if (agreementSchemaCheck) return agreementSchemaCheck

  agreementSchemaCheck = db
    .execute(
      sql`select "column_name" from information_schema.columns where table_schema = 'public' and table_name = 'Agreement'`,
    )
    .then((result: any) => {
      const rows = Array.isArray(result?.rows) ? result.rows : []
      const columns = rows.map((row: { column_name: string }) => row.column_name)
      const missing = requiredAgreementColumns.filter((column) => !columns.includes(column))
      const status = { columns, missing }
      if (missing.length > 0) {
        agreementSchemaCheck = null
      }
      return status
    })
    .catch((error) => {
      agreementSchemaCheck = null
      throw error
    })

  return agreementSchemaCheck
}

export async function assertAgreementSchema() {
  const { missing } = await getAgreementSchemaStatus()
  if (missing.length > 0) {
    throw new Error(
      `Database schema for Agreement is missing columns: ${missing.join(
        ", ",
      )}. Run database migrations (e.g. "npm run db:push") before retrying.`,
    )
  }
}
