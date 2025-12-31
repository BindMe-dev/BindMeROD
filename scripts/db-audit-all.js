#!/usr/bin/env node
const { Client } = require("pg")
const fs = require("fs")

function loadEnv(path) {
  if (!fs.existsSync(path)) return
  fs.readFileSync(path, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) return
      let val = m[2]
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (!(m[1] in process.env)) process.env[m[1]] = val
    })
}

loadEnv(".env.local")
loadEnv(".env")

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set; cannot audit database schema.")
  process.exit(1)
}

const expected = {
  Agreement: [
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
  ],
  Completion: ["id", "agreementId", "date", "completed", "createdAt"],
  SharedParticipant: ["id", "agreementId", "userId", "userName", "userEmail", "role", "joinedAt"],
  ParticipantCompletion: ["id", "participantId", "date", "completed", "createdAt"],
  AgreementPartner: ["id", "agreementId", "name", "email", "addedAt"],
  SupportMessage: ["id", "agreementId", "partnerId", "partnerName", "message", "timestamp", "userId"],
  LegalSignature: [
    "id",
    "agreementId",
    "signedBy",
    "signedByEmail",
    "signedByName",
    "signatureData",
    "role",
    "timestamp",
    "ipAddress",
    "userAgent",
    "location",
  ],
  AuditLog: [
    "id",
    "agreementId",
    "action",
    "performedBy",
    "performedByEmail",
    "timestamp",
    "details",
    "ipAddress",
  ],
  Notification: ["id", "userId", "type", "title", "message", "agreementId", "read", "createdAt"],
  User: ["id", "email", "password", "name", "username", "ipAddress", "publicProfile", "createdAt"],
}

async function main() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    let hasErrors = false
    for (const [table, cols] of Object.entries(expected)) {
      const res = await client.query(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
        [table],
      )
      const present = res.rows.map((r) => r.column_name)
      const missing = cols.filter((c) => !present.includes(c))
      const extra = present.filter((c) => !cols.includes(c))
      if (missing.length === 0 && extra.length === 0) {
        console.log(`[OK] ${table}: ${present.length} columns`)
      } else {
        hasErrors = true
        console.error(`[MISMATCH] ${table}`)
        if (missing.length > 0) console.error(`  Missing: ${missing.join(", ")}`)
        if (extra.length > 0) console.error(`  Extra: ${extra.join(", ")}`)
      }
    }
    if (hasErrors) {
      process.exit(1)
    } else {
      console.log("All tables match expected columns.")
    }
  } catch (err) {
    console.error("Audit failed:", err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
