export interface PublicProfileSettings {
  enabled: boolean
  bio?: string
  tagline?: string
  phoneNumber?: string
  emergencyContact?: string
  occupation?: string
  company?: string
  shareAchievements: boolean
  shareStreak: boolean
  allowSupportPings: boolean
  showEmail: boolean
}

export const DEFAULT_PUBLIC_PROFILE: PublicProfileSettings = {
  enabled: false,
  bio: "",
  tagline: "",
  phoneNumber: "",
  emergencyContact: "",
  occupation: "",
  company: "",
  shareAchievements: true,
  shareStreak: true,
  allowSupportPings: true,
  showEmail: false,
}
