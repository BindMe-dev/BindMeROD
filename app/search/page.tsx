"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

export default function SearchPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const run = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, { credentials: "include" })
        const data = await res.json().catch(() => ({}))
        if (res.ok) setResults(data.users || [])
        else setError(data.error || "Search failed")
      } catch {
        setError("Search failed")
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(run, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-slate-400">Find users to collaborate, start agreements, or add as partners.</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="pl-12 h-12 bg-slate-900 border-slate-800 text-white placeholder-slate-500"
            />
          </div>
          {loading && <p className="text-sm text-slate-400">Searching…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="grid gap-3 mt-6">
          {results.length === 0 && !loading && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-300 text-sm">
              Type at least 2 characters to find users.
            </div>
          )}
          {results.map((u) => (
            <Card key={u.id} className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-white font-semibold">{u.name}</p>
                  <p className="text-slate-400 text-sm">{u.email}</p>
                  {u.address && (
                    <div className="flex gap-2 text-xs text-slate-400">
                      <Badge className="bg-slate-800 text-slate-200">{u.address}</Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={() =>
                      router.push(
                        `/templates?counterpartyId=${encodeURIComponent(u.id)}&counterpartyName=${encodeURIComponent(
                          u.name || "",
                        )}&counterpartyEmail=${encodeURIComponent(u.email || "")}`,
                      )
                    }
                  >
                    Create agreement
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-200 border-slate-700"
                    onClick={() => router.push(`/partners?add=${u.id}`)}
                  >
                    Add partner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
