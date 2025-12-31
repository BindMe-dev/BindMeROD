import { redirect } from "next/navigation"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle, Users, Clock, ArrowRight, FileText, Zap } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Redirecting...
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
            Welcome to <span className="text-blue-400">BindMe</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 px-4">
            Create, sign, and manage legally binding agreements with ease. 
            Secure, transparent, and designed for the modern world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Sign In
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto border-blue-400 text-blue-400 hover:bg-blue-400/10 px-8 py-6 text-lg"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16 sm:mt-24">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <Shield className="w-10 h-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Secure & Legal</CardTitle>
              <CardDescription className="text-slate-400">
                Legally binding agreements with blockchain verification
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <Zap className="w-10 h-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Fast & Easy</CardTitle>
              <CardDescription className="text-slate-400">
                Create and sign agreements in minutes, not days
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <Users className="w-10 h-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Collaborative</CardTitle>
              <CardDescription className="text-slate-400">
                Share, negotiate, and sign with multiple parties
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <FileText className="w-10 h-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Transparent</CardTitle>
              <CardDescription className="text-slate-400">
                Complete audit trail and version history
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
