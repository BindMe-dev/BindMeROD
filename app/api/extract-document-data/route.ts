import { NextRequest, NextResponse } from 'next/server'

/**
 * Document data extraction endpoint
 * AWS Rekognition removed - manual review only
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const documentFile = formData.get('document') as File

    if (!documentFile) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 })
    }

    // Document received - will be manually reviewed
    console.log('Document received for manual review:', documentFile.name)

    return NextResponse.json({
      extractedName: undefined,
      extractedDob: undefined,
      extractedDocNumber: undefined,
      documentType: 'manual_review',
      success: true,
      message: 'Document uploaded successfully. Manual review required.'
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

