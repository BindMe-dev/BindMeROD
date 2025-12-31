import "dotenv/config"
import { db } from "../lib/db"
import { lawFirms } from "../lib/db/schema"
import { isNotNull, eq } from "drizzle-orm"
import { sendEmail } from "../lib/email-service"

/**
 * Migration script: SHA-256 to bcrypt password transition
 * 
 * Since SHA-256 is a one-way hash, we cannot decrypt and re-hash.
 * This script marks all firms with SHA-256 passwords for mandatory reset.
 * 
 * Run with: npx ts-node scripts/migrate-firm-passwords.ts
 */

// SHA-256 produces 64 character hex strings
// bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters
function isSHA256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}

function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash)
}

async function migrateFirmPasswords() {
  console.log("🔐 Starting law firm password migration...")
  console.log("=" .repeat(50))

  try {
    // Get all firms with password hashes
    const firms = await db.query.lawFirms.findMany({
      where: isNotNull(lawFirms.passwordHash),
    })

    console.log(`Found ${firms.length} law firms with passwords`)

    let sha256Count = 0
    let bcryptCount = 0
    let unknownCount = 0
    const firmsToReset: typeof firms = []

    for (const firm of firms) {
      if (!firm.passwordHash) continue

      if (isBcryptHash(firm.passwordHash)) {
        bcryptCount++
        console.log(`✅ ${firm.email} - Already using bcrypt`)
      } else if (isSHA256Hash(firm.passwordHash)) {
        sha256Count++
        firmsToReset.push(firm)
        console.log(`⚠️  ${firm.email} - SHA-256 hash detected, needs reset`)
      } else {
        unknownCount++
        console.log(`❓ ${firm.email} - Unknown hash format`)
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log("Summary:")
    console.log(`  ✅ bcrypt hashes: ${bcryptCount}`)
    console.log(`  ⚠️  SHA-256 hashes (need reset): ${sha256Count}`)
    console.log(`  ❓ Unknown format: ${unknownCount}`)

    if (firmsToReset.length === 0) {
      console.log("\n✅ No migration needed - all passwords already use bcrypt!")
      return
    }

    console.log(`\n🔄 Marking ${firmsToReset.length} firms for password reset...`)

    for (const firm of firmsToReset) {
      // Clear the password hash to force reset on next login
      await db
        .update(lawFirms)
        .set({
          passwordHash: null,
          updatedAt: new Date(),
        })
        .where(eq(lawFirms.id, firm.id))

      // Send password reset email
      if (firm.email) {
        try {
          await sendEmail({
            to: firm.email,
            subject: "BindMe: Password Reset Required - Security Update",
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: Arial, sans-serif; background: #0b1224; color: #e2e8f0; padding: 24px;">
                  <div style="max-width: 640px; margin: 0 auto; background: #0f172a; border: 1px solid #1f2937; border-radius: 12px; padding: 24px;">
                    <h1 style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 22px;">Security Update: Password Reset Required</h1>
                    <p style="margin: 0 0 12px 0; color: #cbd5e1;">Hi ${firm.name || "there"},</p>
                    <p style="margin: 0 0 12px 0; color: #cbd5e1;">
                      As part of our ongoing security improvements, we've upgraded our password encryption system. 
                      Your account requires a password reset to continue using the BindMe Law Firm Portal.
                    </p>
                    <p style="margin: 0 0 12px 0; color: #cbd5e1;">
                      Please visit the law firm login page and use the "Forgot Password" option to set a new password.
                    </p>
                    <a href="https://bindme.co.uk/firm/login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 12px 0;">
                      Reset Password
                    </a>
                    <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 14px;">
                      If you didn't expect this email, please contact support immediately.
                    </p>
                  </div>
                </body>
              </html>
            `,
          })
          console.log(`  📧 Email sent to ${firm.email}`)
        } catch (emailError) {
          console.error(`  ❌ Failed to send email to ${firm.email}:`, emailError)
        }
      }
    }

    console.log("\n✅ Migration complete!")
    console.log("All affected firms have been notified and must reset their passwords.")

  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

migrateFirmPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
