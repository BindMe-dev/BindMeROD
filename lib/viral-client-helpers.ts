// Client-side viral helper functions
// These functions are safe to use in client components (no database imports)

/**
 * Store referral code in session storage (client-side)
 */
export function storeReferralCode(code: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("referralCode", code)
  }
}

/**
 * Get stored referral code (client-side)
 */
export function getStoredReferralCode(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("referralCode")
  }
  return null
}

/**
 * Clear stored referral code (client-side)
 */
export function clearStoredReferralCode() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("referralCode")
  }
}

/**
 * Get referral code from URL search params
 */
export function getReferralCodeFromURL(searchParams: URLSearchParams): string | null {
  return searchParams.get("ref")
}

