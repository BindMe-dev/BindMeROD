"use client"

import { useEffect, useState } from "react"
import { Trophy, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
}

interface AchievementToastProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-2xl p-4 pr-12 min-w-[320px] max-w-md border-2 border-yellow-400">
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onClose, 300)
              }}
              className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2 shrink-0">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg mb-1">Achievement Unlocked!</div>
                <div className="font-semibold">{achievement.name}</div>
                <div className="text-sm text-white/90 mt-1">{achievement.description}</div>
              </div>
            </div>

            {/* Animated sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100 + "%",
                    y: "100%",
                    opacity: 0,
                  }}
                  animate={{
                    y: "-20%",
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to manage achievement notifications
export function useAchievementNotifications() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [queue, setQueue] = useState<Achievement[]>([])

  useEffect(() => {
    if (!currentAchievement && queue.length > 0) {
      setCurrentAchievement(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [currentAchievement, queue])

  const showAchievement = (achievement: Achievement) => {
    if (currentAchievement) {
      setQueue((prev) => [...prev, achievement])
    } else {
      setCurrentAchievement(achievement)
    }
  }

  const clearAchievement = () => {
    setCurrentAchievement(null)
  }

  return {
    currentAchievement,
    showAchievement,
    clearAchievement,
  }
}

