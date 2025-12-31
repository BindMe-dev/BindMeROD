const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.zevahjxuhefnwmjxieim:Nasserlee1%26@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

const client = postgres(connectionString)
const db = drizzle(client)

async function deleteAllData() {
  try {
    console.log('🗑️ Starting database cleanup...')
    
    // Delete in correct order due to foreign key constraints
    await client`DELETE FROM "EmailVerificationToken"`
    console.log('✅ Deleted email verification tokens')
    
    await client`DELETE FROM "PasswordResetToken"`
    console.log('✅ Deleted password reset tokens')
    
    await client`DELETE FROM "ChatMessage"`
    console.log('✅ Deleted chat messages')
    
    await client`DELETE FROM "ChatParticipant"`
    console.log('✅ Deleted chat participants')
    
    await client`DELETE FROM "AgreementChat"`
    console.log('✅ Deleted agreement chats')
    
    await client`DELETE FROM "AgreementComment"`
    console.log('✅ Deleted agreement comments')
    
    await client`DELETE FROM "AgreementReminder"`
    console.log('✅ Deleted agreement reminders')
    
    await client`DELETE FROM "AgreementAnalytics"`
    console.log('✅ Deleted agreement analytics')
    
    await client`DELETE FROM "AgreementVersion"`
    console.log('✅ Deleted agreement versions')
    
    await client`DELETE FROM "AuditLog"`
    console.log('✅ Deleted audit logs')
    
    await client`DELETE FROM "AgreementPartner"`
    console.log('✅ Deleted agreement partners')
    
    await client`DELETE FROM "ParticipantCompletion"`
    console.log('✅ Deleted participant completions')
    
    await client`DELETE FROM "SharedParticipant"`
    console.log('✅ Deleted shared participants')
    
    await client`DELETE FROM "Completion"`
    console.log('✅ Deleted completions')
    
    await client`DELETE FROM "LegalSignature"`
    console.log('✅ Deleted legal signatures')
    
    await client`DELETE FROM "SupportMessage"`
    console.log('✅ Deleted support messages')
    
    await client`DELETE FROM "Agreement"`
    console.log('✅ Deleted agreements')
    
    await client`DELETE FROM "Notification"`
    console.log('✅ Deleted notifications')
    
    await client`DELETE FROM "UserPreferences"`
    console.log('✅ Deleted user preferences')
    
    await client`DELETE FROM "User"`
    console.log('✅ Deleted users')
    
    console.log('🎉 Database cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await client.end()
  }
}

deleteAllData()