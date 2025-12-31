import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      documentType, 
      documentReference, 
      verifiedName, 
      verifiedAddress, 
      verifiedDob,
      documentImage // Base64 image data
    } = await request.json()

    if (!documentType || !documentReference || !verifiedName || !documentImage) {
      return NextResponse.json({ 
        error: "Document type, reference, verified name, and document image are required" 
      }, { status: 400 })
    }

    // Validate document type
    const validTypes = ['passport', 'driving_licence', 'ni_letter']
    if (!validTypes.includes(documentType)) {
      return NextResponse.json({ 
        error: "Invalid document type. Must be passport, driving_licence, or ni_letter" 
      }, { status: 400 })
    }

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "User is already verified" }, { status: 400 })
    }

    // Check if verified name matches signup name (basic consistency check)
    const nameMatch = user.name.toLowerCase().trim() === verifiedName.toLowerCase().trim()
    
    // Update user with verification details
    const [updatedUser] = await db
      .update(users)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verificationType: documentType,
        verifiedName,
        verifiedAddress,
        verifiedDob,
        documentReference,
      })
      .where(eq(users.id, userId))
      .returning()

    // TODO: Store document image securely (encrypted, separate storage)
    // TODO: Implement OCR processing for automatic data extraction
    // TODO: Add manual review queue for discrepancies

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
        verifiedAt: updatedUser.verifiedAt,
        verificationType: updatedUser.verificationType,
      },
      nameMatch
    })

  } catch (error) {
    console.error("[VERIFY_IDENTITY]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}