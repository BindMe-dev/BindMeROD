import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-sender"
import { getWelcomeEmail } from "@/lib/email-templates"

export async function GET(request: NextRequest) {
  // Get email from query params or use a default
  const searchParams = request.nextUrl.searchParams
  const testEmail = searchParams.get("email") || "test@example.com"

  try {
    // Test 1: Simple email
    console.log("🧪 Testing simple email...")
    const simpleResult = await sendEmail({
      to: testEmail,
      subject: "Test Email from BindMe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1d4ed8;">✅ Email System Working!</h1>
          <p>This is a test email from your BindMe application.</p>
          <p><strong>Email service is configured correctly.</strong></p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent from: ${process.env.SMTP_USER || "Resend"}
          </p>
        </div>
      `,
      text: "Email System Working! This is a test email from your BindMe application.",
    })

    // Test 2: Template email
    console.log("🧪 Testing template email...")
    const welcomeTemplate = getWelcomeEmail({
      userName: "Test User",
      referralCode: "TEST123",
      referralLink: "https://bindme.co.uk/signup?ref=TEST123",
    })

    const templateResult = await sendEmail({
      to: testEmail,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
    })

    return NextResponse.json({
      success: true,
      message: "Test emails sent successfully!",
      results: {
        simpleEmail: simpleResult,
        templateEmail: templateResult,
      },
      emailService: process.env.SMTP_USER ? "SMTP (Hostinger)" : process.env.RESEND_API_KEY ? "Resend" : "Console Only",
      sentTo: testEmail,
    })
  } catch (error) {
    console.error("❌ Test email failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

