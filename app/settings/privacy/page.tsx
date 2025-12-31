"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Trash2, Shield, AlertCircle, CheckCircle } from "lucide-react"

export default function PrivacySettingsPage() {
  const [consent, setConsent] = useState({
    marketing: false,
    analytics: true,
    thirdParty: false,
  })
  const [confirmEmail, setConfirmEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleExportData = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/gdpr/export")
      
      if (!res.ok) {
        throw new Error("Export failed")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bindme-data-export-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({ type: "success", text: "Data exported successfully" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to export data" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmEmail,
          deleteType: "anonymize",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Deletion failed")
      }

      setMessage({ type: "success", text: data.message })
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete account" })
    } finally {
      setLoading(false)
      setConfirmEmail("")
    }
  }

  const handleUpdateConsent = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/gdpr/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consent),
      })

      if (!res.ok) {
        throw new Error("Update failed")
      }

      setMessage({ type: "success", text: "Preferences updated successfully" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update preferences" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy & Data</h1>
          <p className="text-slate-400">Manage your data and privacy preferences</p>
        </div>

        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className={
              message.type === "error"
                ? "bg-red-500/10 border-red-500/50"
                : "bg-green-500/10 border-green-500/50"
            }
          >
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Consent Management */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Preferences
            </CardTitle>
            <CardDescription>Control how we use your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marketing Communications</Label>
                <p className="text-sm text-slate-400">Receive updates and promotional emails</p>
              </div>
              <Switch
                id="marketing"
                checked={consent.marketing}
                onCheckedChange={(checked) => setConsent({ ...consent, marketing: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analytics</Label>
                <p className="text-sm text-slate-400">Help us improve by sharing usage data</p>
              </div>
              <Switch
                id="analytics"
                checked={consent.analytics}
                onCheckedChange={(checked) => setConsent({ ...consent, analytics: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="thirdParty">Third-Party Sharing</Label>
                <p className="text-sm text-slate-400">Share data with trusted partners</p>
              </div>
              <Switch
                id="thirdParty"
                checked={consent.thirdParty}
                onCheckedChange={(checked) => setConsent({ ...consent, thirdParty: checked })}
              />
            </div>

            <Button onClick={handleUpdateConsent} disabled={loading} className="w-full">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Your Data
            </CardTitle>
            <CardDescription>Download all your data in JSON format (GDPR Right to Access)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportData} disabled={loading} variant="outline" className="w-full">
              {loading ? "Exporting..." : "Download My Data"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="bg-slate-900/80 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete or anonymize your account (GDPR Right to Erasure)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete My Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800">
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action will anonymize your account. Your agreements will be retained for legal
                    compliance, but your personal information will be removed.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirm your email to proceed</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!confirmEmail || loading}
                  >
                    {loading ? "Deleting..." : "Confirm Deletion"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

