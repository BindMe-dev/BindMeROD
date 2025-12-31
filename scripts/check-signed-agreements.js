#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { drizzle } = require("drizzle-orm/node-postgres")
const { Pool } = require("pg")
const { eq, sql } = require("drizzle-orm")

async function checkSignedAgreements() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL is not set in environment variables")
    process.exit(1)
  }

  console.log("Connecting to database...")
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  const db = drizzle(pool)

  try {
    // Test connection first
    await pool.query('SELECT 1')
    console.log("Connected to database successfully")

    // Raw query to get signed agreements
    const result = await pool.query(`
      SELECT 
        a.id as agreement_id,
        a.title,
        a.status,
        ls.id as signature_id,
        ls."signedByEmail",
        ls."signedByName",
        ls.role,
        ls.timestamp
      FROM "Agreement" a
      LEFT JOIN "LegalSignature" ls ON a.id = ls."agreementId"
      WHERE ls.id IS NOT NULL
      ORDER BY a.id, ls.timestamp;
    `)
    
    console.log("\n=== SIGNED AGREEMENTS ===")
    console.log(`Found ${result.rows.length} signatures across agreements\n`)

    if (result.rows.length === 0) {
      console.log("No signed agreements found.")
      return
    }

    // Group by agreement
    const agreementMap = new Map()
    
    result.rows.forEach(row => {
      if (!agreementMap.has(row.agreement_id)) {
        agreementMap.set(row.agreement_id, {
          id: row.agreement_id,
          title: row.title,
          status: row.status,
          signatures: []
        })
      }
      
      agreementMap.get(row.agreement_id).signatures.push({
        signedByEmail: row.signedByEmail,
        signedByName: row.signedByName,
        role: row.role,
        timestamp: row.timestamp
      })
    })

    // Print results
    agreementMap.forEach((agreement, id) => {
      console.log(`Agreement ID: ${id}`)
      console.log(`Title: ${agreement.title}`)
      console.log(`Status: ${agreement.status}`)
      console.log(`Signatures (${agreement.signatures.length}):`)
      
      agreement.signatures.forEach((sig, index) => {
        console.log(`  ${index + 1}. ${sig.signedByName} (${sig.signedByEmail}) - ${sig.role}`)
        console.log(`     Signed: ${new Date(sig.timestamp).toLocaleString()}`)
      })
      console.log("---")
    })

    // Summary
    console.log(`\nSUMMARY:`)
    console.log(`Total agreements with signatures: ${agreementMap.size}`)
    
    const fullySignedCount = Array.from(agreementMap.values()).filter(a => 
      a.signatures.some(s => s.role === 'creator') && 
      a.signatures.some(s => s.role === 'counterparty')
    ).length
    
    console.log(`Fully signed agreements (creator + counterparty): ${fullySignedCount}`)

  } catch (error) {
    console.error("Error:", error)
  } finally {
    await pool.end()
  }
}

checkSignedAgreements()
