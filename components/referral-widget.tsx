"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Copy, Check, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface ReferralData {
  referralCode: string
  referralUrl: string
  totalReferrals: number
  pendingReferrals: number
  rewards: Array<{
    type: string
    description: string
  }>
}

export function ReferralWidget() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchReferralData()
  }, [])

  async function fetchReferralData() {
    try {
      const response = await fetch("/api/referrals")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function copyReferralLink() {
    if (!data) return

    try {
      await navigator.clipboard.writeText(data.referralUrl)
      setCopied(true)
      toast.success("Referral link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <CardContent className="py-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4">
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20 hover:border-purple-500/40 transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Gift className="h-5 w-5 text-purple-400" />
          Invite Friends, Earn Rewards
        </CardTitle>
        <CardDescription className="text-slate-300">
          Get 1 month free for each friend who signs up!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="text-2xl font-bold text-white">{data.totalReferrals}</div>
            <div className="text-xs text-slate-400">Total Referrals</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">{data.rewards.length}</div>
            <div className="text-xs text-slate-400">Rewards Earned</div>
          </div>
        </div>

        {/* Copy Link */}
        <div className="flex gap-2">
          <input
            type="text"
            value={data.referralUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm truncate"
          />
          <Button
            size="sm"
            onClick={copyReferralLink}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* View Full Dashboard */}
        <Button
          variant="outline"
          className="w-full border-purple-500/30 hover:bg-purple-500/10 text-purple-300"
          onClick={() => router.push("/referrals")}
        >
          View Full Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {/* Next Reward */}
        {data.totalReferrals < 3 && (
          <div className="text-xs text-slate-400 text-center">
            {3 - data.totalReferrals} more referrals to unlock 25% lifetime discount!
          </div>
        )}
      </CardContent>
    </Card>
  )
}

