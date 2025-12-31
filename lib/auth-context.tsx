"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { signIn as oauthSignIn, signOut as oauthSignOut } from "next-auth/react"
import type { PublicProfileSettings } from "./user-types"
import { DEFAULT_PUBLIC_PROFILE } from "./user-types"

interface User {
  id: string
  email: string
  name: string
  publicProfile: PublicProfileSettings
   firstName?: string
   middleName?: string
   lastName?: string
  isVerified?: boolean
  verifiedAt?: string
  verificationType?: string
  dateOfBirth?: string
  address?: string
  city?: string
  county?: string
  postcode?: string
  country?: string
   agreementCount?: number
   verifiedName?: string
   createdAt?: string
  preferences?: {
    agreementNotificationSettings?: Record<string, boolean>
    [key: string]: any
  }
}

interface AuthContextType {
  user: User | null
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    middleName: string,
    lastName: string,
    dateOfBirth: string,
  ) => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
  updateName: (name: string) => Promise<void>
  updateAddress: (
    address:
      | string
      | {
          streetAddress?: string
          city?: string
          county?: string
          postcode?: string
          country?: string
        },
  ) => Promise<void>
  updateDateOfBirth: (dob: string) => Promise<void>
  updatePublicProfile: (profile: Partial<PublicProfileSettings>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hydrateUser = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (!res.ok) {
        setUser(null)
      } else {
        const data = await res.json()
        setUser(
          data.user
            ? {
            ...data.user,
            publicProfile: data.user.publicProfile || DEFAULT_PUBLIC_PROFILE,
            isVerified: data.user.isVerified ?? false,
            dateOfBirth: data.user.dateOfBirth,
            address: data.user.address,
            city: data.user.city,
            county: data.user.county,
            postcode: data.user.postcode,
            country: data.user.country,
            preferences: data.user.preferences,
          }
        : null,
    )
  }
    } catch (error) {
      console.error("Failed to hydrate user", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    hydrateUser()
  }, [])

  const signIn = async (identifier: string, password: string) => {
    console.log("[AUTH] Starting signIn process for:", identifier)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ identifier, password }),
    })
    console.log("[AUTH] Login API response status:", res.status)
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("[AUTH] Login failed:", data)
      const error = new Error(data.error || "Invalid credentials")
      error.name = "AuthError"
      throw error
    }
    const data = await res.json()
    console.log("[AUTH] Login successful, setting user:", data.user?.email)
    setUser(
      data.user
        ? {
            ...data.user,
            isVerified: data.user.isVerified ?? false,
            dateOfBirth: data.user.dateOfBirth,
            address: data.user.address,
            city: data.user.city,
            county: data.user.county,
            postcode: data.user.postcode,
            country: data.user.country,
            preferences: data.user.preferences,
          }
        : null,
    )
    console.log("[AUTH] User state updated successfully")
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    middleName: string,
    lastName: string,
    dateOfBirth: string,
  ) => {
    try {
      const payload: any = {
        email,
        password,
        firstName,
        lastName,
        dateOfBirth
      }

      // Only include middleName if it's not empty
      if (middleName && middleName.trim()) {
        payload.middleName = middleName
      }

      // Include referral code if stored
      if (typeof window !== "undefined") {
        const referralCode = sessionStorage.getItem("referralCode")
        if (referralCode) {
          payload.referralCode = referralCode
        }
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(text)
        } catch (e) {
          // ignore parse error, fall back to raw text
        }
        throw new Error(data.error || `Server error (${res.status}): ${res.statusText}`)
      }

      const data = await res.json()
      setUser(
        data.user
          ? {
          ...data.user,
          isVerified: data.user.isVerified ?? false,
          dateOfBirth: data.user.dateOfBirth,
          address: data.user.address,
          city: data.user.city,
          county: data.user.county,
          postcode: data.user.postcode,
          country: data.user.country,
          preferences: data.user.preferences,
        }
      : null,
  )
    } catch (error) {
      console.error("Signup network error:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error: Unable to connect to server. Please check your connection.")
      }
      throw error
    }
  }

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    await oauthSignOut({ redirect: false }).catch(() => {})
    setUser(null)
  }

  const updateName = async (name: string) => {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to update name")
    }
    const data = await res.json()
    setUser(
      data.user
        ? {
          ...data.user,
          isVerified: data.user.isVerified ?? false,
          dateOfBirth: data.user.dateOfBirth,
          address: data.user.address,
          city: data.user.city,
          county: data.user.county,
          postcode: data.user.postcode,
          country: data.user.country,
        }
      : null,
  )
  }

  const updateAddress = async (
    address:
      | string
      | {
          streetAddress?: string
          city?: string
          county?: string
          postcode?: string
          country?: string
        },
  ) => {
    const payload =
      typeof address === "string"
        ? { streetAddress: address }
        : address

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to update address")
    }
    const data = await res.json()
    setUser(
      data.user
        ? {
            ...data.user,
            isVerified: data.user.isVerified ?? false,
            dateOfBirth: data.user.dateOfBirth,
            address: data.user.address,
          }
        : null,
    )
  }

  const updateDateOfBirth = async (dob: string) => {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dateOfBirth: dob }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to update date of birth")
    }
    const data = await res.json()
    setUser(
      data.user
        ? {
            ...data.user,
            isVerified: data.user.isVerified ?? false,
            dateOfBirth: data.user.dateOfBirth,
            address: data.user.address,
          }
        : null,
    )
  }

  const updatePublicProfile = async (profile: Partial<PublicProfileSettings>) => {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ publicProfile: profile }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to update profile")
    }
    const data = await res.json()
    setUser(
      data.user
        ? {
            ...data.user,
            isVerified: data.user.isVerified ?? false,
            dateOfBirth: data.user.dateOfBirth,
            address: data.user.address,
          }
        : null,
    )
  }

  const refreshUser = async () => {
    await hydrateUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        isLoading,
        updateName,
        updateAddress,
        updateDateOfBirth,
        updatePublicProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
