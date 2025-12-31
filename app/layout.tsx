import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { AgreementProvider } from "@/lib/agreement-store"
import { PartnerProvider } from "@/lib/partner-store"
import { AchievementProvider } from "@/lib/achievement-store"
import { NotificationProvider } from "@/lib/notification-store"
import { GlobalTopNav } from "@/components/global-top-nav"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Toaster } from "@/components/ui/sonner"

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
        <AuthProvider>
          <PartnerProvider>
            <AchievementProvider>
              <NotificationProvider>
                <AgreementProvider>
                  <GlobalTopNav />
                  <div className="pt-14 sm:pt-18 pb-20 md:pb-0">
                    {children}
                  </div>
                  <MobileBottomNav />
                  <Toaster />
                </AgreementProvider>
              </NotificationProvider>
            </AchievementProvider>
          </PartnerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
