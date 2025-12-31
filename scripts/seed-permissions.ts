import "dotenv/config"
import { seedDefaultPermissions } from "../lib/seed-default-permissions"

async function main() {
  console.log("Seeding default action permissions...")
  await seedDefaultPermissions()
  console.log("Done!")
  process.exit(0)
}

main().catch((error) => {
  console.error("Error seeding permissions:", error)
  process.exit(1)
})

