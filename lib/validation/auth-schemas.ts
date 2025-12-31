import { z } from "zod"
import { validatePasswordStrength } from "@/lib/security/password-security"

// Simple password validation with only strength checking
const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .max(128, "Password is too long")
  .refine((password) => {
    const strength = validatePasswordStrength(password)
    return strength.isValid
  }, (password) => {
    const strength = validatePasswordStrength(password)
    return { message: strength.feedback.join(". ") }
  })

// Simple email validation
const emailSchema = z.string()
  .email("Invalid email format")
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .transform((email) => email.toLowerCase().trim())

// Simple name validation
const nameSchema = z.string()
  .min(1, "Name is required")
  .max(50, "Name is too long")
  .transform((name) => name.trim())

// Simple date of birth validation
const dateOfBirthSchema = z.string()
  .refine((dob) => {
    const date = new Date(dob)
    const now = new Date()
    const age = now.getFullYear() - date.getFullYear()
    
    // Must be valid date
    if (isNaN(date.getTime())) return false
    
    // Must be between 10 and 120 years old
    if (age < 10 || age > 120) return false
    
    // Cannot be in the future
    if (date > now) return false
    
    return true
  }, "Invalid date of birth. Must be between 10 and 120 years old")

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  middleName: nameSchema.optional(),
  lastName: nameSchema,
  dateOfBirth: dateOfBirthSchema,
})

export const loginSchema = z.object({
  email: emailSchema.optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, "Password is required"),
}).refine(data => data.email || data.identifier, {
  message: "Either email or identifier is required",
  path: ["identifier"],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
