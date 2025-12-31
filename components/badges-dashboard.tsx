"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as BadgeUI } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Lock, Sparkles } from "lucide-react"
import { Badge, BADGES } from "@/lib/gamification-types"

interface BadgesData {
  unlockedBadges: Badge[]
  progress: {
    agreements: {
      current: number
      nextMilestone: number
      progress: number
    }
    referrals: {
      current: number
      nextMilestone: number
      progress: number
    }
  }
}

export function BadgesDashboard() {
  const [data, setData] = useState<BadgesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadgesData()
  }, [])

  async function fetchBadgesData() {
    try {
      const response = await fetch("/api/badges")
      if (!response.ok) {
        throw new Error("Failed to fetch badges")
      }
      const result = await response.json()

      // Validate the response has the expected structure
      if (result.error) {
        throw new Error(result.error)
      }

      // Ensure unlockedBadges is an array
      if (!result.unlockedBadges || !Array.isArray(result.unlockedBadges)) {
        result.unlockedBadges = []
      }

      // Ensure progress exists with default values
      if (!result.progress) {
        result.progress = {
          agreements: { current: 0, nextMilestone: 1, progress: 0 },
          referrals: { current: 0, nextMilestone: 1, progress: 0 }
        }
      }

      setData(result)
    } catch (error) {
      console.error("Failed to fetch badges:", error)
      // Set default empty data instead of null
      setData({
        unlockedBadges: [],
        progress: {
          agreements: { current: 0, nextMilestone: 1, progress: 0 },
          referrals: { current: 0, nextMilestone: 1, progress: 0 }
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading badges...</div>
  }

  if (!data) {
    return <div className="text-center py-8">Failed to load badges</div>
  }

  const unlockedIds = new Set((data.unlockedBadges || []).map((b) => b.id))
  const allBadges = Object.values(BADGES)

  const rarityColors = {
    common: "bg-gray-100 dark:bg-gray-800 border-gray-300",
    rare: "bg-blue-100 dark:bg-blue-900 border-blue-300",
    epic: "bg-purple-100 dark:bg-purple-900 border-purple-300",
    legendary: "bg-yellow-100 dark:bg-yellow-900 border-yellow-300",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Your Achievements
          </h2>
          <p className="text-muted-foreground mt-1">
            {data.unlockedBadges.length} of {allBadges.length} badges unlocked
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{data.unlockedBadges.length}</div>
          <div className="text-sm text-muted-foreground">Badges</div>
        </div>
      </div>

      {/* Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agreement Progress</CardTitle>
            <CardDescription>
              {data.progress?.agreements?.current || 0} / {data.progress?.agreements?.nextMilestone || 1} agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={data.progress?.agreements?.progress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {(data.progress?.agreements?.nextMilestone || 1) - (data.progress?.agreements?.current || 0)} more to unlock next badge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral Progress</CardTitle>
            <CardDescription>
              {data.progress?.referrals?.current || 0} / {data.progress?.referrals?.nextMilestone || 1} referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={data.progress?.referrals?.progress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {(data.progress?.referrals?.nextMilestone || 1) - (data.progress?.referrals?.current || 0)} more to unlock Referral Champion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {allBadges.map((badge) => {
          const isUnlocked = unlockedIds.has(badge.id)
          const unlockedBadge = data.unlockedBadges.find((b) => b.id === badge.id)

          return (
            <Card
              key={badge.id}
              className={`relative overflow-hidden transition-all ${
                isUnlocked
                  ? `${rarityColors[badge.rarity]} border-2`
                  : "opacity-50 grayscale"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  {/* Icon */}
                  <div className="text-5xl relative">
                    {badge.icon}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                  </div>

                  {/* Rarity */}
                  <BadgeUI
                    variant={isUnlocked ? "default" : "outline"}
                    className="text-xs"
                  >
                    {badge.rarity}
                  </BadgeUI>

                  {/* Unlocked date */}
                  {isUnlocked && unlockedBadge?.unlockedAt && (
                    <div className="text-xs text-muted-foreground">
                      Unlocked {new Date(unlockedBadge.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Sparkle effect for unlocked badges */}
                {isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

