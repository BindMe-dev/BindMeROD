"use client"

import { useCallback, useEffect, useState } from "react"

interface ClientStamp {
  ipAddress: string
  location: string
  loading: boolean
  error?: string
  refresh: () => void
}

async function fetchStamp(): Promise<{ ipAddress: string; location: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/")
    if (res.ok) {
      const data = await res.json()
      const ipAddress = data.ip || "Unknown"
      const city = data.city || ""
      const region = data.region || ""
      const country = data.country_name || ""
      const location = [city, region, country].filter(Boolean).join(", ") || "Unknown location"
      return { ipAddress, location }
    }
  } catch {
    // ignore and fallback
  }

  try {
    const res = await fetch("https://api.ipify.org?format=json")
    if (res.ok) {
      const data = await res.json()
      return { ipAddress: data.ip || "Unknown", location: "Unknown location" }
    }
  } catch {
    // ignore
  }

  return { ipAddress: "Unknown", location: "Unknown location" }
}

export function useClientStamp(active: boolean): ClientStamp {
  const [ipAddress, setIpAddress] = useState("Loading...")
  const [location, setLocation] = useState("Loading...")
  const [loading, setLoading] = useState(active)
  const [error, setError] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    if (!active) return
    setLoading(true)
    setError(undefined)
    try {
      const stamp = await fetchStamp()
      setIpAddress(stamp.ipAddress)
      setLocation(stamp.location)
    } catch (err) {
      setError("Unable to fetch IP/location")
      setIpAddress("Unknown")
      setLocation("Unknown location")
    } finally {
      setLoading(false)
    }
  }, [active])

  useEffect(() => {
    load()
  }, [load])

  return { ipAddress, location, loading, error, refresh: load }
}
