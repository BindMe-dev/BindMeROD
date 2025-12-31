"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Mail, Clock } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams?.get("email") || ""

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                We've sent a verification link to your email
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-400">🎉 Congratulations!</p>
                  <p className="text-sm text-green-300">
                    An activation email has been sent to you! Please check your inbox and click the verification link.
                  </p>
                  <div className="text-center mt-4">
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Check your inbox (and spam folder)</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Click the verification link to activate your account</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>The link will expire in 24 hours</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-300">
                <strong>Important:</strong> You must verify your email before you can access your BindMe account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
