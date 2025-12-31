import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/server-auth'
import { DocumentImport } from '@/lib/document-import'

/**
 * POST /api/agreements/import
 * Import and parse a PDF or Word document to extract agreement terms
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!DocumentImport.isValidFileType(file)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or Word document.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Parse and extract terms
    const extractedTerms = await DocumentImport.importDocument(file)

    return NextResponse.json({
      success: true,
      extractedTerms,
      message: 'Document parsed successfully',
    })
  } catch (error) {
    console.error('Document import error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
