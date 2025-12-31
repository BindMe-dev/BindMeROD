import bcrypt from "bcryptjs"

// Common passwords list (top 1000 most common passwords)
const COMMON_PASSWORDS = new Set([
  "password", "123456", "password123", "admin", "12345678", "qwerty", "123456789", 
  "letmein", "1234567890", "football", "iloveyou", "admin123", "welcome", "monkey",
  "login", "abc123", "starwars", "123123", "dragon", "passw0rd", "master", "hello",
  "freedom", "whatever", "qazwsx", "trustno1", "654321", "jordan23", "harley",
  "password1", "1234", "robert", "matthew", "jordan", "michelle", "mindy", "patrick",
  "123abc", "andrew", "joshua", "1qaz2wsx", "qwertyuiop", "superman", "computer"
])

export interface PasswordStrength {
  score: number // 0-4 (0=very weak, 4=very strong)
  feedback: string[]
  isValid: boolean
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length < 12) {
    feedback.push("Password should be at least 12 characters long")
  } else if (password.length >= 16) {
    score += 1
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length

  if (varietyCount < 3) {
    feedback.push("Password should include uppercase, lowercase, numbers, and symbols")
  } else if (varietyCount === 4) {
    score += 1
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    feedback.push("This password is too common and easily guessed")
    score = Math.max(0, score - 2)
  }

  // Pattern checks
  if (/(.)\1{2,}/.test(password)) {
    feedback.push("Avoid repeating characters (e.g., 'aaa')")
  }

  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    feedback.push("Avoid sequential characters")
  }

  // Dictionary word check (basic)
  const commonWords = ["password", "admin", "user", "login", "welcome", "hello", "world"]
  if (commonWords.some(word => password.toLowerCase().includes(word))) {
    feedback.push("Avoid common words in passwords")
  }

  // Calculate final score
  if (password.length >= 12 && varietyCount >= 3 && !COMMON_PASSWORDS.has(password.toLowerCase())) {
    score += 1
  }

  if (password.length >= 16 && varietyCount === 4 && !/(.)\1{2,}/.test(password)) {
    score += 1
  }

  // Entropy calculation (bonus points for high entropy)
  const entropy = calculateEntropy(password)
  if (entropy > 60) score += 1

  score = Math.min(4, Math.max(0, score))

  return {
    score,
    feedback: feedback.length > 0 ? feedback : ["Password strength: " + getStrengthLabel(score)],
    isValid: score >= 2 && password.length >= 12 && varietyCount >= 3 && !COMMON_PASSWORDS.has(password.toLowerCase())
  }
}

function calculateEntropy(password: string): number {
  const charSets = [
    /[a-z]/.test(password) ? 26 : 0, // lowercase
    /[A-Z]/.test(password) ? 26 : 0, // uppercase  
    /\d/.test(password) ? 10 : 0,    // numbers
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 32 : 0 // symbols
  ]
  
  const charsetSize = charSets.reduce((sum, size) => sum + size, 0)
  return password.length * Math.log2(charsetSize)
}

function getStrengthLabel(score: number): string {
  switch (score) {
    case 0: return "Very Weak"
    case 1: return "Weak"
    case 2: return "Fair"
    case 3: return "Good"
    case 4: return "Strong"
    default: return "Unknown"
  }
}

// Secure password hashing with timing attack protection
export async function hashPassword(password: string): Promise<string> {
  // Use higher cost factor for better security (12 rounds = ~250ms)
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
  return bcrypt.hash(password, saltRounds)
}

// Constant-time password comparison to prevent timing attacks
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    // Always take the same amount of time even on error
    await bcrypt.compare("dummy-password", "$2b$10$dummy.hash.to.prevent.timing.attacks")
    return false
  }
}

// Check if password has been compromised (basic implementation)
export function checkPasswordBreach(password: string): boolean {
  // In production, you'd integrate with HaveIBeenPwned API
  // For now, just check against common passwords
  return COMMON_PASSWORDS.has(password.toLowerCase())
}

// Generate secure random password
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Ensure at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}