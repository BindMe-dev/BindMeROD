"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Achievement } from "./achievements"
import { ACHIEVEMENT_DEFINITIONS, checkAchievements } from "./achievements"

interface AchievementContextType {
  achievements: Achievement[]
  addAchievement: (achievement: Achievement) => void
  checkAndUnlockAchievements: (totalCompletions: number, currentStreak: number) => Achievement[]
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined)

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("bindme_achievements")
    if (stored) {
      setAchievements(JSON.parse(stored))
    } else {
      const initialAchievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
        ...def,
        unlocked: false,
      }))
      setAchievements(initialAchievements)
    }
  }, [])

  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem("bindme_achievements", JSON.stringify(achievements))
    }
  }, [achievements])

  const addAchievement = (achievement: Achievement) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === achievement.id ? { ...a, unlocked: true, unlockedAt: achievement.unlockedAt } : a)),
    )
  }

  const checkAndUnlockAchievements = (totalCompletions: number, currentStreak: number): Achievement[] => {
    const newAchievements = checkAchievements(totalCompletions, currentStreak, achievements)

    if (newAchievements.length > 0) {
      setAchievements((prev) =>
        prev.map((a) => {
          const newAchievement = newAchievements.find((na) => na.id === a.id)
          return newAchievement || a
        }),
      )
    }

    return newAchievements
  }

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        addAchievement,
        checkAndUnlockAchievements,
      }}
    >
      {children}
    </AchievementContext.Provider>
  )
}

export function useAchievements() {
  const context = useContext(AchievementContext)
  if (context === undefined) {
    throw new Error("useAchievements must be used within an AchievementProvider")
  }
  return context
}
