// Gamification types and constants (client-safe, no database imports)

export type BadgeType =
  | "first_agreement"
  | "agreement_master_5"
  | "agreement_master_10"
  | "agreement_master_25"
  | "speed_demon"
  | "social_butterfly"
  | "referral_champion"
  | "early_adopter"
  | "streak_7"
  | "streak_30"
  | "power_user"

export interface Badge {
  id: BadgeType
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlockedAt?: Date
}

export const BADGES: Record<BadgeType, Omit<Badge, "unlockedAt">> = {
  first_agreement: {
    id: "first_agreement",
    name: "Getting Started",
    description: "Created your first agreement",
    icon: "🎯",
    rarity: "common",
  },
  agreement_master_5: {
    id: "agreement_master_5",
    name: "Agreement Master",
    description: "Created 5 agreements",
    icon: "📝",
    rarity: "common",
  },
  agreement_master_10: {
    id: "agreement_master_10",
    name: "Agreement Pro",
    description: "Created 10 agreements",
    icon: "📚",
    rarity: "rare",
  },
  agreement_master_25: {
    id: "agreement_master_25",
    name: "Agreement Legend",
    description: "Created 25 agreements",
    icon: "👑",
    rarity: "epic",
  },
  speed_demon: {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Created 3 agreements in one day",
    icon: "⚡",
    rarity: "rare",
  },
  social_butterfly: {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Shared 5 certificates on social media",
    icon: "🦋",
    rarity: "rare",
  },
  referral_champion: {
    id: "referral_champion",
    name: "Referral Champion",
    description: "Referred 10 friends",
    icon: "🏆",
    rarity: "legendary",
  },
  early_adopter: {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined in the first 1000 users",
    icon: "🌟",
    rarity: "epic",
  },
  streak_7: {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day login streak",
    icon: "🔥",
    rarity: "rare",
  },
  streak_30: {
    id: "streak_30",
    name: "Month Master",
    description: "30-day login streak",
    icon: "💎",
    rarity: "legendary",
  },
  power_user: {
    id: "power_user",
    name: "Power User",
    description: "Completed 50 agreements",
    icon: "💪",
    rarity: "legendary",
  },
}

