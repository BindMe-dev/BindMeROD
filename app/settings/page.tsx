"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAgreements } from '@/lib/agreement-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Settings, Shield, User, Bell, ArrowLeft, MapPin, Phone, Calendar, Mail, Eye, EyeOff } from 'lucide-react'
import { IdentityVerification } from '@/components/identity-verification'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { agreements } = useAgreements()
  const isIdentityVerified = !!(user?.verificationType || user?.verifiedName)
  const router = useRouter()
  const [isEditing] = useState(true)
  const [streetAddress, setStreetAddress] = useState("")
  const [city, setCity] = useState("")
  const [county, setCounty] = useState("")
  const [postcode, setPostcode] = useState("")
  const [country, setCountry] = useState("")
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")
  const [occupation, setOccupation] = useState("")
  const [company, setCompany] = useState("")
  const [bio, setBio] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [notificationsError, setNotificationsError] = useState("")
  const defaultAgreementSettings = {
    creation: true,
    update: true,
    withdrawal: true,
    deletion: true,
    witnessSignature: true,
    counterpartySignature: true,
    requestCompletion: true,
    rejectCompletion: true,
    disputeRejection: true,
    legalResolution: true,
  }
  const [agreementNotifications, setAgreementNotifications] = useState<Record<string, boolean>>(defaultAgreementSettings)
  const [showSecurityPassword, setShowSecurityPassword] = useState(false)

  const inputClass =
    'bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary'
  const readOnlyClass =
    'text-sm text-slate-200 p-3 bg-slate-900/70 border border-slate-800 rounded-md min-h-[42px]'
  const sectionPanelClass =
    'rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-4 shadow-sm'
  const sectionHeadingClass = 'text-lg font-semibold flex items-center gap-2 text-white'
  const whiteButton = 'bg-white text-slate-900 hover:bg-slate-200'

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setMiddleName(user.middleName || "")
      setLastName(user.lastName || "")
      setDateOfBirth(user.dateOfBirth || "")
      setStreetAddress(user.address || "")
      setCity(user.city || "")
      setCounty(user.county || "")
      setPostcode(user.postcode || "")
      setCountry(user.country || "")
      const profile = user.publicProfile || {}
      setPhoneNumber((profile as any).phoneNumber || "")
      setEmergencyContact((profile as any).emergencyContact || "")
      setOccupation((profile as any).occupation || "")
      setCompany((profile as any).company || "")
      setBio((profile as any).bio || "")
      const notif = (user.preferences as any)?.agreementNotificationSettings
      setAgreementNotifications({
        ...defaultAgreementSettings,
        ...(notif || {}),
      })
    }
  }, [user])

  useEffect(() => {
    if (!streetAddress || streetAddress.length < 3) {
      setAddressSuggestions([])
      return
    }
    const controller = new AbortController()
    const fetchAddresses = async () => {
      setIsSearchingAddress(true)
      try {
        const res = await fetch(`/api/address/search?query=${encodeURIComponent(streetAddress)}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          setAddressSuggestions([])
          return
        }
        const data = await res.json()
        setAddressSuggestions(data.results || [])
      } catch {
        setAddressSuggestions([])
      } finally {
        setIsSearchingAddress(false)
      }
    }
    const t = setTimeout(fetchAddresses, 250)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [streetAddress])

  const saveProfile = async () => {
    setSaveError("")
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          streetAddress,
          city,
          county,
          postcode,
          country,
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          phoneNumber,
          emergencyContact,
          occupation,
          company,
          bio,
          preferences: {
            agreementNotificationSettings: agreementNotifications,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile")
      }
      if (data.user) {
        setFirstName(data.user.firstName || "")
        setMiddleName(data.user.middleName || "")
        setLastName(data.user.lastName || "")
        setDateOfBirth(data.user.dateOfBirth || "")
        setStreetAddress(data.user.address || "")
        setCity(data.user.city || "")
        setCounty(data.user.county || "")
        setPostcode(data.user.postcode || "")
        setCountry(data.user.country || "")
        const profile = data.user.publicProfile || {}
        setPhoneNumber((profile as any).phoneNumber || "")
        setEmergencyContact((profile as any).emergencyContact || "")
        setOccupation((profile as any).occupation || "")
        setCompany((profile as any).company || "")
        setBio((profile as any).bio || "")
      }
      await refreshUser()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile")
    }
  }

  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => {
      saveProfile()
    }, 800)
    return () => clearTimeout(t)
  }, [
    user,
    streetAddress,
    city,
    county,
    postcode,
    country,
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    phoneNumber,
    emergencyContact,
    occupation,
    company,
    bio,
    agreementNotifications,
  ])

  const handleDeleteAccount = async () => {
    setDeleteError("")
    try {
      const res = await fetch("/api/users/me", { method: "DELETE", credentials: "include" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete account")
      }
      router.push("/login?deleted=1")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account")
    }
  }

  const toggleAgreementNotification = async (key: string, value: boolean) => {
    setNotificationsError("")
    const next = { ...agreementNotifications, [key]: value }
    setAgreementNotifications(next)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agreementNotificationSettings: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save notification settings")
      }
      await refreshUser()
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : "Failed to save notification settings")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to access settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">


      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6 text-white">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 items-center bg-slate-900/70 border border-slate-800 gap-2 px-2 py-[6px] rounded-xl">
            <TabsTrigger
              value="profile"
              className="h-8 flex items-center justify-center gap-2 text-slate-300 rounded-lg leading-[0.9] data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="h-8 flex items-center justify-center gap-2 text-slate-300 rounded-lg leading-[0.9] data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <Shield className="w-4 h-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="h-8 flex items-center justify-center gap-2 text-slate-300 rounded-lg leading-[0.9] data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="h-8 flex items-center justify-center gap-2 text-slate-300 rounded-lg leading-none data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-slate-900/80 border border-slate-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <CardTitle className="text-white">Profile Information</CardTitle>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {saveError ? (
                    <span className="text-sm text-red-300">{saveError}</span>
                  ) : (
                    <span className="text-sm text-slate-400">Auto-saving…</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={sectionPanelClass}>
                  <h3 className={sectionHeadingClass}>
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-200">
                        First Name
                      </Label>
                      {isEditing ? (
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                      ) : (
                        <p className={readOnlyClass}>{firstName || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-200">
                        Last Name
                      </Label>
                      {isEditing ? (
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                      ) : (
                        <p className={readOnlyClass}>{lastName || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName" className="text-slate-200">
                        Middle Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="middleName"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="Optional"
                          className={inputClass}
                        />
                      ) : (
                        <p className={readOnlyClass}>{middleName || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-slate-200">
                        <Calendar className="w-4 h-4" />
                        Date of Birth
                      </Label>
                      {isEditing ? (
                        <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
                      ) : (
                        <p className={readOnlyClass}>{dateOfBirth || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-slate-200">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <p className={readOnlyClass}>{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className={sectionPanelClass}>
                  <h3 className={sectionHeadingClass}>
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="streetAddress" className="text-slate-200">
                        Street Address
                      </Label>
                      {isEditing ? (
                        <div className="relative">
                          <Input
                            id="streetAddress"
                            placeholder="123 Main Street, City"
                            className={inputClass}
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            autoComplete="off"
                          />
                          {isSearchingAddress && (
                            <div className="absolute right-3 top-2 text-xs text-slate-400">Searching...</div>
                          )}
                          {addressSuggestions.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-800 bg-slate-900 shadow-lg max-h-56 overflow-auto">
                              {addressSuggestions.map((s) => (
                                <button
                                  type="button"
                                  key={s.id}
                                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                                  onClick={() => {
                                    setStreetAddress(s.street || s.label || "")
                                    setCity(s.city || city)
                                    setCounty(s.county || county)
                                    setPostcode(s.postcode || postcode)
                                    setCountry(s.country || country || "United Kingdom")
                                    setAddressSuggestions([])
                                  }}
                                >
                                  <div className="font-medium">{s.street || s.label}</div>
                                  <div className="text-xs text-slate-400">
                                    {[s.city, s.county, s.postcode, s.country].filter(Boolean).join(" | ")}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={readOnlyClass}>{streetAddress || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-200">
                        City
                      </Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          placeholder="London"
                          className={inputClass}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      ) : (
                        <p className={readOnlyClass}>{city || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county" className="text-slate-200">
                        County/State
                      </Label>
                      {isEditing ? (
                        <Input
                          id="county"
                          placeholder="Greater London"
                          className={inputClass}
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                        />
                      ) : (
                        <p className={readOnlyClass}>{county || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="text-slate-200">
                        Postcode
                      </Label>
                      {isEditing ? (
                        <Input
                          id="postcode"
                          placeholder="SW1A 1AA"
                          className={inputClass}
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          autoComplete="postal-code"
                        />
                      ) : (
                        <p className={readOnlyClass}>{postcode || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-slate-200">
                        Country
                      </Label>
                      {isEditing ? (
                        <Input
                          id="country"
                          placeholder="United Kingdom"
                          className={inputClass}
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      ) : (
                        <p className={readOnlyClass}>{country || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={sectionPanelClass}>
                  <h3 className={sectionHeadingClass}>
                    <Phone className="w-5 h-5" />
                    Contact Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-slate-200">
                        Phone Number
                      </Label>
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-3 h-10 text-slate-200">
                            <span className="font-semibold">+44</span>
                            <span className="text-xs text-slate-400">(UK)</span>
                          </div>
                          <Input
                            id="phoneNumber"
                            inputMode="numeric"
                            pattern="\\d{10}"
                            maxLength={10}
                            placeholder="10 digit number"
                            className={inputClass}
                            value={phoneNumber}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\\D/g, "").slice(0, 10)
                              setPhoneNumber(digitsOnly)
                            }}
                          />
                          <Button
                            type="button"
                            className="bg-[#00b050] hover:bg-[#00c45a] text-white shadow-lg shadow-green-500/30 px-4 h-10 rounded-lg text-sm font-semibold"
                            onClick={() => {}}
                          >
                            Verify
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className={readOnlyClass}>{phoneNumber ? `+44 ${phoneNumber}` : 'Not provided'}</p>
                          <Button
                            type="button"
                            className="bg-[#00b050] hover:bg-[#00c45a] text-white shadow-lg shadow-green-500/30 px-3 h-9 rounded-lg text-xs font-semibold"
                            onClick={() => {}}
                          >
                            Verify
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact" className="text-slate-200">
                        Emergency Contact
                      </Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-3 h-10 text-slate-200">
                            <span className="font-semibold">+44</span>
                            <span className="text-xs text-slate-400">(UK)</span>
                          </div>
                          <Input
                            id="emergencyContact"
                            inputMode="numeric"
                            pattern="\\d{10}"
                            maxLength={10}
                            placeholder="10 digit number"
                            className={inputClass}
                            value={emergencyContact}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\\D/g, "").slice(0, 10)
                              setEmergencyContact(digitsOnly)
                            }}
                          />
                        </div>
                      ) : (
                        <p className={readOnlyClass}>{emergencyContact ? `+44 ${emergencyContact}` : 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={sectionPanelClass}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white">Professional Information</h3>
                    <Button
                      type="button"
                      className="bg-[#00b050] hover:bg-[#00c45a] text-white shadow-lg shadow-green-500/30 px-4 py-2 h-10 rounded-lg text-sm font-semibold"
                      onClick={() => {}}
                    >
                      Verify Job
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-slate-200">
                        Occupation
                      </Label>
                      {isEditing ? (
                        <Input
                          id="occupation"
                          placeholder="Software Developer"
                          className={inputClass}
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                        />
                      ) : (
                        <p className={readOnlyClass}>{occupation || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-slate-200">
                        Company
                      </Label>
                      {isEditing ? (
                        <Input
                          id="company"
                          placeholder="Tech Corp Ltd"
                          className={inputClass}
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      ) : (
                        <p className={readOnlyClass}>{company || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio" className="text-slate-200">
                        Bio
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className={`${inputClass} min-h-[120px]`}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        />
                      ) : (
                        <p className={`${readOnlyClass} min-h-[80px]`}>{bio || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={sectionPanelClass}>
                  <h3 className="text-lg font-semibold text-white">Account Status</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Verification Status</Label>
                      <div>
                        <Badge className={isIdentityVerified ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                          {isIdentityVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Agreement Count</Label>
                      <p className={readOnlyClass}>
                        {(agreements?.length ?? user.agreementCount ?? 0)} agreements
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Verified Name</Label>
                      <p className={readOnlyClass}>
                        {isIdentityVerified ? (user.verifiedName || 'N/A') : 'Not verified'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Member Since</Label>
                      <p className={readOnlyClass}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                    {deleteError && <span className="text-sm text-red-300">{deleteError}</span>}
                  </div>
                  <p className="text-sm text-red-200">
                    Deleting your account is permanent. You cannot delete while you have open agreements. Completed agreements will retain audit trails with your signatures, but your login and profile will be removed.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Type DELETE to confirm</Label>
                    <Input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                      className="bg-slate-900/80 border-red-800 text-white placeholder:text-slate-500 focus-visible:border-red-500 focus-visible:ring-red-500/40"
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={deleteConfirm !== "DELETE"}
                        className="w-full sm:w-auto"
                      >
                        Delete account permanently
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border border-slate-700 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-300">
                          This action cannot be undone. Your login and profile will be removed. Open agreements must be closed first.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleDeleteAccount}
                        >
                          Confirm delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <Card className="bg-slate-900/70 border border-slate-800">
              <CardContent>
                <IdentityVerification />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-slate-900/70 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Email Notifications</CardTitle>
                {notificationsError && <p className="text-sm text-red-300 mt-1">{notificationsError}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "creation", title: "Agreement Creation", description: "Notify when a new agreement is created" },
                  { key: "update", title: "Agreement Updates", description: "Notify when agreement details are updated" },
                  { key: "withdrawal", title: "Agreement Withdrawal", description: "Notify when an agreement is withdrawn" },
                  { key: "deletion", title: "Agreement Deletion", description: "Notify when an agreement is deleted" },
                  { key: "witnessSignature", title: "Witness Signature", description: "Notify when a witness signs" },
                  { key: "counterpartySignature", title: "Counterparty Signature", description: "Notify when a counterparty signs" },
                  { key: "requestCompletion", title: "Completion Requested", description: "Notify when completion is requested" },
                  { key: "rejectCompletion", title: "Completion Rejected", description: "Notify when a completion request is rejected" },
                  { key: "disputeRejection", title: "Dispute/Rejection", description: "Notify when a dispute or rejection occurs" },
                  { key: "legalResolution", title: "Legal Resolution", description: "Notify when legal resolution is triggered" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                    <Switch
                      checked={agreementNotifications[item.key]}
                      onCheckedChange={(checked) => toggleAgreementNotification(item.key, Boolean(checked))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-900/70 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={sectionPanelClass}>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Password</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Input
                          type={showSecurityPassword ? "text" : "password"}
                          value="**********"
                          readOnly
                          className={`${inputClass} flex-1 select-none pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecurityPassword((v) => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
                          aria-label={showSecurityPassword ? "Hide password" : "Show password"}
                        >
                          {showSecurityPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button variant="outline" className={whiteButton}>
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
                <div className={sectionPanelClass}>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Two-Factor Authentication</Label>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <p className="text-sm text-slate-400">Add an extra layer of security</p>
                      <Button variant="outline" className={whiteButton}>
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
                <div className={sectionPanelClass}>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Login Sessions</Label>
                    <div className="p-4 bg-slate-900/70 rounded-lg border border-slate-800 text-slate-300">
                      <p className="text-sm">Current session: Windows • Chrome</p>
                      <p className="text-xs text-slate-400">Last login: Today at {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
