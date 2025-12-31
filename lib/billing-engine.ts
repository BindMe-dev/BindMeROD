/**
 * Billing & Commission Engine
 * Handles revenue sharing and billing for law firm services
 */

import { db } from "@/lib/db"
import { lawFirmAssignments, lawFirms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export interface CommissionConfig {
  consultationFeeRate: number // e.g., 0.20 for 20%
  servicePackageRate: number // e.g., 0.15 for 15%
  subscriptionFee: number // Monthly subscription fee
  premiumListingFee: number // Monthly premium listing fee
}

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  consultationFeeRate: 0.20, // 20% commission on consultations
  servicePackageRate: 0.15, // 15% commission on service packages
  subscriptionFee: 200, // £200/month base subscription
  premiumListingFee: 100, // £100/month for premium listing
}

export interface Invoice {
  id: string
  firmId: string
  period: string // e.g., "2025-01"
  items: InvoiceItem[]
  subtotal: number
  commission: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue"
  dueDate: Date
  paidAt?: Date
}

export interface InvoiceItem {
  type: "consultation" | "service_package" | "subscription" | "premium_listing"
  description: string
  amount: number
  commission: number
  netAmount: number
}

/**
 * Calculate commission for a consultation
 */
export function calculateConsultationCommission(
  consultationFee: number,
  config: CommissionConfig = DEFAULT_COMMISSION_CONFIG
): { commission: number; netAmount: number } {
  const commission = consultationFee * config.consultationFeeRate
  const netAmount = consultationFee - commission
  return { commission, netAmount }
}

/**
 * Calculate commission for a service package
 */
export function calculateServiceCommission(
  packageFee: number,
  config: CommissionConfig = DEFAULT_COMMISSION_CONFIG
): { commission: number; netAmount: number } {
  const commission = packageFee * config.servicePackageRate
  const netAmount = packageFee - commission
  return { commission, netAmount }
}

/**
 * Generate monthly invoice for a law firm
 */
export async function generateMonthlyInvoice(
  firmId: string,
  year: number,
  month: number,
  config: CommissionConfig = DEFAULT_COMMISSION_CONFIG
): Promise<Invoice> {
  const period = `${year}-${String(month).padStart(2, "0")}`
  const items: InvoiceItem[] = []

  // Get all assignments for this firm in this period
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const assignments = await db.query.lawFirmAssignments.findMany({
    where: eq(lawFirmAssignments.firmId, firmId),
  })

  // Calculate consultation fees
  const consultations = assignments.filter(
    (a) => a.status === "resolved" && a.agreedFee && a.agreedFee > 0
  )

  for (const consultation of consultations) {
    const { commission, netAmount } = calculateConsultationCommission(
      consultation.agreedFee || 0,
      config
    )

    items.push({
      type: "consultation",
      description: `Case ${consultation.agreementId.slice(0, 8)}`,
      amount: consultation.agreedFee || 0,
      commission,
      netAmount,
    })
  }

  // Add subscription fee
  items.push({
    type: "subscription",
    description: "Monthly subscription",
    amount: config.subscriptionFee,
    commission: 0,
    netAmount: config.subscriptionFee,
  })

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const totalCommission = items.reduce((sum, item) => sum + item.commission, 0)
  const total = items.reduce((sum, item) => sum + item.netAmount, 0)

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    firmId,
    period,
    items,
    subtotal,
    commission: totalCommission,
    total,
    status: "draft",
    dueDate: new Date(year, month, 15), // Due on 15th of next month
  }

  return invoice
}

/**
 * Calculate total revenue for platform
 */
export async function calculatePlatformRevenue(
  year: number,
  month: number
): Promise<{
  totalConsultationRevenue: number
  totalServiceRevenue: number
  totalSubscriptionRevenue: number
  totalCommission: number
  totalRevenue: number
}> {
  // TODO: Implement actual calculation from database
  // For now, return placeholder values

  return {
    totalConsultationRevenue: 0,
    totalServiceRevenue: 0,
    totalSubscriptionRevenue: 0,
    totalCommission: 0,
    totalRevenue: 0,
  }
}

/**
 * Process payment for an invoice
 */
export async function processInvoicePayment(
  invoiceId: string,
  paymentMethod: "stripe" | "bank_transfer"
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement payment processing with Stripe
  // For now, return placeholder

  return {
    success: false,
    error: "Payment processing not yet implemented",
  }
}

