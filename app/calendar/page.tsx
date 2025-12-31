"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarIcon, Clock, Repeat, Trophy, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agreement } from "@/lib/agreement-types"
import { getCategoryInfo } from "@/lib/categories"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCallback } from "react"

export default function CalendarPage() {
  const { user, isLoading } = useAuth()
  const { agreements } = useAgreements()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateRole, setDateRole] = useState<"start" | "end">("start")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startDayOfWeek = firstDayOfMonth.getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getAgreementsForDate = (date: Date): { agreement: Agreement; type: 'start' | 'end' | 'active' }[] => {
    const dateString = date.toISOString().split("T")[0]
    const results: { agreement: Agreement; type: 'start' | 'end' | 'active' }[] = []

    agreements.forEach((agreement) => {
      // Check for start dates
      const startDate = agreement.startDate || agreement.effectiveDate
      if (startDate === dateString) {
        results.push({ agreement, type: 'start' })
      }

      // Check for end dates
      const endDate = agreement.endDate || agreement.deadline || agreement.targetDate || agreement.betSettlementDate
      if (endDate === dateString) {
        results.push({ agreement, type: 'end' })
      }

      // Check if date is within agreement period (active)
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (date > start && date < end) {
          results.push({ agreement, type: 'active' })
        }
      }

      // Handle recurring agreements
      if (agreement.type === "recurring" && agreement.startDate) {
        const startDate = new Date(agreement.startDate)
        if (date >= startDate) {
          const frequency = agreement.recurrenceFrequency
          let isRecurringDate = false

          if (frequency === "daily") {
            isRecurringDate = true
          } else if (frequency === "weekly") {
            const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            isRecurringDate = daysDiff % 7 === 0
          } else if (frequency === "monthly") {
            isRecurringDate = date.getDate() === startDate.getDate()
          }

          if (isRecurringDate && !results.some(r => r.agreement.id === agreement.id)) {
            results.push({ agreement, type: 'active' })
          }
        }
      }
    })

    return results
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const getUpcomingEvents = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const events: { date: string; agreement: Agreement; type: 'start' | 'end' | 'active' }[] = []

    agreements.forEach((agreement) => {
      const startDate = agreement.startDate || agreement.effectiveDate
      const endDate = agreement.endDate || agreement.deadline || agreement.targetDate || agreement.betSettlementDate

      const addIfInRange = (iso: string | undefined, type: 'start' | 'end') => {
        if (!iso) return
        const d = new Date(iso)
        if (d >= today && d <= nextWeek) {
          events.push({ date: iso, agreement, type })
        }
      }

      addIfInRange(startDate, 'start')
      addIfInRange(endDate, 'end')
    })

    return events
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8)
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = []
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  const handleDayDoubleClick = useCallback((date: Date) => {
    setSelectedDate(date)
    setDateRole("start")
    setCreateDialogOpen(true)
  }, [])

  const handleCreateWithDate = () => {
    if (!selectedDate) return
    const iso = selectedDate.toISOString().split("T")[0]
    // Pass the selected date role (start/end) via query params to the create agreement flow
    const query = new URLSearchParams({ [dateRole === "start" ? "startDate" : "endDate"]: iso }).toString()
    router.push(`/create-agreement?${query}`)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-slate-950 to-purple-900/10" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <Card className="mb-8 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {monthNames[month]} {year}
              </h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <Button 
                  variant="outline" 
                  onClick={goToToday} 
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Today
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={prevMonth} 
                    className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextMonth} 
                    className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-full md:min-w-[700px] text-[11px] sm:text-sm">
                {dayNames.map((day) => (
                  <div key={day} className="text-center font-semibold text-slate-400 py-2 sm:py-3">
                    {day}
                  </div>
                ))}

                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[90px] sm:min-h-[140px] p-2 sm:p-3" />
                  }

                  const dateAgreements = getAgreementsForDate(date)
                  const today = isToday(date)

                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        "min-h-[90px] sm:min-h-[140px] p-2 sm:p-3 rounded-xl border transition-all duration-200",
                        today
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50",
                      )}
                      onDoubleClick={() => handleDayDoubleClick(date)}
                    >
                      <div
                        className={cn(
                          "text-xs sm:text-sm font-semibold mb-2 sm:mb-3",
                          today ? "text-blue-400" : "text-white",
                        )}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {dateAgreements.slice(0, 3).map(({ agreement, type }) => (
                          <div
                            key={`${agreement.id}-${type}`}
                            onClick={() => router.push(`/agreement/${agreement.id}`)}
                            className={cn(
                              "text-xs p-2 rounded-lg cursor-pointer transition-all duration-200 border",
                              type === 'start' && "bg-green-500/20 border-green-500/40 hover:bg-green-500/30",
                              type === 'end' && "bg-red-500/20 border-red-500/40 hover:bg-red-500/30",
                              type === 'active' && "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              {type === 'start' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                              {type === 'end' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                              {agreement.type === "recurring" && <Repeat className="w-3 h-3 text-purple-400" />}
                              {agreement.type === "deadline" && <Clock className="w-3 h-3 text-red-400" />}
                              {agreement.type === "bet" && <Trophy className="w-3 h-3 text-yellow-400" />}
                              {agreement.type === "one-time" && <CalendarIcon className="w-3 h-3 text-blue-400" />}
                              <span className="text-xs text-slate-400">
                                {type === 'start' && 'Start'}
                                {type === 'end' && 'End'}
                                {type === 'active' && 'Active'}
                              </span>
                            </div>
                            <div className="truncate font-medium leading-tight text-white">{agreement.title}</div>
                          </div>
                        ))}
                        {dateAgreements.length > 3 && (
                          <div className="text-xs text-slate-400 text-center py-1 bg-slate-800/50 rounded-lg">
                            +{dateAgreements.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-white">Upcoming (next 7 days)</h3>
              <div className="space-y-3">
                {getUpcomingEvents().length === 0 && (
                  <p className="text-sm text-slate-400">No upcoming dates in the next week.</p>
                )}
                {getUpcomingEvents().map(({ date, agreement, type }) => {
                  const when = new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  return (
                    <div
                      key={`${agreement.id}-${date}-${type}`}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{agreement.title}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {type === "start" ? "Starts" : "Ends"} • {agreement.category || "Uncategorized"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{when}</div>
                        <div className="text-xs text-slate-400 capitalize">{agreement.type}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-white">Legend</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Start date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span>End / deadline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Repeat className="w-3 h-3 text-purple-400" />
                  <span>Recurring cadence</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>Deadline agreement</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-white">Tips</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>Tap a date to view agreements starting, ending, or active on that day.</li>
                <li>Recurring agreements show on their cadence (daily, weekly, monthly).</li>
                <li>Use Dashboard filters to focus by category or status.</li>
                <li>Set reminders in an agreement to get deadline alerts.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">Use this date in a new agreement</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"} • Choose whether to set it as start or end date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={dateRole} onValueChange={(v) => setDateRole(v as "start" | "end")} className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <RadioGroupItem value="start" id="date-start" />
                <Label htmlFor="date-start" className="text-sm text-white">Use as start date</Label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <RadioGroupItem value="end" id="date-end" />
                <Label htmlFor="date-end" className="text-sm text-white">Use as end date</Label>
              </div>
            </RadioGroup>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-200" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateWithDate} disabled={!selectedDate}>
                Go to create agreement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
