import { db } from "./lib/db.js"
import { agreements } from "./lib/db/schema.js"

async function deleteAllAgreements() {
  try {
    const result = await db.delete(agreements)
    console.log("All agreements deleted successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error deleting agreements:", error)
    process.exit(1)
  }
}

deleteAllAgreements()