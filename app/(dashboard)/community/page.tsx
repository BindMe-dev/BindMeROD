import { Metadata } from "next"
import { Leaderboard } from "@/components/leaderboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Award, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Community - BindMe",
  description: "Join the BindMe community and compete on the leaderboard",
}

export default function CommunityPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Community
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with thousands of professionals using BindMe
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5,000+</div>
              <p className="text-xs text-muted-foreground">
                Growing every day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agreements Created</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10,000+</div>
              <p className="text-xs text-muted-foreground">
                This month alone
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,500+</div>
              <p className="text-xs text-muted-foreground">
                Achievements unlocked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Leaderboard />

        {/* Community Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Why Join the Community?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">🏆 Compete & Win</h3>
                <p className="text-sm text-muted-foreground">
                  Climb the leaderboard and earn exclusive rewards and recognition
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">🎁 Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock badges, discounts, and premium features through achievements
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">🤝 Network</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with professionals and build your reputation
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">📈 Grow Together</h3>
                <p className="text-sm text-muted-foreground">
                  Learn from top performers and improve your agreement skills
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
          <h3 className="text-2xl font-bold mb-2">Ready to Make Your Mark?</h3>
          <p className="text-muted-foreground mb-6">
            Start creating agreements, referring friends, and unlocking achievements today!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/agreements/new"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
            >
              Create Agreement
            </a>
            <a
              href="/referrals"
              className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
            >
              Get Referral Link
            </a>
            <a
              href="/achievements"
              className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
            >
              View Achievements
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

