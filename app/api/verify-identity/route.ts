import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Identity verification endpoint
 * AWS Rekognition removed - manual review only
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const documentFile = formData.get('document') as File
    const userId = formData.get('userId') as string
    const userIP = formData.get('userIP') as string

    if (!documentFile || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required document or user ID'
      }, { status: 400 })
    }

    // Document received - will be manually reviewed
    // No automatic verification - admin must approve
    console.log('Document received for manual review from user:', userId)

    const result = {
      success: false, // Will be set to true by admin after manual review
      documentValid: false,
      message: 'Document submitted for manual review. You will be notified via email once verified.',
      documentType: 'manual_review'
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Verification failed'
    }, { status: 500 })
  }
}
