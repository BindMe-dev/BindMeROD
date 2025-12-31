import type { PublicProfileSettings } from "./user-types"

export interface SearchableUser {
  id: string
  name: string
  email: string
  dateOfBirth?: string
  address?: string
  publicProfile?: PublicProfileSettings
}

export async function searchUsers(query: string): Promise<SearchableUser[]> {
  if (!query || query.length < 2) return []
  const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, { credentials: "include" })
  if (!res.ok) return []
  const data = await res.json()
  return data.users || []
}

export async function getUserByEmail(email: string): Promise<SearchableUser | null> {
  const users = await searchUsers(email)
  const cleanEmail = email.toLowerCase()
  return users.find((u) => u.email.toLowerCase() === cleanEmail) || null
}
