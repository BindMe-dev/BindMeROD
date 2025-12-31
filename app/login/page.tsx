"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn as oauthSignIn } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { validatePasswordStrength } from "@/lib/security/password-security"
import { storeReferralCode } from "@/lib/viral-client-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.04 12.261c0-.815-.073-1.595-.209-2.348H12v4.44h6.193c-.267 1.44-1.078 2.66-2.297 3.478v2.89h3.708c2.168-1.994 3.436-4.93 3.436-8.46z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.956-1.073 7.941-2.92l-3.708-2.89c-1.032.69-2.356 1.1-4.233 1.1-3.252 0-6.004-2.194-6.988-5.148H1.18v3.04C3.153 21.316 7.246 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.012 14.142c-.232-.69-.364-1.426-.364-2.142s.132-1.452.364-2.142v-3.04H1.18A11.962 11.962 0 0 0 0 12c0 1.93.46 3.754 1.18 5.182z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.761 0 3.337.605 4.58 1.794l3.43-3.43C17.956 1.073 15.24 0 12 0 7.246 0 3.153 2.684 1.18 6.818l3.832 3.04C5.996 6.944 8.748 4.75 12 4.75z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof validatePasswordStrength> | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const nextStep = () => setCurrentStep((step) => Math.min(step + 1, 3))
  const prevStep = () => setCurrentStep((step) => Math.max(step - 1, 1))

  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams?.get("ref")
    if (ref) {
      storeReferralCode(ref)
      // Track the referral click
      fetch("/api/referrals/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ref }),
      }).catch(console.error)
    }
  }, [searchParams])

  // Auto-generate username when names change
  const handleNameChange = (field: 'first' | 'last', value: string) => {
    if (field === 'first') setFirstName(value)
    if (field === 'last') setLastName(value)
  }

  const canProceedToStep2 = firstName.trim() && lastName.trim()
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
  const canProceedToStep3 =
    identifier.trim() &&
    password.trim() &&
    confirmPassword.trim() &&
    dateOfBirth.trim() &&
    emailStatus !== "taken" &&
    emailIsValid &&
    password === confirmPassword

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age : ""
  }
  const age = calculateAge(dateOfBirth)

  // Quick email availability check
  useEffect(() => {
    if (!isSignUp) return
    if (!identifier.trim()) {
      setEmailStatus("idle")
      return
    }
    if (!emailIsValid) {
      setEmailStatus("idle")
      return
    }
    let active = true
    setEmailStatus("checking")
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(identifier.trim())}`)
        if (!active) return
        if (!res.ok) throw new Error()
        const data = await res.json()
        setEmailStatus(data.available ? "available" : "taken")
      } catch {
        if (active) setEmailStatus("idle")
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [identifier, isSignUp, emailIsValid])

  // Password strength validation
  useEffect(() => {
    if (!isSignUp || !password) {
      setPasswordStrength(null)
      return
    }
    setPasswordStrength(validatePasswordStrength(password))
  }, [password, isSignUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    console.log("[LOGIN] Form submitted", { isSignUp, identifier, hasPassword: !!password })

    if (!emailIsValid) {
      setEmailTouched(true)
      return
    }

    setIsLoading(true)
    console.log("[LOGIN] Starting authentication process")

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setIsLoading(false)
          return
        }
        console.log("[LOGIN] Attempting signup")
        await signUp(identifier, password, firstName, middleName, lastName, dateOfBirth)
        console.log("[LOGIN] Signup successful, redirecting to verify-email")
        router.push(`/verify-email?email=${encodeURIComponent(identifier)}`)
        return
      } else {
        console.log("[LOGIN] Attempting signin")
        await signIn(identifier, password)
        console.log("[LOGIN] Signin successful, waiting for session to establish...")
        // Wait a moment for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log("[LOGIN] Redirecting based on role")
        try {
          const res = await fetch("/api/admin", { credentials: "include" })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.isAdmin) {
            window.location.href = "/admin"
            return
          }
        } catch (e) {
          console.warn("Admin check failed, falling back to dashboard", e)
        }
        // Default to dashboard for non-admins or if check fails
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("[LOGIN] Authentication error:", err)
      const errorMessage = err instanceof Error ? err.message : "Authentication failed"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      console.log("[LOGIN] Authentication process completed")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="absolute top-6 left-6 z-50">
        <Button
          variant="ghost"
          onClick={() => {
            console.log("Back to Home clicked")
            router.push("/")
          }}
          className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6 sm:px-6">
        <Card className="w-full max-w-md sm:max-w-lg bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                {isSignUp ? "Start tracking your agreements today" : "Sign in to manage your agreements"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isSignUp && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === currentStep
                            ? 'bg-blue-600 text-white'
                            : step < currentStep
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                    {step < currentStep ? '✓' : step}
                  </div>
                ))}
              </div>
              <span className="text-sm text-slate-400 hidden sm:inline">Step {currentStep} of 3</span>
            </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp ? (
                <>
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Tell us your name</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => handleNameChange('first', e.target.value)}
                            required
                            placeholder="John"
                            className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => handleNameChange('last', e.target.value)}
                            required
                            placeholder="Doe"
                            className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName" className="text-slate-300">Middle Name (optional)</Label>
                        <Input
                          id="middleName"
                          type="text"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="William"
                          className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceedToStep2}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 py-6 text-lg font-semibold"
                      >
                        Continue
                      </Button>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Account details</h3>
                      <div className="space-y-2">
                        <Label htmlFor="identifier" className="text-slate-300">Email *</Label>
                        <Input
                          id="identifier"
                          type="email"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value)
                            if (emailTouched) setEmailTouched(false)
                          }}
                          required
                          placeholder="you@example.com"
                          className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                        {identifier && emailIsValid && (
                          <p
                            className={`text-sm ${
                              emailStatus === "taken"
                                ? "text-red-400"
                                : emailStatus === "available"
                                ? "text-green-400"
                                : "text-slate-400"
                            }`}
                          >
                            {emailStatus === "checking"
                              ? "Checking availability..."
                              : emailStatus === "taken"
                              ? "Email already in use"
                              : emailStatus === "available"
                              ? "Email is available"
                              : ""}
                          </p>
                        )}
                        {emailTouched && !emailIsValid && (
                          <p className="text-sm text-red-400">
                            Please enter a valid email address (e.g., name@example.com)
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Password *</Label>
                        <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="********"
                        className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-700 hover:text-slate-900 bg-white/80 rounded px-2"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                        className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-700 hover:text-slate-900 bg-white/80 rounded px-2"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                        {confirmPassword && confirmPassword !== password && (
                          <p className="text-xs text-red-400">Passwords must match.</p>
                        )}
                        {password && passwordStrength && (
                          <div className="mt-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${
                                passwordStrength.isValid ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className={`text-sm font-medium ${
                                passwordStrength.isValid ? 'text-green-400' : 'text-red-400'
                              }`}>
                                Password {passwordStrength.isValid ? 'meets requirements' : 'requirements'}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className={`flex items-center gap-2 ${
                                password.length >= 12 ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {password.length >= 12 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                <span>At least 12 characters</span>
                              </div>
                              <div className={`flex items-center gap-2 ${
                                /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                <span>Uppercase, lowercase, and numbers</span>
                              </div>
                              <div className={`flex items-center gap-2 ${
                                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                <span>Special characters (!@#$%^&*)</span>
                              </div>
                              <div className={`flex items-center gap-2 ${
                                !passwordStrength.feedback.some(f => f.includes('common')) ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {!passwordStrength.feedback.some(f => f.includes('common')) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                <span>Not a common password</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-slate-300">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          required
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]}
                          className="bg-slate-800 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Terms &amp; Data Collection</Label>
                        <ScrollArea className="h-32 w-full rounded-md bg-slate-800/60 border border-slate-700 p-3 text-sm text-slate-300">
                          <p className="mb-2 font-semibold text-slate-100">By continuing you agree to:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>BindMe Terms of Service and Privacy Policy.</li>
                            <li>Collection of your name, email, and date of birth to create and verify your account.</li>
                            <li>Storage of agreement activity (signatures, timestamps, IP/device metadata) to build an audit trail.</li>
                            <li>Optional evidence you upload (files/photos) tied to agreements, retained for legal records.</li>
                            <li>Reminder and notification delivery to the email you provide.</li>
                          </ul>
                          <p className="mt-2 text-slate-400">You can request data access or deletion anytime via support.</p>
                        </ScrollArea>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="flex-1 border-slate-600 bg-white text-slate-900 hover:bg-slate-200 hover:text-slate-900"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (!emailIsValid) {
                              setEmailTouched(true)
                              return
                            }
                            nextStep()
                          }}
                          disabled={
                            !identifier.trim() ||
                            !password.trim() ||
                            !confirmPassword.trim() ||
                            password !== confirmPassword ||
                            !dateOfBirth.trim() ||
                            emailStatus === "taken"
                          }
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Review & Create</h3>
                      <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                        <p className="text-sm text-slate-300"><strong>Name:</strong> {firstName} {middleName} {lastName}</p>
                        <p className="text-sm text-slate-300"><strong>Email:</strong> {identifier}</p>
                        <p className="text-sm text-slate-300">
                          <strong>Date of Birth:</strong> {dateOfBirth || "Not set"}
                          {age !== "" && dateOfBirth ? ` (${age} years old)` : ""}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="flex-1 border-slate-600 bg-white text-slate-900 hover:bg-slate-200 hover:text-slate-900"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                        >
                          {isLoading ? "Creating..." : "Create Account"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-slate-300">Email</Label>
                    <Input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value)
                        if (emailTouched) setEmailTouched(false)
                      }}
                      required
                      placeholder="you@example.com"
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    {emailTouched && !emailIsValid && (
                      <p className="text-sm text-red-400">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="********"
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-red-400 flex-1">{error}</p>
                        {(error.includes("Invalid credentials") || error.includes("verify your email")) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsSignUp(true)
                              setCurrentStep(1)
                              setError("")
                              setEmailTouched(false)
                              setFirstName("")
                              setMiddleName("")
                              setLastName("")
                              setIdentifier("")
                              setPassword("")
                              setDateOfBirth("")
                            }}
                            className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 text-xs bg-white border border-red-300 hover:border-red-400 rounded px-2 py-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Sign Up
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 py-6 text-lg font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Sign In"}
                  </Button>
                </>
              )}

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-sm text-slate-400">or continue with</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => oauthSignIn("google", { callbackUrl: "/dashboard" })}
                >
                  <GoogleIcon />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => oauthSignIn("apple", { callbackUrl: "/dashboard" })}
                >
                  <AppleIcon />
                  Apple
                </Button>
              </div>

              <p className="text-center text-sm text-slate-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError("")
                      setEmailTouched(false)
                      setFirstName("")
                      setMiddleName("")
                      setLastName("")
                      setIdentifier("")
                      setPassword("")
                    }}
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>

              {!isSignUp && (
                <p className="text-center text-sm text-slate-400">
                  Forgot your password?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
                  >
                    Reset it here
                  </button>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
