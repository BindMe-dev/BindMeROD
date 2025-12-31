#!/usr/bin/env node
const { Client } = require("pg")

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

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL is not set; cannot audit database schema.")
    process.exit(1)
  }

  const client = new Client({ connectionString })

  try {
    await client.connect()
    const res = await client.query(
      `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
      ["Agreement"],
    )

    const columns = res.rows.map((row) => row.column_name)
    const missing = requiredAgreementColumns.filter((column) => !columns.includes(column))
    const extra = columns.filter((column) => !requiredAgreementColumns.includes(column))

    if (missing.length > 0) {
      console.error(`Agreement table is missing columns: ${missing.join(", ")}`)
      process.exit(1)
    }

    if (extra.length > 0) {
      console.warn(`Agreement table has extra columns not in schema: ${extra.join(", ")}`)
    }

    console.log(`Agreement table schema OK (${columns.length} columns).`)
    process.exit(0)
  } catch (error) {
    console.error("Database schema audit failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
