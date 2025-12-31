"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, CheckCircle, Crown, Star, Zap } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  isVerified: boolean
  score: number
  label: string
}

interface LeaderboardData {
  type: string
  leaderboard: LeaderboardEntry[]
}

export function Leaderboard() {
  const [referralsData, setReferralsData] = useState<LeaderboardData | null>(null)
  const [badgesData, setBadgesData] = useState<LeaderboardData | null>(null)
  const [agreementsData, setAgreementsData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  async function fetchLeaderboards() {
    try {
      const [referrals, badges, agreements] = await Promise.all([
        fetch("/api/leaderboard?type=referrals&limit=10").then((r) => r.json()),
        fetch("/api/leaderboard?type=badges&limit=10").then((r) => r.json()),
        fetch("/api/leaderboard?type=agreements&limit=10").then((r) => r.json()),
      ])

      setReferralsData(referrals)
      setBadgesData(badges)
      setAgreementsData(agreements)
    } catch (error) {
      console.error("Failed to fetch leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
  }

  function getRankBadge(rank: number) {
    if (rank === 1) return "bg-yellow-100 dark:bg-yellow-900 border-yellow-300"
    if (rank === 2) return "bg-gray-100 dark:bg-gray-800 border-gray-300"
    if (rank === 3) return "bg-orange-100 dark:bg-orange-900 border-orange-300"
    return ""
  }

  function renderLeaderboard(data: LeaderboardData | null) {
    if (!data || !data.leaderboard.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available yet
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {data.leaderboard.map((entry) => {
          const initials = entry.userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                getRankBadge(entry.rank)
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{entry.userName}</span>
                  {entry.isVerified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{entry.label}</div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-2xl font-bold">{entry.score}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">Loading leaderboard...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers in the BindMe community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="agreements" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Agreements</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="mt-6">
            {renderLeaderboard(referralsData)}
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
            {renderLeaderboard(badgesData)}
          </TabsContent>

          <TabsContent value="agreements" className="mt-6">
            {renderLeaderboard(agreementsData)}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg text-center">
          <p className="text-sm font-medium mb-2">Want to climb the leaderboard?</p>
          <p className="text-xs text-muted-foreground">
            Refer friends, unlock badges, and create agreements to earn your spot!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

