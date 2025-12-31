import { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, agreements, userBadges } from "@/lib/db/schema"
import { eq, count, and, desc } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, Award, FileText, Users } from "lucide-react"
import { BADGES } from "@/lib/gamification-types"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, params.username))
    .limit(1)

  if (!user.length) {
    return {
      title: "User Not Found - BindMe",
    }
  }

  return {
    title: `${user[0].name} - BindMe Profile`,
    description: `View ${user[0].name}'s professional profile on BindMe`,
    openGraph: {
      title: `${user[0].name} on BindMe`,
      description: `Professional agreements and verified identity`,
      type: "profile",
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Get user data
  const userData = await db
    .select({
      id: users.id,
      name: users.name,
      isVerified: users.isVerified,
      verifiedAt: users.verifiedAt,
      createdAt: users.createdAt,
      publicProfile: users.publicProfile,
    })
    .from(users)
    .where(eq(users.id, params.username))
    .limit(1)

  if (!userData.length) {
    notFound()
  }

  const user = userData[0]

  // Check if profile is public
  const publicProfile = user.publicProfile as any
  if (!publicProfile?.isPublic) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">This profile is private</h1>
        <p className="text-muted-foreground">
          This user has chosen to keep their profile private.
        </p>
      </div>
    )
  }

  // Get stats
  const [agreementStats, badgeStats] = await Promise.all([
    db
      .select({ count: count() })
      .from(agreements)
      .where(eq(agreements.userId, user.id)),
    db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, user.id))
      .orderBy(desc(userBadges.unlockedAt))
      .limit(6),
  ])

  const totalAgreements = agreementStats[0]?.count || 0
  const badges = badgeStats.map((b) => BADGES[b.badgeId as keyof typeof BADGES]).filter(Boolean)

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  {user.isVerified && (
                    <CheckCircle className="h-6 w-6 text-blue-500" title="Verified User" />
                  )}
                </div>

                {publicProfile?.bio && (
                  <p className="text-muted-foreground mb-4">{publicProfile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{totalAgreements} agreements</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{badges.length} badges</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Member since {new Date(user.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        {badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>Badges earned on BindMe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center text-center p-4 border rounded-lg"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="font-semibold text-sm">{badge.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {badge.rarity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Trust & Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Identity Verified</span>
              {user.isVerified ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline">Not Verified</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Agreements Completed</span>
              <Badge variant="outline">{totalAgreements}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Member Since</span>
              <Badge variant="outline">
                {new Date(user.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
          <h3 className="font-semibold mb-2">Want your own professional profile?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join BindMe and create legally binding agreements in minutes
          </p>
          <a
            href="/signup"
            className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  )
}

