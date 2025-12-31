import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./db/schema"

const globalForDb = globalThis as unknown as {
  drizzleDb?: NodePgDatabase<typeof schema>
  pool?: Pool
}

// Enhanced connection configuration
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

// Detect if using Supabase or other cloud providers
const isCloudDatabase = connectionString.includes('supabase.co') || 
                        connectionString.includes('neon.tech') || 
                        connectionString.includes('railway.app')

// Connection pool configuration
const poolConfig = {
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
  min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum pool size
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 10 seconds
  maxUses: parseInt(process.env.DB_MAX_USES || '7500'), // Max uses per connection
  allowExitOnIdle: process.env.NODE_ENV !== 'production',
  
  // SSL configuration - always enabled for Supabase connections
  ssl: connectionString.includes('supabase.co') ? {
    rejectUnauthorized: false // Required for Supabase in all environments
  } : (isCloudDatabase ? { rejectUnauthorized: false } : false),
  
  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30 seconds
  
  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '60000'), // 60 seconds
}

const pool = globalForDb.pool || new Pool(poolConfig)

// Pool event handlers for monitoring
pool.on('connect', (client) => {
  console.log('Database client connected')
})

pool.on('error', (err, client) => {
  console.error('Database pool error:', err)
})

pool.on('acquire', (client) => {
  console.log('Database client acquired from pool')
})

pool.on('release', (client) => {
  console.log('Database client released back to pool')
})

// Create Drizzle instance with enhanced configuration
const drizzleInstance = globalForDb.drizzleDb || drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development" ? {
    logQuery: (query, params) => {
      console.log('🔍 Query:', query)
      if (params && params.length > 0) {
        console.log('📝 Params:', params)
      }
    }
  } : false,
})

export const db: NodePgDatabase<typeof schema> = drizzleInstance

// Cache the instances globally
if (!globalForDb.pool) {
  globalForDb.pool = pool
}

if (!globalForDb.drizzleDb) {
  globalForDb.drizzleDb = db
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency?: number
  poolStats?: any
  error?: string
}> {
  try {
    const start = Date.now()
    await db.execute(sql`SELECT 1`)
    const latency = Date.now() - start
    
    return {
      healthy: true,
      latency,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end()
    console.log('Database pool closed gracefully')
  } catch (error) {
    console.error('Error closing database pool:', error)
  }
}

// Connection monitoring
export function getDatabaseStats() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
    maxConnections: poolConfig.max,
    minConnections: poolConfig.min
  }
}

export { schema }

// Import sql for health check
import { sql } from "drizzle-orm"
