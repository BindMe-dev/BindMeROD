// Email templates for viral growth and engagement

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function getReferralRewardEmail(data: {
  userName: string
  friendName: string
  rewardType: string
  referralCount: number
}): EmailTemplate {
  return {
    subject: "🎁 You earned a reward on BindMe!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reward-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
            .stat-label { font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations ${data.userName}!</h1>
            </div>
            <div class="content">
              <p>Great news! <strong>${data.friendName}</strong> just signed up using your referral link.</p>
              
              <div class="reward-box">
                <h2>🎁 You Earned: ${data.rewardType}</h2>
                <p>Your reward has been automatically applied to your account!</p>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${data.referralCount}</div>
                  <div class="stat-label">Total Referrals</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${Math.max(0, 3 - data.referralCount)}</div>
                  <div class="stat-label">Until Next Reward</div>
                </div>
              </div>
              
              <p><strong>Keep sharing to unlock bigger rewards:</strong></p>
              <ul>
                <li>3 referrals → 25% lifetime discount</li>
                <li>5 referrals → 50% lifetime discount</li>
                <li>10 referrals → FREE FOREVER + custom branding</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://bindme.com/referrals" class="cta-button">View Referral Dashboard</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Want to earn more rewards? Share your referral link with friends and colleagues!
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Congratulations ${data.userName}!

${data.friendName} just signed up using your referral link.

You Earned: ${data.rewardType}

Total Referrals: ${data.referralCount}
Until Next Reward: ${Math.max(0, 3 - data.referralCount)}

Keep sharing to unlock bigger rewards:
- 3 referrals → 25% lifetime discount
- 5 referrals → 50% lifetime discount
- 10 referrals → FREE FOREVER + custom branding

View your referral dashboard: https://bindme.com/referrals
    `,
  }
}

export function getAgreementCompletedEmail(data: {
  userName: string
  agreementType: string
  agreementId: string
  certificateUrl: string
}): EmailTemplate {
  return {
    subject: "🎉 Your agreement is complete!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .secondary-button { display: inline-block; background: white; color: #667eea; border: 2px solid #667eea; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Agreement Completed!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              
              <p>Great news! Your <strong>${data.agreementType}</strong> has been successfully completed and secured.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.certificateUrl}" class="cta-button">📜 Download Certificate</a>
                <a href="https://bindme.com/agreements/${data.agreementId}" class="secondary-button">View Agreement</a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <h3>🎁 Invite Friends, Get Rewards!</h3>
              <p>Share BindMe with your network and get <strong>1 month premium free</strong> for each friend who signs up.</p>
              
              <div style="text-align: center;">
                <a href="https://bindme.com/referrals" class="cta-button">Get Your Referral Link</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Questions? Reply to this email or visit our help center.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${data.userName},

Your ${data.agreementType} has been successfully completed!

Download your certificate: ${data.certificateUrl}
View agreement: https://bindme.com/agreements/${data.agreementId}

---

Invite Friends, Get Rewards!
Share BindMe and get 1 month premium free for each friend who signs up.

Get your referral link: https://bindme.com/referrals
    `,
  }
}

export function getMilestoneEmail(data: {
  userName: string
  milestone: string
  badgeName: string
  nextGoal: string
}): EmailTemplate {
  return {
    subject: `🏆 Achievement Unlocked: ${data.badgeName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .badge { font-size: 80px; text-align: center; margin: 20px 0; }
            .cta-button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations ${data.userName}!</h1>
            </div>
            <div class="content">
              <div class="badge">🏆</div>
              
              <h2 style="text-align: center;">You Unlocked: ${data.badgeName}</h2>
              <p style="text-align: center; font-size: 18px;">${data.milestone}</p>
              
              <p>You're doing amazing! Keep up the great work.</p>
              
              <p><strong>Next Goal:</strong> ${data.nextGoal}</p>
              
              <div style="text-align: center;">
                <a href="https://bindme.com/achievements" class="cta-button">View All Achievements</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                Share your achievement on social media! 🎊
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Congratulations ${data.userName}!

You Unlocked: ${data.badgeName}
${data.milestone}

Next Goal: ${data.nextGoal}

View all achievements: https://bindme.com/achievements
    `,
  }
}

export function getWelcomeEmail(data: {
  userName: string
  referralCode?: string
  referralLink?: string
}): EmailTemplate {
  const code = data.referralCode || "YOURCODE"
  const link = data.referralLink || "https://bindme.co.uk/signup"

  return {
    subject: `Welcome to BindMe, ${data.userName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; }
            .container { max-width: 640px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
            .badge { display: inline-block; padding: 8px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-radius: 9999px; font-weight: 600; letter-spacing: 0.3px; }
            .cta { display: inline-block; padding: 12px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 16px; }
            .muted { color: #475569; font-size: 14px; }
            .code { font-family: monospace; background: #eef2ff; padding: 10px 12px; border-radius: 10px; display: inline-block; margin: 10px 0; font-weight: 700; color: #312e81; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="badge">Welcome aboard</div>
              <h1 style="margin: 16px 0 8px;">Hi ${data.userName},</h1>
              <p style="margin: 0 0 12px;">Thanks for joining BindMe. You can start creating agreements, tracking commitments, and inviting collaborators right away.</p>

              <p class="muted" style="margin: 0 0 16px;">Quick start tips:</p>
              <ul style="margin: 0 0 16px 18px; padding: 0; color: #0f172a;">
                <li>Create your first agreement from the dashboard</li>
                <li>Invite a collaborator via email to sign together</li>
                <li>Track progress and unlock badges as you go</li>
              </ul>

              <a href="https://bindme.co.uk/dashboard" class="cta">Open your dashboard</a>

              <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                <p style="margin: 0 0 8px; font-weight: 700;">Earn rewards when friends join</p>
                <div class="code">${code}</div>
                <p class="muted" style="margin: 0 0 10px;">Share your referral link to unlock perks faster.</p>
                <a href="${link}" class="cta" style="background:#6366f1;">Copy your link</a>
              </div>

              <p class="muted" style="margin-top: 20px;">If you have any questions, just reply to this email. We're here to help.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${data.userName},

Thanks for joining BindMe. You can start creating agreements, inviting collaborators, and unlocking badges right away.

Quick start:
- Create your first agreement from the dashboard
- Invite a collaborator to sign together
- Track progress and earn rewards

Your referral code: ${code}
Referral link: ${link}

Open your dashboard: https://bindme.co.uk/dashboard
If you have any questions, just reply to this email.
    `,
  }
}
