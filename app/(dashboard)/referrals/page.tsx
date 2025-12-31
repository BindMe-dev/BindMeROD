import { Metadata } from "next"
import { ReferralDashboard } from "@/components/referral-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, Zap, Crown, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Referrals - BindMe",
  description: "Invite friends and earn rewards",
}

export default function ReferralsPage() {
  return (
    <div className="container mx-auto px-4 pt-2 pb-10 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Friends, Earn Rewards</h1>
          <p className="text-muted-foreground mt-2">
            Share BindMe with your network and unlock exclusive benefits
          </p>
        </div>

        {/* Referral Dashboard */}
        <ReferralDashboard />

        {/* Rewards Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Milestones</CardTitle>
            <CardDescription>
              Unlock bigger rewards as you refer more friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tier 1 */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">First Referral</h3>
                  <p className="text-sm text-muted-foreground">
                    You and your friend both get <strong>1 month premium free</strong>
                  </p>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">3 Referrals</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock <strong>25% lifetime discount</strong> on all plans
                  </p>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Crown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">5 Referrals</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock <strong>50% lifetime discount</strong> on all plans
                  </p>
                </div>
              </div>

              {/* Tier 4 */}
              <div className="flex items-start gap-4 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">10 Referrals</h3>
                  <p className="text-sm text-muted-foreground">
                    Get <strong>BindMe Premium FREE forever</strong> + custom branding
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm">
                <strong>Share your unique link</strong> with friends via email, WhatsApp, or social media
              </li>
              <li className="text-sm">
                <strong>They sign up</strong> using your link and create their first agreement
              </li>
              <li className="text-sm">
                <strong>You both get rewarded</strong> instantly with 1 month premium free
              </li>
              <li className="text-sm">
                <strong>Keep referring</strong> to unlock bigger rewards and discounts
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm">When do I get my reward?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Rewards are credited instantly when your friend signs up and creates their first agreement.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Do rewards expire?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Premium month rewards expire after 3 months if not used. Lifetime discounts never expire.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Can I refer unlimited people?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Yes! There's no limit to how many people you can refer. The more you refer, the better your rewards.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">What if my friend is already a user?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Referral rewards only apply to new users who sign up using your link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
