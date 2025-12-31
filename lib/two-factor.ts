import { authenticator } from 'otplib'
import crypto from 'crypto'

const APP_NAME = 'BindMe'

/**
 * Two-Factor Authentication Service
 * Provides TOTP (Time-based One-Time Password) functionality
 */
export class TwoFactorAuth {
  /**
   * Generate a new secret for TOTP
   */
  static generateSecret(): string {
    return authenticator.generateSecret()
  }

  /**
   * Generate QR code data URL for authenticator apps
   */
  static generateQRCodeURL(email: string, secret: string): string {
    return authenticator.keyuri(email, APP_NAME, secret)
  }

  /**
   * Verify a TOTP token against a secret
   */
  static verifyToken(token: string, secret: string): boolean {
    try {
      // Remove spaces and ensure it's 6 digits
      const cleanToken = token.replace(/\s/g, '')
      if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
        return false
      }

      return authenticator.verify({
        token: cleanToken,
        secret,
      })
    } catch (error) {
      console.error('2FA verification error:', error)
      return false
    }
  }

  /**
   * Generate backup codes for account recovery
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      // Format as XXXX-XXXX for readability
      const formatted = `${code.slice(0, 4)}-${code.slice(4)}`
      codes.push(formatted)
    }
    return codes
  }

  /**
   * Hash backup codes for secure storage
   */
  static hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => {
      return crypto
        .createHash('sha256')
        .update(code)
        .digest('hex')
    })
  }

  /**
   * Verify a backup code against hashed codes
   */
  static verifyBackupCode(code: string, hashedCodes: string[]): boolean {
    const hashedInput = crypto
      .createHash('sha256')
      .update(code.replace(/\s/g, ''))
      .digest('hex')

    return hashedCodes.includes(hashedInput)
  }

  /**
   * Get the index of a used backup code to remove it
   */
  static getBackupCodeIndex(code: string, hashedCodes: string[]): number {
    const hashedInput = crypto
      .createHash('sha256')
      .update(code.replace(/\s/g, ''))
      .digest('hex')

    return hashedCodes.indexOf(hashedInput)
  }

  /**
   * Generate current TOTP token (useful for testing)
   */
  static generateToken(secret: string): string {
    return authenticator.generate(secret)
  }

  /**
   * Check if 2FA token is required based on user settings
   */
  static isRequired(userSettings: {
    twoFactorEnabled?: boolean | null
    twoFactorSecret?: string | null
  }): boolean {
    return Boolean(
      userSettings.twoFactorEnabled && 
      userSettings.twoFactorSecret
    )
  }

  /**
   * Validate 2FA setup data before enabling
   */
  static validateSetup(data: {
    secret: string
    token: string
    backupCodes?: string[]
  }): {
    valid: boolean
    error?: string
  } {
    // Verify the secret is valid
    if (!data.secret || data.secret.length < 16) {
      return {
        valid: false,
        error: 'Invalid secret provided'
      }
    }

    // Verify the token
    if (!this.verifyToken(data.token, data.secret)) {
      return {
        valid: false,
        error: 'Invalid verification code. Please try again.'
      }
    }

    // Verify backup codes if provided
    if (data.backupCodes && data.backupCodes.length < 5) {
      return {
        valid: false,
        error: 'Insufficient backup codes generated'
      }
    }

    return { valid: true }
  }

  /**
   * Prepare 2FA data for database storage
   */
  static prepareForStorage(data: {
    secret: string
    backupCodes: string[]
  }): {
    twoFactorSecret: string
    backupCodes: string // JSON string
  } {
    const hashedCodes = this.hashBackupCodes(data.backupCodes)
    
    return {
      twoFactorSecret: data.secret,
      backupCodes: JSON.stringify(hashedCodes)
    }
  }

  /**
   * Parse stored backup codes
   */
  static parseStoredBackupCodes(backupCodesJson: string | null): string[] {
    if (!backupCodesJson) {
      return []
    }

    try {
      const parsed = JSON.parse(backupCodesJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /**
   * Remove a used backup code from the list
   */
  static removeUsedBackupCode(
    backupCodesJson: string,
    usedCode: string
  ): string {
    const codes = this.parseStoredBackupCodes(backupCodesJson)
    const index = this.getBackupCodeIndex(usedCode, codes)
    
    if (index > -1) {
      codes.splice(index, 1)
    }
    
    return JSON.stringify(codes)
  }
}
