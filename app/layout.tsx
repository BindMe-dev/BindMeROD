import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { AgreementProvider } from "@/lib/agreement-store"
import { PartnerProvider } from "@/lib/partner-store"
import { AchievementProvider } from "@/lib/achievement-store"
import { NotificationProvider } from "@/lib/notification-store"
import { GlobalTopNav } from "@/components/global-top-nav"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BindMe - Track Your Agreements",
  description: "Keep your promises and track personal commitments",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/placeholder-logo.png" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-950 text-white">
        <ErrorBoundary>
          <AuthProvider>
            <PartnerProvider>
              <AchievementProvider>
                <NotificationProvider>
                  <AgreementProvider>
                    <Suspense fallback={<div className="h-14 sm:h-18 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800" />}>
                      <GlobalTopNav />
                    </Suspense>
                    <div className="pt-14 sm:pt-18 pb-20 md:pb-0">
                      <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="text-slate-400">Loading...</div></div>}>
                        {children}
                      </Suspense>
                    </div>
                    <Suspense fallback={null}>
                      <MobileBottomNav />
                    </Suspense>
                    <Toaster />
                  </AgreementProvider>
                </NotificationProvider>
              </AchievementProvider>
            </PartnerProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
