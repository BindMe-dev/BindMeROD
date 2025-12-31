"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import { useAchievements } from "@/lib/achievement-store"
import { useNotifications } from "@/lib/notification-store"
import { calculateStreak } from "@/lib/achievements"
import { calculateUpcomingReminders, shouldShowReminder } from "@/lib/reminder-scheduler"
import type { Achievement } from "@/lib/achievements"
import type { AgreementCategory } from "@/lib/agreement-types"
import { CATEGORIES } from "@/lib/categories"
import { AgreementCard } from "@/components/agreement-card"
import { StreakDisplay } from "@/components/streak-display"
import { AchievementNotification } from "@/components/achievement-notification"
import { UserSearchDialog } from "@/components/user-search-dialog"
import { NotificationBell } from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { LogOut, BarChart3, Users, Award, Search, Filter, Calendar, Settings, Plus, Shield, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuickActionsPanel } from "@/components/quick-actions-panel"
import { ReferralWidget } from "@/components/referral-widget"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { user, signOut, isLoading } = useAuth()
  const { agreements } = useAgreements()
  const { achievements: userAchievements } = useAchievements()
  const { addNotification, preferences } = useNotifications()
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AgreementCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false)

  useEffect(() => {
    if (!user || agreements.length === 0) return

    const checkReminders = () => {
      const reminders = calculateUpcomingReminders(agreements, preferences)
      const shownReminders = JSON.parse(localStorage.getItem("bindme_shown_reminders") || "[]")

      reminders.forEach((reminder) => {
        if (shouldShowReminder(reminder) && !shownReminders.includes(reminder.id)) {
          addNotification({
            userId: user.id,
            type: reminder.type === "deadline" ? "deadline_reminder" : "recurring_due",
            title: reminder.title,
            message: reminder.message,
            agreementId: reminder.agreementId,
          })

          shownReminders.push(reminder.id)
          localStorage.setItem("bindme_shown_reminders", JSON.stringify(shownReminders))
        }
      })
    }

    checkReminders()
    const interval = setInterval(checkReminders, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [agreements, preferences, user, addNotification])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Show a confirmation banner when returning from email verification
  useEffect(() => {
    if (isLoading || !user) return
    if (searchParams?.get("verified")) {
      setShowVerifiedBanner(true)
      // Clean up the query param so the banner doesn't persist on reload
      const url = new URL(window.location.href)
      url.searchParams.delete("verified")
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [isLoading, user, searchParams, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  const handleSignOut = () => {
    signOut()
    router.push("/")
  }

  const filteredAgreements = agreements.filter((agreement) => {
    const matchesCategory = selectedCategory === "all" || agreement.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      agreement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const activeAgreements = filteredAgreements.filter((a) => a.status === "active")
  const completedAgreements = filteredAgreements.filter((a) => a.status === "completed")
  const overdueAgreements = filteredAgreements.filter((a) => a.status === "overdue")
  const userEmailLower = user.email.toLowerCase()
  const creatorAgreements = filteredAgreements.filter(
    (a) => a.userId === user.id || a.user?.email?.toLowerCase() === userEmailLower,
  )
  const counterpartyAgreements = filteredAgreements.filter((a) =>
    (a.sharedWith || []).some(
      (p) =>
        (p.role ?? "counterparty") === "counterparty" &&
        (p.userId === user.id || (p.userEmail || "").toLowerCase() === userEmailLower),
    ),
  )
  const witnessAgreements = agreements.filter(agreement => {
    if (!user?.email) return false
    return agreement.sharedWith?.some(participant => 
      participant.role === "witness" &&
      (participant.userId === user.id || 
       participant.userEmail?.toLowerCase() === user.email.toLowerCase())
    )
  })

  const allCompletions = agreements.filter((a) => a.type === "recurring").flatMap((a) => a.completions || [])
  const currentStreak = calculateStreak(allCompletions)
  const recentAchievements = userAchievements.filter((a) => a.unlocked).slice(-3)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-slate-950 to-purple-900/10" />
      
      <UserSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
      {newAchievement && (
        <AchievementNotification achievement={newAchievement} onDismiss={() => setNewAchievement(null)} />
      )}
      {showVerifiedBanner && (
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 sm:pt-36">
          <Alert className="mb-4 bg-green-500/10 border-green-500/50 text-white">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Account verified</AlertTitle>
            <AlertDescription>
              You’re all set. Your account is verified and a confirmation email has been sent.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="relative z-10 container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-12">
        {!user.dateOfBirth && (
          <Alert variant="destructive" className="mb-6 sm:mb-8 bg-red-500/10 border-red-500/50 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm sm:text-base">Profile Incomplete</AlertTitle>
            <AlertDescription className="text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span>Please add your date of birth to your profile to ensure full legal validity of your agreements.</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 hover:bg-white/10 self-start sm:self-auto"
                  onClick={() => router.push("/settings")}
                >
                  Go to Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Hero Section - Mobile optimized */}
        <section className="mb-8 sm:mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 backdrop-blur-sm">
            <div className="flex flex-col space-y-4 sm:space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:gap-6">
              <div className="space-y-3 sm:space-y-4 max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs sm:text-sm text-blue-400">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Evidence-backed agreements</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Create your next 
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}binding agreement
                  </span>
                </h2>
                <p className="text-slate-300 text-sm sm:text-base lg:text-lg">
                  Start from templates, collaborate with counterparties, and capture legally sound signatures with automatic audit trails.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold w-full sm:w-auto"
                onClick={() => router.push("/templates")}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                New Agreement
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Cards - Mobile optimized grid */}
        <section className="mb-8 sm:mb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Active"
              value={activeAgreements.length}
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Overdue"
              value={overdueAgreements.length}
              gradient="from-red-500 to-pink-500"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Completed"
              value={completedAgreements.length}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={<Award className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Streak"
              value={currentStreak}
              gradient="from-purple-500 to-pink-500"
            />
          </div>
        </section>

        {agreements.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">No agreements yet</h3>
            <p className="text-slate-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Create your first agreement to start tracking your commitments and building trust.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
              onClick={() => router.push("/templates")}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Create First Agreement
            </Button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Referral Widget */}
            <ReferralWidget />

            {/* Quick Actions Panel */}
            <QuickActionsPanel agreements={agreements} />

            {/* Filters - Mobile optimized */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
              <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Filter:</span>
                </div>
                
                {/* Mobile: Stack filters vertically */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:flex-1">
                  <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as AgreementCategory | "all")}>
                    <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <input
                    type="text"
                    placeholder="Search agreements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Role-based sections - Mobile optimized */}
            {(creatorAgreements.length > 0 || counterpartyAgreements.length > 0 || witnessAgreements.length > 0) && (
              <div className="space-y-4 sm:space-y-6 lg:grid lg:gap-6 lg:grid-cols-3 lg:space-y-0">
                <RoleSection
                  title="Creator"
                  count={creatorAgreements.length}
                  agreements={creatorAgreements}
                  gradient="from-blue-500 to-cyan-500"
                />
                <RoleSection
                  title="Counterparty"
                  count={counterpartyAgreements.length}
                  agreements={counterpartyAgreements}
                  gradient="from-purple-500 to-pink-500"
                />
                <RoleSection
                  title="Witness"
                  count={witnessAgreements.length}
                  agreements={witnessAgreements}
                  gradient="from-green-500 to-emerald-500"
                />
              </div>
            )}

            {/* Status sections - Mobile optimized */}
            {activeAgreements.length > 0 && (
              <AgreementSection
                title="Active Agreements"
                count={activeAgreements.length}
                agreements={activeAgreements}
                color="green"
              />
            )}

            {overdueAgreements.length > 0 && (
              <AgreementSection
                title="Overdue Agreements"
                count={overdueAgreements.length}
                agreements={overdueAgreements}
                color="red"
              />
            )}

            {completedAgreements.length > 0 && (
              <AgreementSection
                title="Completed Agreements"
                count={completedAgreements.length}
                agreements={completedAgreements}
                color="blue"
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, title, value, gradient }: {
  icon: React.ReactNode
  title: string
  value: number
  gradient: string
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r ${gradient} rounded-lg sm:rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xl sm:text-2xl font-bold">{value}</p>
        <p className="text-slate-400 text-xs sm:text-sm">{title}</p>
      </div>
    </div>
  )
}

function RoleSection({ title, count, agreements, gradient }: {
  title: string
  count: number
  agreements: any[]
  gradient: string
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm sm:text-base">{title}</h3>
        <span className={`px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-xs sm:text-sm font-semibold`}>
          {count}
        </span>
      </div>
      <div className="space-y-2 sm:space-y-3 max-h-[360px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {agreements.map((agreement) => (
          <AgreementCard key={agreement.id} agreement={agreement} compact />
        ))}
        {agreements.length === 0 && (
          <p className="text-slate-400 text-xs sm:text-sm">No agreements in this role.</p>
        )}
      </div>
    </div>
  )
}

function AgreementSection({ title, count, agreements, color }: {
  title: string
  count: number
  agreements: any[]
  color: 'green' | 'red' | 'blue'
}) {
  const colorClasses = {
    green: 'border-green-500/20 bg-green-500/5',
    red: 'border-red-500/20 bg-red-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5'
  }

  const dotColors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  }

  return (
    <section className={`border rounded-lg sm:rounded-xl p-4 sm:p-6 ${colorClasses[color]}`}>
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-3">
        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${dotColors[color]}`} />
        {title} ({count})
      </h3>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agreements.map((agreement) => (
          <AgreementCard key={agreement.id} agreement={agreement} />
        ))}
      </div>
    </section>
  )
}
