"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  FileText,
  Calendar,
  Zap,
  TrendingUp,
  Target,
  Award
} from "lucide-react"
import type { Agreement } from "@/lib/agreement-types"

interface QuickActionsPanelProps {
  agreements: Agreement[]
  className?: string
}

export function QuickActionsPanel({ agreements, className }: QuickActionsPanelProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  // Calculate actionable items
  const overdueAgreements = agreements.filter(a => a.status === 'overdue')
  const pendingSignatures = agreements.filter(a => {
    if (a.status !== 'active') return false
    
    // Check if user needs to sign
    const userEmailLower = user.email?.toLowerCase()
    const hasUserSigned = (a.legalSignatures || []).some(sig => 
      sig.signedByEmail?.toLowerCase() === userEmailLower || sig.signedBy === user.id
    )
    
    // If user is a participant and hasn't signed
    const isParticipant = a.sharedWith?.some(p => 
      p.userId === user.id || p.userEmail?.toLowerCase() === userEmailLower
    )
    
    return isParticipant && !hasUserSigned
  })

  const upcomingDeadlines = agreements.filter(a => {
    if (!a.deadline || a.status !== 'active') return false
    const deadline = new Date(a.deadline)
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return deadline <= nextWeek
  })

  const recurringDue = agreements.filter(a => {
    if (a.type !== 'recurring' || a.status !== 'active') return false
    // Simple check - in a real app you'd check the last completion date
    return true
  })

  const completableAgreements = agreements.filter(a => {
    if (a.status !== 'active') return false
    
    // Check if user is the creator or a counterparty who can complete
    const userEmailLower = user.email?.toLowerCase()
    const isCreator = a.userId === user.id
    const isCounterparty = a.sharedWith?.some(p => 
      (p.role === 'counterparty' || !p.role) && 
      (p.userId === user.id || p.userEmail?.toLowerCase() === userEmailLower)
    )
    
    return isCreator || isCounterparty
  })

  const quickActions = [
    {
      id: 'create',
      title: 'Create Agreement',
      description: 'Start a new agreement from templates',
      icon: <Plus className="w-5 h-5" />,
      action: () => router.push('/templates'),
      color: 'from-blue-500 to-cyan-500',
      priority: 1
    },
    {
      id: 'overdue',
      title: 'Review Overdue',
      description: `${overdueAgreements.length} agreements need attention`,
      icon: <AlertTriangle className="w-5 h-5" />,
      action: () => {
        // Navigate to dashboard with overdue filter
        router.push('/dashboard?filter=overdue')
      },
      color: 'from-red-500 to-pink-500',
      count: overdueAgreements.length,
      priority: overdueAgreements.length > 0 ? 5 : 0
    },
    {
      id: 'sign',
      title: 'Sign Pending',
      description: `${pendingSignatures.length} agreements awaiting your signature`,
      icon: <FileText className="w-5 h-5" />,
      action: () => {
        if (pendingSignatures.length > 0) {
          router.push(`/agreement/${pendingSignatures[0].id}`)
        }
      },
      color: 'from-orange-500 to-red-500',
      count: pendingSignatures.length,
      priority: pendingSignatures.length > 0 ? 4 : 0
    },
    {
      id: 'deadlines',
      title: 'Upcoming Deadlines',
      description: `${upcomingDeadlines.length} due this week`,
      icon: <Clock className="w-5 h-5" />,
      action: () => router.push('/calendar'),
      color: 'from-yellow-500 to-orange-500',
      count: upcomingDeadlines.length,
      priority: upcomingDeadlines.length > 0 ? 3 : 0
    },
    {
      id: 'complete',
      title: 'Mark Complete',
      description: `${completableAgreements.length} ready to complete`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      action: () => {
        if (completableAgreements.length > 0) {
          router.push(`/agreement/${completableAgreements[0].id}`)
        }
      },
      color: 'from-green-500 to-emerald-500',
      count: completableAgreements.length,
      priority: completableAgreements.length > 0 ? 2 : 0
    },
    {
      id: 'recurring',
      title: 'Daily Tasks',
      description: `${recurringDue.length} recurring items`,
      icon: <Target className="w-5 h-5" />,
      action: () => router.push('/dashboard?filter=recurring'),
      color: 'from-purple-500 to-pink-500',
      count: recurringDue.length,
      priority: recurringDue.length > 0 ? 2 : 0
    }
  ]

  // Sort by priority and show top 4
  const prioritizedActions = quickActions
    .filter(action => action.priority > 0 || action.id === 'create')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)

  const handleQuickComplete = async (agreementId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/agreements/${agreementId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quickComplete: true })
      })
      
      if (response.ok) {
        // Refresh agreements
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to complete agreement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`bg-slate-900/50 border-slate-800 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {prioritizedActions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={action.action}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white`}>
                {action.icon}
              </div>
              <div>
                <h4 className="text-white font-medium">{action.title}</h4>
                <p className="text-slate-400 text-sm">{action.description}</p>
              </div>
            </div>
            {action.count !== undefined && action.count > 0 && (
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {action.count}
              </Badge>
            )}
          </div>
        ))}

        {/* Quick Complete Section */}
        {completableAgreements.length > 0 && (
          <div className="border-t border-slate-700 pt-3 mt-4">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Quick Complete
            </h4>
            <div className="space-y-2">
              {completableAgreements.slice(0, 3).map((agreement) => (
                <div
                  key={agreement.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-800/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{agreement.title}</p>
                    <p className="text-slate-400 text-xs">
                      {agreement.type === 'recurring' ? 'Daily task' : 'One-time agreement'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickComplete(agreement.id)
                    }}
                    disabled={isLoading}
                  >
                    Complete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="border-t border-slate-700 pt-3 mt-4">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Today's Focus
          </h4>
          <div className="space-y-2 text-sm">
            {overdueAgreements.length > 0 && (
              <p className="text-red-400">
                Urgent: {overdueAgreements.length} overdue agreement{overdueAgreements.length > 1 ? 's' : ''} need immediate attention
              </p>
            )}
            {pendingSignatures.length > 0 && (
              <p className="text-orange-400">
                Action needed: {pendingSignatures.length} agreement{pendingSignatures.length > 1 ? 's' : ''} waiting for your signature
              </p>
            )}
            {upcomingDeadlines.length > 0 && (
              <p className="text-yellow-400">
                Reminder: {upcomingDeadlines.length} deadline{upcomingDeadlines.length > 1 ? 's' : ''} approaching this week
              </p>
            )}
            {overdueAgreements.length === 0 && pendingSignatures.length === 0 && upcomingDeadlines.length === 0 && (
              <p className="text-green-400">
                You're all caught up! Great job staying on top of your agreements.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
