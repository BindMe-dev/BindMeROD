import { NextRequest, NextResponse } from "next/server"

// Performance metrics interface
interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  statusCode: number
  duration: number
  timestamp: Date
  userAgent?: string
  userId?: string
  memoryUsage?: NodeJS.MemoryUsage
  dbQueries?: number
  cacheHits?: number
  cacheMisses?: number
}

// In-memory metrics store (in production, use Redis or external service)
const metricsStore = new Map<string, PerformanceMetrics>()
const MAX_METRICS = 1000 // Keep last 1000 requests

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  routeName: string
) {
  return async (...args: T): Promise<R> => {
    const requestId = generateRequestId()
    const startTime = Date.now()
    const startMemory = process.memoryUsage()
    
    // Extract request info if available
    const request = args.find(arg => arg instanceof Request) as NextRequest | undefined
    
    try {
      console.log(`🚀 [${requestId}] Starting ${routeName}`)
      
      const result = await handler(...args)
      
      const duration = Date.now() - startTime
      const endMemory = process.memoryUsage()
      
      // Log performance metrics
      const metrics: PerformanceMetrics = {
        requestId,
        method: request?.method || 'UNKNOWN',
        url: request?.url || routeName,
        statusCode: result instanceof NextResponse ? result.status : 200,
        duration,
        timestamp: new Date(),
        userAgent: request?.headers.get('user-agent') || undefined,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        }
      }
      
      // Store metrics
      storeMetrics(metrics)
      
      // Log performance
      logPerformance(metrics)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      const metrics: PerformanceMetrics = {
        requestId,
        method: request?.method || 'UNKNOWN',
        url: request?.url || routeName,
        statusCode: 500,
        duration,
        timestamp: new Date(),
        userAgent: request?.headers.get('user-agent') || undefined,
      }
      
      storeMetrics(metrics)
      logPerformance(metrics, error)
      
      throw error
    }
  }
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Store metrics with rotation
function storeMetrics(metrics: PerformanceMetrics): void {
  metricsStore.set(metrics.requestId, metrics)
  
  // Rotate metrics if we exceed max
  if (metricsStore.size > MAX_METRICS) {
    const oldestKey = metricsStore.keys().next().value
    metricsStore.delete(oldestKey)
  }
}

// Log performance with appropriate level
function logPerformance(metrics: PerformanceMetrics, error?: unknown): void {
  const { requestId, method, url, statusCode, duration, memoryUsage } = metrics
  
  // Determine log level based on performance
  let level = 'info'
  if (duration > 5000) level = 'warn' // > 5 seconds
  if (duration > 10000) level = 'error' // > 10 seconds
  if (error) level = 'error'
  
  const logMessage = `[${requestId}] ${method} ${url} - ${statusCode} (${duration}ms)`
  
  const logData = {
    requestId,
    method,
    url,
    statusCode,
    duration,
    memoryDelta: memoryUsage ? `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB` : undefined,
    error: error instanceof Error ? error.message : error
  }
  
  switch (level) {
    case 'error':
      console.error(`🔴 ${logMessage}`, logData)
      break
    case 'warn':
      console.warn(`🟡 ${logMessage}`, logData)
      break
    default:
      console.log(`🟢 ${logMessage}`, logData)
  }
}

// Get performance statistics
export function getPerformanceStats(): {
  totalRequests: number
  averageResponseTime: number
  slowestRequests: PerformanceMetrics[]
  errorRate: number
  memoryUsage: NodeJS.MemoryUsage
} {
  const metrics = Array.from(metricsStore.values())
  const totalRequests = metrics.length
  
  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowestRequests: [],
      errorRate: 0,
      memoryUsage: process.memoryUsage()
    }
  }
  
  const averageResponseTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
  const slowestRequests = metrics
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
  
  const errorCount = metrics.filter(m => m.statusCode >= 400).length
  const errorRate = (errorCount / totalRequests) * 100
  
  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    slowestRequests,
    errorRate: Math.round(errorRate * 100) / 100,
    memoryUsage: process.memoryUsage()
  }
}

// Database query counter
let dbQueryCount = 0
export function incrementDbQueryCount(): void {
  dbQueryCount++
}

export function getDbQueryCount(): number {
  return dbQueryCount
}

export function resetDbQueryCount(): void {
  dbQueryCount = 0
}

// Cache metrics
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
}

export function recordCacheHit(): void {
  cacheMetrics.hits++
}

export function recordCacheMiss(): void {
  cacheMetrics.misses++
}

export function recordCacheSet(): void {
  cacheMetrics.sets++
}

export function recordCacheDelete(): void {
  cacheMetrics.deletes++
}

export function getCacheMetrics() {
  const total = cacheMetrics.hits + cacheMetrics.misses
  const hitRate = total > 0 ? (cacheMetrics.hits / total) * 100 : 0
  
  return {
    ...cacheMetrics,
    hitRate: Math.round(hitRate * 100) / 100
  }
}

// Health check endpoint data
export function getHealthMetrics() {
  const stats = getPerformanceStats()
  const cacheStats = getCacheMetrics()
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    performance: {
      totalRequests: stats.totalRequests,
      averageResponseTime: stats.averageResponseTime,
      errorRate: stats.errorRate
    },
    cache: cacheStats,
    database: {
      queriesExecuted: dbQueryCount
    }
  }
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  RESPONSE_TIME: 5000, // 5 seconds
  ERROR_RATE: 10, // 10%
  MEMORY_USAGE: 500 * 1024 * 1024, // 500MB
}

// Check if alerts should be triggered
export function checkAlerts(): string[] {
  const alerts: string[] = []
  const stats = getPerformanceStats()
  const memory = process.memoryUsage()
  
  if (stats.averageResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME) {
    alerts.push(`High response time: ${stats.averageResponseTime}ms`)
  }
  
  if (stats.errorRate > ALERT_THRESHOLDS.ERROR_RATE) {
    alerts.push(`High error rate: ${stats.errorRate}%`)
  }
  
  if (memory.heapUsed > ALERT_THRESHOLDS.MEMORY_USAGE) {
    alerts.push(`High memory usage: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`)
  }
  
  return alerts
}