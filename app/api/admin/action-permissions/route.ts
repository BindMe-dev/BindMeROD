import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { actionPermissions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { clearPermissionsCache } from "@/lib/action-permissions-db"

// GET - Load all action permissions
export async function GET(request: NextRequest) {
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

    return NextResponse.json({ creator, counterparty })
  } catch (error) {
    console.error("Error loading action permissions:", error)
    return NextResponse.json(
      { error: "Failed to load action permissions" },
      { status: 500 }
    )
  }
}

// POST - Save action permissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creator, counterparty } = body

    // Delete all existing permissions
    await db.delete(actionPermissions)

    // Insert new permissions
    const permissionsToInsert = []

    // Process creator permissions
    for (const [status, actions] of Object.entries(creator || {})) {
      for (const [action, enabled] of Object.entries(actions as Record<string, boolean>)) {
        permissionsToInsert.push({
          id: nanoid(),
          role: "creator",
          status,
          action,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    // Process counterparty permissions
    for (const [status, actions] of Object.entries(counterparty || {})) {
      for (const [action, enabled] of Object.entries(actions as Record<string, boolean>)) {
        permissionsToInsert.push({
          id: nanoid(),
          role: "counterparty",
          status,
          action,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    // Batch insert
    if (permissionsToInsert.length > 0) {
      await db.insert(actionPermissions).values(permissionsToInsert)
    }

    // Clear the cache so new permissions take effect immediately
    clearPermissionsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving action permissions:", error)
    return NextResponse.json(
      { error: "Failed to save action permissions" },
      { status: 500 }
    )
  }
}

