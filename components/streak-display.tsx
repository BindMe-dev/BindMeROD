"use client"

import { Card, CardContent } from "@/components/ui/card"
import { getStreakEmoji } from "@/lib/achievements"
import { Flame } from "lucide-react"

interface StreakDisplayProps {
  streak: number
  compact?: boolean
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
        <span className="text-2xl">{getStreakEmoji(streak)}</span>
        <div>
          <div className="text-2xl font-bold text-orange-600">{streak}</div>
          <div className="text-xs text-muted-foreground">day streak</div>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Current Streak</h3>
          </div>
          <span className="text-3xl">{getStreakEmoji(streak)}</span>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-orange-600 mb-2">{streak}</div>
          <div className="text-sm text-muted-foreground">{streak === 1 ? "day" : "days"} in a row</div>
        </div>
        {streak === 0 && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Complete a recurring agreement to start your streak!
          </p>
        )}
        {streak > 0 && (
          <p className="text-xs text-center text-muted-foreground mt-4">Keep it up! Don't break the chain.</p>
        )}
      </CardContent>
    </Card>
  )
}
