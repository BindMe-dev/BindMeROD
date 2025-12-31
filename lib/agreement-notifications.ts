import { sendEmail } from "./email-service"

export function generateAgreementCreatedEmail(agreementTitle: string, creatorName: string, recipientEmail: string) {
  return {
    subject: `New Agreement: ${agreementTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Agreement Created</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📋 New Agreement Created</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; margin-bottom: 20px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${creatorName}</strong> has created a new agreement: <strong>"${agreementTitle}"</strong>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;">
                View Agreement
              </a>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

export function generateAgreementSignedEmail(agreementTitle: string, signerName: string, recipientEmail: string) {
  return {
    subject: `Agreement Signed: ${agreementTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agreement Signed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Agreement Signed</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; margin-bottom: 20px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Great news!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${signerName}</strong> has signed the agreement: <strong>"${agreementTitle}"</strong>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;">
                View Signed Agreement
              </a>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

export async function sendAgreementNotification(type: 'created' | 'signed', agreementTitle: string, actorName: string, recipientEmail: string) {
  try {
    const emailContent = type === 'created' 
      ? generateAgreementCreatedEmail(agreementTitle, actorName, recipientEmail)
      : generateAgreementSignedEmail(agreementTitle, actorName, recipientEmail)

    await sendEmail({
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    console.log(`✅ Agreement ${type} notification sent to:`, recipientEmail)
  } catch (error) {
    console.error(`❌ Failed to send agreement ${type} notification:`, error)
  }
}