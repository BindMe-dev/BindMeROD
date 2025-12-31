"use client"

import { useEffect, useState } from "react"
import type { Achievement } from "@/lib/achievements"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AchievementNotificationProps {
  achievement: Achievement
  onDismiss: () => void
}

export function AchievementNotification({ achievement, onDismiss }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Card className="w-80 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-xl">
        <CardContent className="pt-6 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg">
              {achievement.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-orange-600 mb-1">Achievement Unlocked!</div>
              <div className="font-bold text-lg">{achievement.title}</div>
              <div className="text-sm text-muted-foreground">{achievement.description}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
