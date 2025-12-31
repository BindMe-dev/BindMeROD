import { Metadata } from "next"
import { BadgesDashboard } from "@/components/badges-dashboard"

export const metadata: Metadata = {
  title: "Achievements - BindMe",
  description: "Track your progress and unlock badges",
}

export default function AchievementsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <BadgesDashboard />
    </div>
  )
}

