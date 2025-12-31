import { NextRequest, NextResponse } from "next/server"
import { ZodError, ZodSchema } from "zod"
import { getClientIP } from "@/lib/security/auth-security"

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Insufficient permissions") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = "ValidationError"
  }
}

export class RateLimitError extends Error {
  constructor(message: string = "Too many requests") {
    super(message)
    this.name = "RateLimitError"
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message)
    this.name = "NotFoundError"
  }
}

// Enhanced error handler with security logging
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const method = request.method
    const url = request.url

    try {
      const response = await handler(request, ...args)
      
      // Log successful requests (only in development or for monitoring)
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime
        console.log(`[API] ${method} ${url} - ${response.status} (${duration}ms) - ${ip}`)
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Security logging for failed requests
      console.error(`[API_ERROR] ${method} ${url} - ${error instanceof Error ? error.name : 'Unknown'} (${duration}ms) - ${ip}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent,
        stack: error instanceof Error ? error.stack : undefined
      })

      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: error.message, code: 'AUTHENTICATION_REQUIRED' },
          { status: 401 }
        )
      }

      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message, code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        )
      }

      if (error instanceof ValidationError) {
        return NextResponse.json(
          { 
            error: error.message, 
            code: 'VALIDATION_ERROR',
            details: error.details 
          },
          { status: 400 }
        )
      }

      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message, code: 'RATE_LIMIT_EXCEEDED' },
          { 
            status: 429,
            headers: {
              'Retry-After': '60'
            }
          }
        )
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json(
          { error: error.message, code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        
        return NextResponse.json(
          { 
            error: "Validation failed", 
            code: 'VALIDATION_ERROR',
            details: validationErrors 
          },
          { status: 400 }
        )
      }

      // Log unexpected errors with more detail
      console.error('[API_UNEXPECTED_ERROR]', {
        method,
        url,
        ip,
        userAgent,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      })

      // Generic error response (don't leak internal details)
      return NextResponse.json(
        { error: "Internal server error", code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  }
}

// Request validation with enhanced security
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('application/json')) {
      throw new ValidationError('Content-Type must be application/json')
    }

    const body = await request.json()
    
    // Basic security checks
    if (typeof body !== 'object' || body === null) {
      throw new ValidationError('Request body must be a valid JSON object')
    }

    // Check for suspicious payloads
    const bodyStr = JSON.stringify(body)
    if (bodyStr.length > 10000) { // 10KB limit
      throw new ValidationError('Request payload too large')
    }

    // Check for potential XSS/injection patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /eval\(/i,
      /function\s*\(/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(bodyStr))) {
      console.warn(`[SECURITY] Suspicious payload detected from ${getClientIP(request)}`)
      throw new ValidationError('Invalid request format')
    }

    return schema.parse(body)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format')
    }
    throw error
  }
}

// Rate limiting function
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Clean up expired rate limit records
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

// Get rate limit info
export function getRateLimitInfo(key: string): { remaining: number; resetTime: number } | null {
  const record = rateLimitStore.get(key)
  if (!record || Date.now() > record.resetTime) {
    return null
  }
  
  return {
    remaining: Math.max(0, record.count),
    resetTime: record.resetTime
  }
}