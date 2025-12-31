"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { searchUsers, type SearchableUser } from "@/lib/user-search"
import { useAuth } from "@/lib/auth-context"
import { usePartners } from "@/lib/partner-store"
import { useToast } from "@/hooks/use-toast"

interface UserSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserSelect?: (user: SearchableUser) => void
}

export function UserSearchDialog({ open, onOpenChange, onUserSelect }: UserSearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchableUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { user } = useAuth()
  const { addPartner, partners } = usePartners()
  const { toast } = useToast()

  useEffect(() => {
    if (!query || !user) {
      setResults([])
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await searchUsers(query)
        setResults(searchResults)
      } catch (error) {
        console.error("Search failed", error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, user])

  const handleAddPartner = (searchedUser: SearchableUser) => {
    if (searchedUser.email.toLowerCase() === user?.email.toLowerCase()) {
      toast({
        title: "Cannot add yourself",
        description: "You cannot add yourself as a participant or witness.",
        variant: "destructive",
      })
      return
    }

    const existingPartner = partners.find((p) => p.email === searchedUser.email)
    if (existingPartner) {
      toast({
        title: "Already Added",
        description: `${searchedUser.name} is already your accountability partner`,
        variant: "destructive",
      })
      return
    }

    addPartner({
      name: searchedUser.name,
      email: searchedUser.email,
    })

    toast({
      title: "Partner Added",
      description: `${searchedUser.name} has been added as your accountability partner`,
    })

    setQuery("")
    setResults([])
  }

  const handleSelectUser = (searchedUser: SearchableUser) => {
    if (searchedUser.email.toLowerCase() === user?.email.toLowerCase()) {
      toast({
        title: "Cannot select yourself",
        description: "Please choose someone else. The creator cannot be a counterparty or witness.",
        variant: "destructive",
      })
      return
    }

    if (onUserSelect) {
      onUserSelect(searchedUser)
      setQuery("")
      setResults([])
    } else {
      handleAddPartner(searchedUser)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Find Users
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {onUserSelect
              ? "Search for users by email or name"
              : "Search for users by email or name to add as accountability partners"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-slate-400 hover:text-white"
                onClick={() => {
                  setQuery("")
                  setResults([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isSearching && <div className="text-center py-8 text-sm text-slate-400">Searching users...</div>}

          {!isSearching && query && results.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">No users found for "{query}"</div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(result.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">{result.name}</div>
                      <div className="text-sm text-slate-400">{result.email}</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSelectUser(result)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {onUserSelect ? "Select" : "Add Partner"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-sm text-slate-400">Start typing to search for users...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
