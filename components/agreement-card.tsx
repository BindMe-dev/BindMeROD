"use client"

import { useRouter } from "next/navigation"
import type { Agreement } from "@/lib/agreement-types"
import { getCategoryInfo } from "@/lib/categories"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Repeat, Clock, Users, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useMemo } from "react"

interface AgreementCardProps {
  agreement: Agreement
  compact?: boolean
}

export function AgreementCard({ agreement, compact = false }: AgreementCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  const getTypeIcon = () => {
    switch (agreement.type) {
      case "one-time":
        return <Calendar className="w-4 h-4" />
      case "recurring":
        return <Repeat className="w-4 h-4" />
      case "deadline":
        return <Clock className="w-4 h-4" />
      case "bet":
        return <Trophy className="w-4 h-4" />
    }
  }

  const getStatusColor = () => {
    switch (agreement.status) {
      case "active":
        return "bg-primary/10 text-primary border-primary/20"
      case "completed":
        return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Enhanced signature detection including witness signatures
  const hasUserSigned = useMemo(() => {
    if (!user?.email) return false
    
    const allSignatures = agreement.legalSignatures || agreement.legal?.signatures || []
    
    return allSignatures.some(
      (sig) => sig.signedByEmail?.toLowerCase() === user.email?.toLowerCase() || sig.signedBy === user.id
    )
  }, [user?.email, user?.id, agreement.legalSignatures, agreement.legal?.signatures])

  // Check user's role in this agreement
  const userRole = useMemo(() => {
    if (!user?.email) return null
    
    const userEmailLower = user.email.toLowerCase()
    
    // Check if creator
    if (agreement.userId === user.id) return "creator"
    
    // Check shared participants
    const participant = agreement.sharedWith?.find(p => 
      p.userId === user.id || p.userEmail?.toLowerCase() === userEmailLower
    )
    
    return participant?.role || null
  }, [user, agreement])

  // Get counterparty signatures for creators
  const counterpartySignatures = useMemo(() => {
    const allSignatures = agreement.legalSignatures || agreement.legal?.signatures || []
    return allSignatures.filter((sig) => sig.role === "counterparty")
  }, [agreement.legalSignatures, agreement.legal?.signatures])

  // Get signature status text based on user role
  const getSignatureStatus = () => {
    if (!hasAnySignatures) return { text: "No signatures", color: "bg-gray-50 text-gray-700 border-gray-200" }
    
    if (userRole === "creator") {
      // For creators, show counterparty signature status
      if (counterpartySignatures.length > 0) {
        return { 
          text: `✓ Counterparty signed (${counterpartySignatures.length})`, 
          color: "bg-green-50 text-green-700 border-green-200" 
        }
      } else {
        return { 
          text: "⏳ Awaiting counterparty signature", 
          color: "bg-yellow-50 text-yellow-700 border-yellow-200" 
        }
      }
    } else {
      // For non-creators, show their own signature status
      if (hasUserSigned) {
        return { 
          text: userRole === "witness" ? "✓ Witnessed" : "✓ Signed", 
          color: "bg-green-50 text-green-700 border-green-200" 
        }
      } else {
        return { 
          text: "✗ Unsigned", 
          color: "bg-red-50 text-red-700 border-red-200" 
        }
      }
    }
  }

  const hasAnySignatures = (agreement.legalSignatures?.length || 0) > 0 || 
                          (agreement.legal?.signatures?.length || 0) > 0

  // Debug logging
  console.log("AgreementCard debug:", {
    agreementId: agreement.id,
    hasLegal: !!agreement.legal,
    signaturesCount: agreement.legal?.signatures?.length || 0,
    userEmail: user?.email,
    hasUserSigned
  })

  const counterparties = (agreement.sharedWith || []).filter((p) => (p.role ?? "counterparty") === "counterparty")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-blue-900/20",
        agreement.status === "completed" && "opacity-70",
        compact && "border-dashed"
      )}
      onClick={() => router.push(`/agreement/${agreement.id}`)}
    >
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={cn("gap-1 bg-slate-800/60 border-slate-700 text-slate-200", getStatusColor())}>
            {getTypeIcon()}
            {agreement.type}
          </Badge>
          <Badge variant="outline" className={cn("bg-slate-800/60 border-slate-700 text-slate-200", getStatusColor())}>
            {agreement.status}
          </Badge>
        </div>
        {agreement.isShared && (
          <Badge variant="outline" className="gap-1 w-fit bg-purple-500/10 text-purple-200 border-purple-400/30">
            <Users className="w-3 h-3" />
            Shared with {counterparties.length}
          </Badge>
        )}
        {agreement.isPublic && (
          <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-200 border-amber-400/30">
            Public
          </Badge>
        )}
        {/* Fix signature status badge in card */}
        {user && (
          <Badge 
            variant="outline" 
            className={cn(
              "w-fit gap-1 bg-slate-800/60 border-slate-700 text-slate-200",
              getSignatureStatus().color
            )}
          >
            {getSignatureStatus().text}
          </Badge>
        )}
        {agreement.category && agreement.category !== "uncategorized" && (
          <Badge variant="outline" className={cn("gap-1 w-fit", getCategoryInfo(agreement.category).color)}>
            <span>{getCategoryInfo(agreement.category).icon}</span>
            <span className="text-xs">{getCategoryInfo(agreement.category).name}</span>
          </Badge>
        )}
        <CardTitle className="text-lg line-clamp-2">{agreement.title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-2", compact && "space-y-1 pb-3")}>
        {agreement.description && !compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">{agreement.description}</p>
        )}

        {agreement.type === "bet" && (
          <div className="text-xs text-muted-foreground space-y-1">
            {agreement.betStake && <p>Stake: {agreement.betStake}</p>}
            {(agreement.betOpponentName || agreement.betOpponentEmail) && (
              <p>
                vs {agreement.betOpponentName || "Opponent"}
                {agreement.betOpponentEmail ? ` (${agreement.betOpponentEmail})` : ""}
              </p>
            )}
          </div>
        )}

        {agreement.tags && agreement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agreement.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {agreement.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{agreement.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-2">
          {agreement.type === "one-time" && agreement.targetDate && (
            <span>Target: {formatDate(agreement.targetDate)}</span>
          )}
          {agreement.type === "recurring" && agreement.recurrenceFrequency && (
            <span className="capitalize">{agreement.recurrenceFrequency}</span>
          )}
          {agreement.type === "deadline" && agreement.deadline && <span>Due: {formatDate(agreement.deadline)}</span>}
          {agreement.type === "bet" && agreement.betSettlementDate && (
            <span>Settles: {formatDate(agreement.betSettlementDate)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}















