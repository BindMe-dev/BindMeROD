"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { usePartners } from "@/lib/partner-store"
import { useAgreements } from "@/lib/agreement-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, UserPlus, Trash2, Search } from "lucide-react"
import { UserSearchDialog } from "@/components/user-search-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PartnersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { partners, addPartner, removePartner } = usePartners()
  const { agreements } = useAgreements()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const handleAddPartner = () => {
    if (!name.trim() || !email.trim()) return
    addPartner({ name: name.trim(), email: email.trim() })
    setName("")
    setEmail("")
  }

  const getPartnerAgreementCount = (partnerId: string) => {
    return agreements.filter((a) => a.partners?.some((p) => p.id === partnerId)).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <UserSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />

      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Accountability Partners</h1>
            <p className="text-muted-foreground">Manage your accountability partners who help keep you on track</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => setSearchDialogOpen(true)} variant="default" className="gap-2 flex-1">
                    <Search className="w-4 h-4" />
                    Search Users by @username
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter partner's name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter partner's email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddPartner}
                  disabled={!name.trim() || !email.trim()}
                  className="gap-2 bg-transparent"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Partner Manually
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Partners ({partners.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {partners.length > 0 ? (
                <div className="space-y-3">
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">{partner.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Supporting {getPartnerAgreementCount(partner.id)} agreement
                          {getPartnerAgreementCount(partner.id) !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Partner</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {partner.name}? They will be removed from all agreements.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removePartner(partner.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No partners yet. Add someone above to start building your accountability network.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
