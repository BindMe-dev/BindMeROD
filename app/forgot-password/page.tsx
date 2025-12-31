"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => router.push("/login")}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Reset Password
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Enter your email to receive a password reset link
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="w-6 h-6 text-green-400 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-400">
                        {message.includes("didn't find") ? "Welcome to BindMe!" : "Reset Link Sent!"}
                      </p>
                      <p className="text-sm text-green-300">
                        {message}
                      </p>
                      {!message.includes("didn't find") && (
                        <div className="text-xs text-green-200 space-y-1">
                          <p>• Check your inbox (and spam folder)</p>
                          <p>• Click the reset link within <strong>30 minutes</strong></p>
                          <p>• The link can only be used once</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 py-6 text-lg font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/login")}
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}