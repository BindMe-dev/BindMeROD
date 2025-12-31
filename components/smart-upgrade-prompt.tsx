"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Sparkles, Zap, Crown, Check } from "lucide-react"
import { useRouter } from "next/navigation"

export type UpgradePromptTrigger =
  | "agreement_limit"
  | "template_locked"
  | "export_locked"
  | "verification_locked"
  | "milestone_reached"
  | "feature_discovery"

interface SmartUpgradePromptProps {
  trigger: UpgradePromptTrigger
  open?: boolean
  onOpenChange?: (open: boolean) => void
  customMessage?: string
}

const PROMPT_CONFIGS = {
  agreement_limit: {
    icon: "📝",
    title: "You've Hit Your Free Limit!",
    description: "You've created 3 agreements. Upgrade to create unlimited agreements.",
    benefits: [
      "Unlimited agreements",
      "All premium templates",
      "Priority support",
      "Advanced features",
    ],
    cta: "Upgrade to Premium",
    urgency: "Limited time: 50% off first month!",
  },
  template_locked: {
    icon: "🔒",
    title: "Unlock Premium Templates",
    description: "This template is available for premium users only.",
    benefits: [
      "Access all 50+ templates",
      "AI-powered customization",
      "Legal expert review",
      "Unlimited agreements",
    ],
    cta: "Unlock All Templates",
    urgency: "Join 5,000+ professionals using BindMe Premium",
  },
  export_locked: {
    icon: "📄",
    title: "Export Your Agreements",
    description: "Export to PDF, Word, and more with Premium.",
    benefits: [
      "Export to PDF, Word, Excel",
      "Custom branding",
      "Bulk export",
      "Unlimited downloads",
    ],
    cta: "Upgrade to Export",
    urgency: "Save time with professional exports",
  },
  verification_locked: {
    icon: "✅",
    title: "Get Verified for Trust",
    description: "Verified users get 3x more agreement acceptances.",
    benefits: [
      "Identity verification badge",
      "Increased trust",
      "Priority in disputes",
      "Professional credibility",
    ],
    cta: "Get Verified",
    urgency: "Verification takes only 2 minutes",
  },
  milestone_reached: {
    icon: "🎉",
    title: "Congratulations on Your Success!",
    description: "You've created 5 agreements! Ready to level up?",
    benefits: [
      "You're clearly a power user",
      "Save 50% with annual plan",
      "Unlock advanced features",
      "Priority support",
    ],
    cta: "Claim Your Discount",
    urgency: "Special offer: 50% off for power users",
  },
  feature_discovery: {
    icon: "⚡",
    title: "Discover Premium Features",
    description: "See what you're missing with BindMe Premium.",
    benefits: [
      "AI-powered agreement builder",
      "Legal expert review",
      "Advanced analytics",
      "Team collaboration",
    ],
    cta: "Try Premium Free",
    urgency: "14-day free trial, no credit card required",
  },
}

export function SmartUpgradePrompt({
  trigger,
  open = false,
  onOpenChange,
  customMessage,
}: SmartUpgradePromptProps) {
  const [isOpen, setIsOpen] = useState(open)
  const router = useRouter()
  const config = PROMPT_CONFIGS[trigger]

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  function handleClose() {
    setIsOpen(false)
    onOpenChange?.(false)
  }

  function handleUpgrade() {
    router.push("/pricing")
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full">
              <span className="text-4xl">{config.icon}</span>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {customMessage || config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Urgency */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                {config.urgency}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              <Crown className="h-4 w-4 mr-2" />
              {config.cta}
            </Button>
            <Button onClick={handleClose} variant="ghost" className="w-full">
              Maybe Later
            </Button>
          </div>

          {/* Social Proof */}
          <div className="text-center text-xs text-muted-foreground">
            Join 5,000+ professionals using BindMe Premium
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to track and show upgrade prompts at the right time
export function useUpgradePrompt() {
  const [trigger, setTrigger] = useState<UpgradePromptTrigger | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  function showPrompt(promptTrigger: UpgradePromptTrigger) {
    setTrigger(promptTrigger)
    setIsOpen(true)
  }

  function hidePrompt() {
    setIsOpen(false)
  }

  return {
    showPrompt,
    hidePrompt,
    UpgradePrompt: trigger ? (
      <SmartUpgradePrompt trigger={trigger} open={isOpen} onOpenChange={setIsOpen} />
    ) : null,
  }
}

