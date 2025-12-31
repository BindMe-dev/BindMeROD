import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { db } from "@/lib/db"
import { agreements, users, sharedParticipants } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { generateCertificateSVG, generateCertificateHTML } from "@/lib/certificate-generator"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agreementId = params.id

    // Get agreement details
    const agreement = await db
      .select({
        id: agreements.id,
        type: agreements.type,
        title: agreements.title,
        status: agreements.status,
        userId: agreements.userId,
        createdAt: agreements.createdAt,
        creatorName: users.name,
      })
      .from(agreements)
      .innerJoin(users, eq(agreements.userId, users.id))
      .where(eq(agreements.id, agreementId))
      .limit(1)

    if (agreement.length === 0) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    const agr = agreement[0]

    // Check if user has access to this agreement
    const hasAccess =
      agr.userId === userId ||
      (await db
        .select()
        .from(sharedParticipants)
        .where(
          and(
            eq(sharedParticipants.agreementId, agreementId),
            eq(sharedParticipants.userId, userId)
          )
        )
        .limit(1)).length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if agreement is completed
    if (agr.status !== "completed" && agr.status !== "active") {
      return NextResponse.json(
        { error: "Certificate only available for completed agreements" },
        { status: 400 }
      )
    }

    // Get all participants
    const participants = await db
      .select({
        name: sharedParticipants.userName,
      })
      .from(sharedParticipants)
      .where(eq(sharedParticipants.agreementId, agreementId))

    const parties = [agr.creatorName, ...participants.map((p) => p.name)]

    // Get format from query params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "html"
    const theme = (searchParams.get("theme") || "minimalist") as "minimalist" | "corporate" | "creative"

    const certificateData = {
      agreementId: agr.id,
      agreementType: agr.type,
      parties,
      completedDate: agr.createdAt || new Date(),
      theme,
    }

    if (format === "svg") {
      const svg = generateCertificateSVG(certificateData)
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      })
    }

    // Return HTML by default
    const html = generateCertificateHTML(certificateData)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error generating certificate:", error)
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 })
  }
}

