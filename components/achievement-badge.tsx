"use client"

import type { Achievement } from "@/lib/achievements"
import { cn } from "@/lib/utils"

interface AchievementBadgeProps {
  achievement: Achievement
  size?: "sm" | "md" | "lg"
}

export function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl",
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all",
          sizeClasses[size],
          achievement.unlocked
            ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"
            : "bg-muted grayscale opacity-50",
        )}
      >
        <span className={achievement.unlocked ? "" : "blur-sm"}>{achievement.icon}</span>
      </div>
      <div className="text-center">
        <div className={cn("font-semibold text-sm", !achievement.unlocked && "text-muted-foreground")}>
          {achievement.title}
        </div>
        <div className="text-xs text-muted-foreground">{achievement.description}</div>
        {achievement.unlocked && achievement.unlockedAt && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}
