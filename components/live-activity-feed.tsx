"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, FileText, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: "created" | "completed"
  agreementType: string
  userName: string
  location: string
  timestamp: string
}

interface ActivityStats {
  totalAgreements: number
  thisWeek: number
  totalUsers: number
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<ActivityStats>({
    totalAgreements: 0,
    thisWeek: 0,
    totalUsers: 0,
  })
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Fetch initial data
    fetchActivity()

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activities.length === 0) return

    // Rotate through activities every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [activities.length])

  async function fetchActivity() {
    try {
      const response = await fetch("/api/activity")
      const data = await response.json()
      setActivities(data.activities || [])
      setStats(data.stats || { totalAgreements: 0, thisWeek: 0, totalUsers: 0 })
    } catch (error) {
      console.error("Failed to fetch activity:", error)
    }
  }

  if (activities.length === 0) return null

  const currentActivity = activities[currentIndex]

  return (
    <div className="space-y-6">
      {/* Live Activity Ticker */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-medium text-slate-300">Live Activity</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentActivity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3">
              <div className={`mt-1 p-2 rounded-lg ${
                currentActivity.type === "completed" 
                  ? "bg-green-500/10 text-green-400" 
                  : "bg-blue-500/10 text-blue-400"
              }`}>
                {currentActivity.type === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <span className="font-semibold">{currentActivity.userName}</span>
                  {currentActivity.type === "completed" ? " completed a " : " created a "}
                  <span className="font-semibold text-blue-400">{currentActivity.agreementType}</span>
                </p>
                
                <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{currentActivity.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(currentActivity.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center justify-center space-x-1 mt-3">
          {activities.slice(0, 5).map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex % 5
                  ? "w-4 bg-blue-500"
                  : "w-1 bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-white">
            {stats.thisWeek.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Agreements this week
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-white">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Active users
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-white">
            {stats.totalAgreements.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Total agreements
          </div>
        </div>
      </div>
    </div>
  )
}

