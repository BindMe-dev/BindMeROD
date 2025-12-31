#!/usr/bin/env node

/**
 * Law Firm Features Migration Script
 * 
 * This script applies the enhanced law firm features migration to the database.
 * It reads the SQL file and executes it against the configured database.
 */

const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

// Load environment variables
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) return
      let value = match[2]
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      if (!(match[1] in process.env)) {
        process.env[match[1]] = value
      }
    })
}

loadEnv(".env.local")
loadEnv(".env")

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set")
  process.exit(1)
}

async function runMigration() {
  const client = new Client({ connectionString })
  
  try {
    console.log("🔌 Connecting to database...")
    await client.connect()
    console.log("✅ Connected to database")

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, "..", "lib", "db", "migrations", "enhance-law-firm-features.sql")
    console.log(`📄 Reading migration file: ${migrationPath}`)
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }

    const sql = fs.readFileSync(migrationPath, "utf8")
    
    console.log("🚀 Running migration...")
    await client.query(sql)
    console.log("✅ Migration completed successfully!")

    // Verify new tables exist
    console.log("\n🔍 Verifying new tables...")
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('LawFirmService', 'LawFirmReview', 'LawFirmConsultation')
      ORDER BY table_name
    `)
    
    if (tables.rows.length > 0) {
      console.log("✅ New tables created:")
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    }

    // Verify new columns in LawFirm table
    console.log("\n🔍 Verifying new columns in LawFirm table...")
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'LawFirm' 
      AND column_name IN ('description', 'verified', 'totalCases', 'activeCases', 'userRating')
      ORDER BY column_name
    `)
    
    if (columns.rows.length > 0) {
      console.log("✅ New columns added to LawFirm:")
      columns.rows.forEach(row => {
        console.log(`   - ${row.column_name}`)
      })
    }

    // Verify new columns in LawFirmAssignment table
    console.log("\n🔍 Verifying new columns in LawFirmAssignment table...")
    const assignmentColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'LawFirmAssignment' 
      AND column_name IN ('status', 'priority', 'agreedFee', 'actualFee')
      ORDER BY column_name
    `)
    
    if (assignmentColumns.rows.length > 0) {
      console.log("✅ New columns added to LawFirmAssignment:")
      assignmentColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}`)
      })
    }

    console.log("\n✨ Law firm features migration completed successfully!")
    console.log("\n📝 Next steps:")
    console.log("   1. Run 'npm run db:push' to sync Drizzle schema")
    console.log("   2. Restart your development server")
    console.log("   3. Test the enhanced law firm features")

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
    console.log("\n🔌 Database connection closed")
  }
}

runMigration()

