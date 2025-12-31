import { randomBytes, createHmac, timingSafeEqual } from "crypto"
import { generateSecureToken } from "./auth-security"

// TOTP (Time-based One-Time Password) implementation
export class TwoFactorAuth {
  private static readonly WINDOW_SIZE = 30 // 30 seconds
  private static readonly DIGITS = 6
  private static readonly ALGORITHM = 'sha1'

  // Generate a secret key for TOTP
  static generateSecret(): string {
    return randomBytes(20).toString('base32')
  }

  // Generate TOTP code for a given secret and time
  static generateTOTP(secret: string, time?: number): string {
    const epoch = Math.floor((time || Date.now()) / 1000)
    const counter = Math.floor(epoch / this.WINDOW_SIZE)
    
    return this.generateHOTP(secret, counter)
  }

  // Generate HOTP (HMAC-based One-Time Password)
  private static generateHOTP(secret: string, counter: number): string {
    const secretBuffer = Buffer.from(secret, 'base32')
    const counterBuffer = Buffer.alloc(8)
    counterBuffer.writeBigUInt64BE(BigInt(counter))

    const hmac = createHmac(this.ALGORITHM, secretBuffer)
    hmac.update(counterBuffer)
    const hash = hmac.digest()

    const offset = hash[hash.length - 1] & 0xf
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % Math.pow(10, this.DIGITS)

    return code.toString().padStart(this.DIGITS, '0')
  }

  // Verify TOTP code with time window tolerance
  static verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    const now = Math.floor(Date.now() / 1000)
    const currentWindow = Math.floor(now / this.WINDOW_SIZE)

    // Check current window and adjacent windows for clock drift tolerance
    for (let i = -window; i <= window; i++) {
      const testTime = (currentWindow + i) * this.WINDOW_SIZE * 1000
      const expectedToken = this.generateTOTP(secret, testTime)
      
      if (this.constantTimeCompare(token, expectedToken)) {
        return true
      }
    }

    return false
  }

  // Constant-time string comparison to prevent timing attacks
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)

    return timingSafeEqual(bufferA, bufferB)
  }

  // Generate QR code URL for authenticator apps
  static generateQRCodeURL(
    secret: string,
    accountName: string,
    issuer: string = 'BindMe'
  ): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: this.ALGORITHM.toUpperCase(),
      digits: this.DIGITS.toString(),
      period: this.WINDOW_SIZE.toString()
    })

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`
  }

  // Generate backup codes for account recovery
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = generateSecureToken(4).toUpperCase().replace(/[0O1IL]/g, '9')
      codes.push(code.substring(0, 4) + '-' + code.substring(4, 8))
    }
    
    return codes
  }

  // Validate backup code format
  static isValidBackupCodeFormat(code: string): boolean {
    return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)
  }
}

// SMS-based 2FA implementation
export class SMSTwoFactor {
  private static readonly CODE_LENGTH = 6
  private static readonly EXPIRY_MINUTES = 5

  // Generate SMS verification code
  static generateSMSCode(): { code: string; expiresAt: Date } {
    const code = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(this.CODE_LENGTH, '0')
    
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000)
    
    return { code, expiresAt }
  }

  // Verify SMS code with timing-safe comparison
  static verifySMSCode(providedCode: string, expectedCode: string, expiresAt: Date): boolean {
    // Check expiry
    if (new Date() > expiresAt) {
      return false
    }

    // Normalize codes (remove spaces, convert to string)
    const normalizedProvided = providedCode.replace(/\s/g, '').trim()
    const normalizedExpected = expectedCode.replace(/\s/g, '').trim()

    if (normalizedProvided.length !== this.CODE_LENGTH || 
        normalizedExpected.length !== this.CODE_LENGTH) {
      return false
    }

    return TwoFactorAuth.constantTimeCompare(normalizedProvided, normalizedExpected)
  }
}

// Email-based 2FA implementation
export class EmailTwoFactor {
  private static readonly CODE_LENGTH = 8
  private static readonly EXPIRY_MINUTES = 10

  // Generate email verification code (alphanumeric for better usability)
  static generateEmailCode(): { code: string; expiresAt: Date } {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000)
    
    return { code, expiresAt }
  }

  // Verify email code
  static verifyEmailCode(providedCode: string, expectedCode: string, expiresAt: Date): boolean {
    // Check expiry
    if (new Date() > expiresAt) {
      return false
    }

    // Normalize codes (uppercase, remove spaces)
    const normalizedProvided = providedCode.replace(/\s/g, '').toUpperCase().trim()
    const normalizedExpected = expectedCode.replace(/\s/g, '').toUpperCase().trim()

    if (normalizedProvided.length !== this.CODE_LENGTH || 
        normalizedExpected.length !== this.CODE_LENGTH) {
      return false
    }

    return TwoFactorAuth.constantTimeCompare(normalizedProvided, normalizedExpected)
  }
}

// 2FA method types
export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'backup'

// 2FA configuration interface
export interface TwoFactorConfig {
  enabled: boolean
  method: TwoFactorMethod
  secret?: string // For TOTP
  phoneNumber?: string // For SMS
  backupCodes?: string[] // Backup codes
  lastUsed?: Date
}

// Utility functions
export function formatTOTPCode(code: string): string {
  return code.replace(/(\d{3})(\d{3})/, '$1 $2')
}

export function formatBackupCode(code: string): string {
  return code.toUpperCase().replace(/(.{4})(.{4})/, '$1-$2')
}

export function getTwoFactorMethodName(method: TwoFactorMethod): string {
  switch (method) {
    case 'totp':
      return 'Authenticator App'
    case 'sms':
      return 'SMS'
    case 'email':
      return 'Email'
    case 'backup':
      return 'Backup Code'
    default:
      return 'Unknown'
  }
}

// Rate limiting for 2FA attempts
const twoFactorAttempts = new Map<string, { count: number; resetTime: number }>()

export function checkTwoFactorRateLimit(identifier: string, maxAttempts: number = 5): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const key = `2fa:${identifier}`
  
  const record = twoFactorAttempts.get(key)
  
  if (!record || now > record.resetTime) {
    twoFactorAttempts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false
  }
  
  record.count++
  return true
}

export function resetTwoFactorRateLimit(identifier: string): void {
  const key = `2fa:${identifier}`
  twoFactorAttempts.delete(key)
}