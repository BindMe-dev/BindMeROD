import type { AgreementCategory } from "./agreement-types"

export interface CategoryInfo {
  id: AgreementCategory
  name: string
  description: string
  color: string
  icon: string
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "health-fitness",
    name: "Health & Fitness",
    description: "Exercise, nutrition, wellness goals",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "💪",
  },
  {
    id: "productivity-work",
    name: "Productivity & Work",
    description: "Career, tasks, professional development",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "💼",
  },
  {
    id: "learning-development",
    name: "Learning & Development",
    description: "Education, skills, courses, reading",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "📚",
  },
  {
    id: "finance-money",
    name: "Finance & Money",
    description: "Budgeting, saving, investing, debt",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "💰",
  },
  {
    id: "relationships-social",
    name: "Relationships & Social",
    description: "Family, friends, networking, connection",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    icon: "❤️",
  },
  {
    id: "creativity-hobbies",
    name: "Creativity & Hobbies",
    description: "Art, music, crafts, personal projects",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "🎨",
  },
  {
    id: "lifestyle-home",
    name: "Lifestyle & Home",
    description: "Organization, cleaning, habits, routines",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "🏠",
  },
  {
    id: "mindfulness-wellness",
    name: "Mindfulness & Wellness",
    description: "Meditation, self-care, mental health",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: "🧘",
  },
  {
    id: "uncategorized",
    name: "Uncategorized",
    description: "Other agreements",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "📋",
  },
]

export function getCategoryInfo(categoryId: AgreementCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
}
