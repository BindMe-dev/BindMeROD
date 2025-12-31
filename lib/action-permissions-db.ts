import { db } from "@/lib/db"
import { actionPermissions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

// Cache for permissions to avoid repeated database queries
let permissionsCache: {
  creator: Record<string, Record<string, boolean>>
  counterparty: Record<string, Record<string, boolean>>
  lastUpdated: number
} | null = null

const CACHE_TTL = 60000 // 1 minute

/**
 * Load action permissions from database with caching
 */
export async function loadActionPermissions() {
  // Return cached data if still valid
  if (permissionsCache && Date.now() - permissionsCache.lastUpdated < CACHE_TTL) {
    return {
      creator: permissionsCache.creator,
      counterparty: permissionsCache.counterparty,
    }
  }

  try {
    // Fetch all permissions from database
    const allPermissions = await db.select().from(actionPermissions)

    // Organize by role -> status -> action
    const creator: Record<string, Record<string, boolean>> = {}
    const counterparty: Record<string, Record<string, boolean>> = {}

    for (const perm of allPermissions) {
      const target = perm.role === "creator" ? creator : counterparty
      if (!target[perm.status]) {
        target[perm.status] = {}
      }
      target[perm.status][perm.action] = perm.enabled
    }

    // Update cache
    permissionsCache = {
      creator,
      counterparty,
      lastUpdated: Date.now(),
    }

    return { creator, counterparty }
  } catch (error) {
    console.error("Error loading action permissions:", error)
    // Return empty permissions on error
    return { creator: {}, counterparty: {} }
  }
}

/**
 * Check if a specific action is enabled for a role and status
 */
export async function isActionEnabled(
  role: "creator" | "counterparty",
  status: string,
  action: string
): Promise<boolean> {
  const permissions = await loadActionPermissions()
  return permissions[role]?.[status]?.[action] || false
}

/**
 * Clear the permissions cache (call this after updating permissions)
 */
export function clearPermissionsCache() {
  permissionsCache = null
}

/**
 * Get all enabled actions for a specific role and status
 */
export async function getEnabledActions(
  role: "creator" | "counterparty",
  status: string
): Promise<string[]> {
  const permissions = await loadActionPermissions()
  const statusPermissions = permissions[role]?.[status] || {}
  
  return Object.entries(statusPermissions)
    .filter(([_, enabled]) => enabled)
    .map(([action]) => action)
}

