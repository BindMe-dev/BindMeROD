// Cross-platform cache clean that tolerates OneDrive/Windows locks
const fs = require("fs/promises")

const targets = [".next", "Next.js"]

async function removePath(path) {
  try {
    await fs.rm(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 })
    console.log(`Removed ${path}`)
  } catch (err) {
    console.warn(`Could not remove ${path}: ${err.message}`)
  }
}

async function main() {
  for (const target of targets) {
    await removePath(target)
  }
}

main()
