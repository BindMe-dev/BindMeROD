export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  requirement: number
  category: "completion" | "streak" | "milestone"
  unlocked: boolean
  unlockedAt?: string
}

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  // Completion achievements
  {
    id: "first-completion",
    title: "First Step",
    description: "Complete your first agreement",
    icon: "🎯",
    requirement: 1,
    category: "completion",
  },
  {
    id: "five-completions",
    title: "Getting Started",
    description: "Complete 5 agreements",
    icon: "⭐",
    requirement: 5,
    category: "completion",
  },
  {
    id: "ten-completions",
    title: "Committed",
    description: "Complete 10 agreements",
    icon: "💪",
    requirement: 10,
    category: "completion",
  },
  {
    id: "twenty-completions",
    title: "Dedicated",
    description: "Complete 20 agreements",
    icon: "🏆",
    requirement: 20,
    category: "completion",
  },
  {
    id: "fifty-completions",
    title: "Master",
    description: "Complete 50 agreements",
    icon: "👑",
    requirement: 50,
    category: "completion",
  },
  // Streak achievements
  {
    id: "three-day-streak",
    title: "On Fire",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    requirement: 3,
    category: "streak",
  },
  {
    id: "week-streak",
    title: "Weekly Warrior",
    description: "Maintain a 7-day streak",
    icon: "💥",
    requirement: 7,
    category: "streak",
  },
  {
    id: "two-week-streak",
    title: "Consistency King",
    description: "Maintain a 14-day streak",
    icon: "✨",
    requirement: 14,
    category: "streak",
  },
  {
    id: "month-streak",
    title: "Unstoppable",
    description: "Maintain a 30-day streak",
    icon: "🌟",
    requirement: 30,
    category: "streak",
  },
  // Milestone achievements
  {
    id: "perfect-week",
    title: "Perfect Week",
    description: "Complete all agreements in a week",
    icon: "💯",
    requirement: 1,
    category: "milestone",
  },
]

export function calculateStreak(completions: { completed: boolean; completedAt?: string }[]): number {
  if (!completions || completions.length === 0) return 0

  const sortedCompletions = completions
    .filter((c) => c.completed && c.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

  if (sortedCompletions.length === 0) return 0

  let streak = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastCompletion = new Date(sortedCompletions[0].completedAt!)
  lastCompletion.setHours(0, 0, 0, 0)

  const daysSinceLastCompletion = Math.floor((today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceLastCompletion > 1) return 0
  if (daysSinceLastCompletion === 1) {
    streak = 1
  }

  for (let i = 0; i < sortedCompletions.length - 1; i++) {
    const current = new Date(sortedCompletions[i].completedAt!)
    const next = new Date(sortedCompletions[i + 1].completedAt!)

    current.setHours(0, 0, 0, 0)
    next.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      streak++
    } else if (daysDiff > 1) {
      break
    }
  }

  return streak
}

export function checkAchievements(
  totalCompletions: number,
  currentStreak: number,
  existingAchievements: Achievement[],
): Achievement[] {
  const newAchievements: Achievement[] = []

  ACHIEVEMENT_DEFINITIONS.forEach((def) => {
    const alreadyUnlocked = existingAchievements.some((a) => a.id === def.id && a.unlocked)
    if (alreadyUnlocked) return

    let shouldUnlock = false

    if (def.category === "completion") {
      shouldUnlock = totalCompletions >= def.requirement
    } else if (def.category === "streak") {
      shouldUnlock = currentStreak >= def.requirement
    }

    if (shouldUnlock) {
      newAchievements.push({
        ...def,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      })
    }
  })

  return newAchievements
}

export function getStreakEmoji(streak: number): string {
  if (streak === 0) return "⚪"
  if (streak < 3) return "🔥"
  if (streak < 7) return "💥"
  if (streak < 14) return "✨"
  if (streak < 30) return "🌟"
  return "👑"
}
