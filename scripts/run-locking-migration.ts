import "dotenv/config"
import { db } from "../lib/db"
import { sql } from "drizzle-orm"
import * as fs from "fs"
import * as path from "path"

async function runMigration() {
  try {
    const migrationFile = process.argv[2] || "add_agreement_locking.sql"
    console.log(`Running migration: ${migrationFile}...`)

    const migrationPath = path.join(process.cwd(), "drizzle", migrationFile)
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8")

    // Remove comments and split by semicolons
    const statements = migrationSQL
      .split("\n")
      .filter(line => !line.trim().startsWith("--"))
      .join("\n")
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      const preview = statement.substring(0, 80).replace(/\s+/g, " ")
      console.log(`Executing: ${preview}...`)
      try {
        await db.execute(sql.raw(statement))
        console.log("  ✓ Success")
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === '42701' || error.message?.includes('already exists')) {
          console.log("  ⚠ Already exists, skipping")
        } else {
          throw error
        }
      }
    }

    console.log("✅ Migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

runMigration()

