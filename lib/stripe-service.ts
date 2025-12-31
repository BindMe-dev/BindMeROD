/**
 * Stripe Payment Service
 * Handles all payment processing for BindMe
 * 
 * Setup:
 * 1. Sign up at stripe.com
 * 2. Add STRIPE_SECRET_KEY to .env
 * 3. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env
 * 4. Set up webhook endpoint
 */

import Stripe from 'stripe'

// Initialize Stripe only if API key is available (allows build to succeed)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Create a payment intent for consultation fee
 */
export async function createConsultationPayment(
  amount: number, // in pounds
  agreementId: string,
  firmId: string,
  userId: string,
  description: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      metadata: {
        agreementId,
        firmId,
        userId,
        type: 'consultation',
      },
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error: any) {
    console.error('Stripe payment intent creation failed:', error)
    throw new Error(`Payment creation failed: ${error.message}`)
  }
}

/**
 * Create a subscription for law firm
 */
export async function createFirmSubscription(
  firmId: string,
  firmEmail: string,
  plan: 'basic' | 'premium' | 'enterprise'
): Promise<{ subscriptionId: string; clientSecret: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  try {
    // Create or retrieve customer
    const customers = await stripe.customers.list({
      email: firmEmail,
      limit: 1,
    })

    let customer: Stripe.Customer
    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: firmEmail,
        metadata: { firmId },
      })
    }

    // Get price ID based on plan
    const priceId = getPriceIdForPlan(plan)

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        firmId,
        plan,
      },
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret!,
    }
  } catch (error: any) {
    console.error('Stripe subscription creation failed:', error)
    throw new Error(`Subscription creation failed: ${error.message}`)
  }
}

/**
 * Process payout to law firm
 */
export async function createFirmPayout(
  firmId: string,
  amount: number, // in pounds
  description: string,
  stripeAccountId: string
): Promise<{ payoutId: string; status: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  try {
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // Convert to pence
        currency: 'gbp',
        description,
        metadata: { firmId },
      },
      {
        stripeAccount: stripeAccountId,
      }
    )

    return {
      payoutId: payout.id,
      status: payout.status,
    }
  } catch (error: any) {
    console.error('Stripe payout creation failed:', error)
    throw new Error(`Payout creation failed: ${error.message}`)
  }
}

/**
 * Create Stripe Connect account for law firm
 */
export async function createConnectedAccount(
  firmEmail: string,
  firmName: string,
  firmId: string
): Promise<{ accountId: string; onboardingUrl: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email: firmEmail,
      business_type: 'company',
      company: {
        name: firmName,
      },
      metadata: { firmId },
      capabilities: {
        transfers: { requested: true },
      },
    })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${APP_URL}/firm/settings/payments`,
      return_url: `${APP_URL}/firm/settings/payments?success=true`,
      type: 'account_onboarding',
    })

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    }
  } catch (error: any) {
    console.error('Stripe connected account creation failed:', error)
    throw new Error(`Connected account creation failed: ${error.message}`)
  }
}

/**
 * Get price ID for subscription plan
 */
function getPriceIdForPlan(plan: 'basic' | 'premium' | 'enterprise'): string {
  // TODO: Replace with actual Stripe price IDs from your dashboard
  const priceIds = {
    basic: process.env.STRIPE_PRICE_BASIC || 'price_basic',
    premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
  }
  return priceIds[plan]
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error)
    throw new Error(`Webhook verification failed: ${error.message}`)
  }
}

