"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Gift, Users, TrendingUp, Mail, MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"

interface ReferralData {
  referralCode: string
  referralUrl: string
  stats: {
    totalReferrals: number
    totalRewards: number
    activeRewards: any[]
  }
  history: any[]
  rewards: any[]
}

export function ReferralDashboard() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReferralData()
  }, [])

  async function fetchReferralData() {
    try {
      const response = await fetch("/api/referrals")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch referral data:", error)
      toast.error("Failed to load referral data")
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  function shareViaEmail() {
    const subject = encodeURIComponent("Join me on BindMe - Get 1 month free!")
    const body = encodeURIComponent(
      `Hey! I've been using BindMe to create professional agreements in seconds.\n\nSign up with my link and we both get 1 month of premium free:\n${data?.referralUrl}\n\nIt's super easy and saves so much time!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function shareViaWhatsApp() {
    const text = encodeURIComponent(
      `Join me on BindMe and get 1 month free! ${data?.referralUrl}`
    )
    window.open(`https://wa.me/?text=${text}`)
  }

  function shareViaTwitter() {
    const text = encodeURIComponent(
      `I'm using @BindMe to create professional agreements in seconds. Join me and get 1 month free!`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(data?.referralUrl || "")}`)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!data) {
    return <div className="text-center py-8">Failed to load referral data</div>
  }

  const nextMilestone = data.stats.totalReferrals < 3 ? 3 : data.stats.totalReferrals < 5 ? 5 : 10
  const progress = (data.stats.totalReferrals / nextMilestone) * 100

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {nextMilestone - data.stats.totalReferrals} more to next reward
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.rewards.length}</div>
            <p className="text-xs text-muted-foreground">
              Rewards ready to use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <p className="text-xs text-muted-foreground">
              To {nextMilestone} referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends. You both get 1 month premium free when they sign up!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={data.referralUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={() => copyToClipboard(data.referralUrl)}
              variant="outline"
              size="icon"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={shareViaEmail} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button onClick={shareViaWhatsApp} variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareViaTwitter} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Twitter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

