import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { lawFirmAssignments, lawFirms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { verifyWebhookSignature } from "@/lib/stripe-service"
import Stripe from "stripe"

/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 * 
 * Setup:
 * 1. In Stripe Dashboard, add webhook endpoint: https://yourdomain.com/api/payments/webhook
 * 2. Select events: payment_intent.succeeded, payment_intent.payment_failed, customer.subscription.updated
 * 3. Copy webhook secret to STRIPE_WEBHOOK_SECRET in .env
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = verifyWebhookSignature(body, signature)
    } catch (error: any) {
      console.error("Webhook signature verification failed:", error)
      return NextResponse.json(
        { error: `Webhook Error: ${error.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription)
        break

      case "payout.paid":
        await handlePayoutPaid(event.data.object as Stripe.Payout)
        break

      case "payout.failed":
        await handlePayoutFailed(event.data.object as Stripe.Payout)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { agreementId, firmId, type } = paymentIntent.metadata

  console.log("✅ Payment succeeded:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    agreementId,
    firmId,
    type,
  })

  if (type === "consultation" && agreementId && firmId) {
    // Update assignment with payment info
    await db
      .update(lawFirmAssignments)
      .set({
        paymentStatus: "paid",
        paidAt: new Date(),
      })
      .where(eq(lawFirmAssignments.agreementId, agreementId))

    // TODO: Send confirmation email to user and firm
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { agreementId, firmId, type } = paymentIntent.metadata

  console.error("❌ Payment failed:", {
    paymentIntentId: paymentIntent.id,
    agreementId,
    firmId,
    type,
  })

  if (type === "consultation" && agreementId) {
    // Update assignment with payment failure
    await db
      .update(lawFirmAssignments)
      .set({
        paymentStatus: "failed",
      })
      .where(eq(lawFirmAssignments.agreementId, agreementId))

    // TODO: Send payment failure email to user
  }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { firmId, plan } = subscription.metadata

  console.log("📋 Subscription updated:", {
    subscriptionId: subscription.id,
    firmId,
    plan,
    status: subscription.status,
  })

  if (firmId) {
    // Update firm subscription status
    await db
      .update(lawFirms)
      .set({
        subscriptionStatus: subscription.status,
        subscriptionTier: plan as any,
      })
      .where(eq(lawFirms.id, firmId))
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const { firmId } = subscription.metadata

  console.log("🚫 Subscription cancelled:", {
    subscriptionId: subscription.id,
    firmId,
  })

  if (firmId) {
    await db
      .update(lawFirms)
      .set({
        subscriptionStatus: "canceled",
      })
      .where(eq(lawFirms.id, firmId))
  }
}

/**
 * Handle successful payout
 */
async function handlePayoutPaid(payout: Stripe.Payout) {
  const { firmId } = payout.metadata

  console.log("💰 Payout paid:", {
    payoutId: payout.id,
    amount: payout.amount / 100,
    firmId,
  })

  // TODO: Update payout records in database
}

/**
 * Handle failed payout
 */
async function handlePayoutFailed(payout: Stripe.Payout) {
  const { firmId } = payout.metadata

  console.error("❌ Payout failed:", {
    payoutId: payout.id,
    firmId,
  })

  // TODO: Notify admin and firm about payout failure
}

