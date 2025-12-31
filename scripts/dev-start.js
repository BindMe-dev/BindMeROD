#!/usr/bin/env node
const { spawn, exec } = require('child_process')
const { Client } = require('pg')

async function waitForDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://bindme:bindme@localhost:5432/bindme'
  })
  
  for (let i = 0; i < 30; i++) {
    try {
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
      console.log('✅ Database is ready!')
      return true
    } catch (err) {
      console.log(`⏳ Waiting for database... (${i + 1}/30)`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  throw new Error('Database failed to start')
}

async function startDev() {
  console.log('🐳 Starting Docker services...')
  
  // Start Docker Compose
  exec('docker compose up -d', (error) => {
    if (error) {
      console.error('Failed to start Docker:', error)
      process.exit(1)
    }
  })
  
  // Wait for database
  await waitForDatabase()
  
  // Start Next.js
  console.log('🚀 Starting Next.js...')
  const nextProcess = spawn('next', ['dev'], { stdio: 'inherit' })
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...')
    nextProcess.kill()
    exec('docker compose down')
    process.exit(0)
  })
}

startDev().catch(console.error)