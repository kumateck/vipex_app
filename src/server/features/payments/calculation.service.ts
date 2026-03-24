import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../db/client';
import {
  paymentRules,
  paymentCalculations,
  PaymentResponsibility,
  SplitPaymentType,
  DeliveryFeeBasis,
} from '../../../db/schemas';
import { createHash } from 'crypto';

type PaymentRuleRow = typeof paymentRules.$inferSelect;
type PaymentCalculationRow = typeof paymentCalculations.$inferSelect;

export interface PaymentCalculationInput {
  companyId: string;
  sourceBranchId: string;
  destinationBranchId: string;
  parcelValue: string; // in cedis
  weight?: number; // in kg
  distanceKm?: number; // distance between branches
  paymentResponsibility?: PaymentResponsibility; // Override default
  customSplitPercentage?: number; // Override default split
  includeInsurance?: boolean;
}

export interface PaymentCalculationResult {
  // Input parameters
  parcelValue: string;
  parcelValuePsw: number;
  weight?: number;
  distanceKm?: number;

  // Calculated charges
  baseCharge: string;
  baseChargePsw: number;
  deliveryFee: string;
  deliveryFeePsw: number;
  serviceCharge: string;
  serviceChargePsw: number;
  insurance: string;
  insurancePsw: number;
  totalCharge: string;
  totalChargePsw: number;

  // Payment responsibility breakdown
  senderAmount: string;
  senderAmountPsw: number;
  recipientAmount: string;
  recipientAmountPsw: number;

  // Tax breakdown (Ghana tax compliance)
  vat: string;
  vatPsw: number;
  getfund: string;
  getfundPsw: number;
  nhil: string;
  nhilPsw: number;
  covid: string;
  covidPsw: number;
  taxTotal: string;
  taxTotalPsw: number;

  // Metadata
  paymentRuleId?: string;
  paymentResponsibility: PaymentResponsibility;
  splitType?: SplitPaymentType;
  calculationHash: string;
}

/**
 * Calculate payment amounts with split payment logic and Ghana tax compliance
 */
export async function calculatePayment(
  input: PaymentCalculationInput,
): Promise<PaymentCalculationResult> {
  const {
    companyId,
    sourceBranchId,
    destinationBranchId,
    parcelValue,
    weight,
    distanceKm,
    paymentResponsibility,
    customSplitPercentage,
    includeInsurance = false,
  } = input;

  const parcelValuePsw = parseFloat(parcelValue) * 100;

  // Check for cached calculation
  const hash = generateCalculationHash(input);
  const [cached] = await db
    .select()
    .from(paymentCalculations)
    .where(eq(paymentCalculations.calculationHash, hash))
    .limit(1);

  if (cached) {
    return mapDbResultToCalculation(cached);
  }

  // Get applicable payment rules
  const rules = await getApplicablePaymentRules({
    companyId,
    sourceBranchId,
    destinationBranchId,
    weight,
    parcelValuePsw,
  });

  if (rules.length === 0) {
    // Create default calculation if no rules found
    return createDefaultCalculation(input, parcelValuePsw, hash);
  }
  // Apply first matching rule (priority: most specific > general)
  const rule = rules[0];

  if (!rule) {
    return createDefaultCalculation(input, parcelValuePsw, hash);
  }

  // Calculate base charges
  const baseChargePsw = rule.baseChargePsw || 0;
  const deliveryFeePsw = calculateDeliveryFee(rule, weight, distanceKm);
  const serviceChargePsw = rule.serviceChargePsw || 0;
  const insurancePsw =
    includeInsurance && rule.insuranceRequired ? calculateInsurance(rule, parcelValuePsw) : 0;

  // Total charge (taxable amount)
  const totalChargePsw = baseChargePsw + deliveryFeePsw + serviceChargePsw + insurancePsw;

  // Calculate taxes (Ghana tax system)
  const taxBreakdown = calculateGhanaTaxes(totalChargePsw);

  // Calculate payment responsibility
  const responsibility = paymentResponsibility ?? PaymentResponsibility.SENDER;
  const splitResult = calculateSplitPayment(
    rule,
    responsibility,
    totalChargePsw,
    customSplitPercentage,
  );

  const result: PaymentCalculationResult = {
    // Input parameters
    parcelValue,
    parcelValuePsw,
    weight,
    distanceKm,

    // Calculated charges
    baseCharge: (baseChargePsw / 100).toFixed(2),
    baseChargePsw,
    deliveryFee: (deliveryFeePsw / 100).toFixed(2),
    deliveryFeePsw,
    serviceCharge: (serviceChargePsw / 100).toFixed(2),
    serviceChargePsw,
    insurance: (insurancePsw / 100).toFixed(2),
    insurancePsw,
    totalCharge: (totalChargePsw / 100).toFixed(2),
    totalChargePsw,

    // Payment responsibility
    senderAmount: (splitResult.senderAmountPsw / 100).toFixed(2),
    senderAmountPsw: splitResult.senderAmountPsw,
    recipientAmount: (splitResult.recipientAmountPsw / 100).toFixed(2),
    recipientAmountPsw: splitResult.recipientAmountPsw,

    // Tax breakdown
    vat: (taxBreakdown.vatPsw / 100).toFixed(2),
    vatPsw: taxBreakdown.vatPsw,
    getfund: (taxBreakdown.getfundPsw / 100).toFixed(2),
    getfundPsw: taxBreakdown.getfundPsw,
    nhil: (taxBreakdown.nhilPsw / 100).toFixed(2),
    nhilPsw: taxBreakdown.nhilPsw,
    covid: (taxBreakdown.covidPsw / 100).toFixed(2),
    covidPsw: taxBreakdown.covidPsw,
    taxTotal: (taxBreakdown.taxTotalPsw / 100).toFixed(2),
    taxTotalPsw: taxBreakdown.taxTotalPsw,

    // Metadata
    paymentRuleId: rule.id,
    paymentResponsibility: responsibility,
    splitType: rule.splitPaymentType,
    calculationHash: hash,
  };

  // Cache the calculation
  try {
    await db.insert(paymentCalculations).values({
      companyId,
      sourceBranchId,
      destinationBranchId,
      parcelValuePsw,
      weight: weight ? Math.round(weight) : null,
      distanceKm: distanceKm ? Math.round(distanceKm) : null,
      totalChargePsw,
      baseChargePsw,
      deliveryFeePsw,
      serviceChargePsw,
      insurancePsw,
      senderAmountPsw: result.senderAmountPsw,
      recipientAmountPsw: result.recipientAmountPsw,
      vatPsw: result.vatPsw,
      getfundPsw: result.getfundPsw,
      nhilPsw: result.nhilPsw,
      covidPsw: result.covidPsw,
      taxTotalPsw: result.taxTotalPsw,
      paymentRuleId: rule.id,
      calculationHash: hash,
    });
  } catch (error) {
    // Cache failure shouldn't break the calculation
    console.error('Failed to cache payment calculation:', error);
  }

  return result;
}

/**
 * Get applicable payment rules for a route and parcel
 */
async function getApplicablePaymentRules(params: {
  companyId: string;
  sourceBranchId: string;
  destinationBranchId: string;
  weight?: number;
  parcelValuePsw: number;
}) {
  const { companyId, sourceBranchId, destinationBranchId } = params;

  // Try specific route rules first
  const routeRules = await db
    .select()
    .from(paymentRules)
    .where(
      and(
        eq(paymentRules.companyId, companyId),
        eq(paymentRules.sourceBranchId, sourceBranchId),
        eq(paymentRules.destinationBranchId, destinationBranchId),
        eq(paymentRules.isActive, true),
      ),
    )
    .orderBy(desc(paymentRules.createdAt))
    .limit(10);

  return routeRules;
}

/**
 * Create default calculation if no rules are found
 */
function createDefaultCalculation(
  input: PaymentCalculationInput,
  parcelValuePsw: number,
  hash: string,
): PaymentCalculationResult {
  // Default rates (should be configurable per company)
  const baseCharge = 500; // GHS 5.00
  const deliveryFee = 1000; // GHS 10.00
  const serviceCharge = 300; // GHS 3.00
  const totalCharge = baseCharge + deliveryFee + serviceCharge;

  const taxBreakdown = calculateGhanaTaxes(totalCharge);

  // Default 50/50 split
  const half = totalCharge / 2;

  return {
    parcelValue: input.parcelValue,
    parcelValuePsw,
    weight: input.weight,
    distanceKm: input.distanceKm,

    baseCharge: (baseCharge / 100).toFixed(2),
    baseChargePsw: baseCharge,
    deliveryFee: (deliveryFee / 100).toFixed(2),
    deliveryFeePsw: deliveryFee,
    serviceCharge: (serviceCharge / 100).toFixed(2),
    serviceChargePsw: serviceCharge,
    insurance: '0.00',
    insurancePsw: 0,
    totalCharge: (totalCharge / 100).toFixed(2),
    totalChargePsw: totalCharge,

    senderAmount: (half / 100).toFixed(2),
    senderAmountPsw: half,
    recipientAmount: (half / 100).toFixed(2),
    recipientAmountPsw: half,

    vat: (taxBreakdown.vatPsw / 100).toFixed(2),
    vatPsw: taxBreakdown.vatPsw,
    getfund: (taxBreakdown.getfundPsw / 100).toFixed(2),
    getfundPsw: taxBreakdown.getfundPsw,
    nhil: (taxBreakdown.nhilPsw / 100).toFixed(2),
    nhilPsw: taxBreakdown.nhilPsw,
    covid: (taxBreakdown.covidPsw / 100).toFixed(2),
    covidPsw: taxBreakdown.covidPsw,
    taxTotal: (taxBreakdown.taxTotalPsw / 100).toFixed(2),
    taxTotalPsw: taxBreakdown.taxTotalPsw,

    paymentResponsibility: input.paymentResponsibility ?? PaymentResponsibility.SENDER,
    splitType: SplitPaymentType.PERCENTAGE,
    calculationHash: hash,
  };
}

/**
 * Calculate delivery fee based on rule configuration
 */
function calculateDeliveryFee(
  rule: Pick<PaymentRuleRow, 'deliveryFeeBasis' | 'deliveryFeePsw'> | null | undefined,
  weight?: number,
  distanceKm?: number,
): number {
  if (!rule) return 0;

  const basis = rule.deliveryFeeBasis ?? DeliveryFeeBasis.FIXED;
  const baseFee = rule.deliveryFeePsw ?? 0;

  switch (basis) {
    case DeliveryFeeBasis.FIXED: {
      return baseFee;
    }

    case DeliveryFeeBasis.WEIGHT: {
      if (!weight) return baseFee;
      // BaseFee is rate per kg in pesewas
      const weightRate = Number(baseFee) / 100;
      return Math.round(weight * weightRate * 100);
    }

    case DeliveryFeeBasis.DISTANCE: {
      if (!distanceKm) return baseFee;
      // BaseFee is rate per km in pesewas
      const distanceRate = Number(baseFee) / 100;
      return Math.round(distanceKm * distanceRate * 100);
    }

    case DeliveryFeeBasis.VALUE: {
      // BaseFee is percentage * 100 (e.g., 5% = 500)
      const percentage = Number(baseFee) / 100;
      const parcelValue = 1000n; // Default value if not available
      return Math.round((Number(parcelValue) / 100) * percentage * 100);
    }

    default: {
      return baseFee;
    }
  }
}

/**
 * Calculate insurance based on rule configuration
 */
function calculateInsurance(
  rule:
    | Pick<PaymentRuleRow, 'insuranceRequired' | 'insuranceRate' | 'insuranceMinPsw'>
    | null
    | undefined,
  parcelValuePsw: number,
): number {
  if (!rule || !rule.insuranceRequired || !rule.insuranceRate) return 0;

  // Calculate insurance amount
  const insuranceRate = rule.insuranceRate / 100; // percentage
  const insuranceAmount = parcelValuePsw * insuranceRate;

  // Apply minimum if specified
  const minInsurance = rule.insuranceMinPsw || 0;
  return insuranceAmount < minInsurance ? minInsurance : insuranceAmount;
}

/**
 * Calculate split payment amounts based on rule and responsibility
 */
function calculateSplitPayment(
  rule:
    | Pick<PaymentRuleRow, 'splitPaymentType' | 'splitPercentage' | 'splitFixedSenderPsw'>
    | null
    | undefined,
  responsibility: PaymentResponsibility,
  totalChargePsw: number,
  customSplitPercentage?: number,
): { senderAmountPsw: number; recipientAmountPsw: number } {
  switch (responsibility) {
    case PaymentResponsibility.SENDER:
      return {
        senderAmountPsw: totalChargePsw,
        recipientAmountPsw: 0,
      };

    case PaymentResponsibility.RECIPIENT:
      return {
        senderAmountPsw: 0,
        recipientAmountPsw: totalChargePsw,
      };

    case PaymentResponsibility.SPLIT:
      return calculateSplitAmounts(rule, totalChargePsw, customSplitPercentage);

    default:
      throw new Error('Invalid payment responsibility');
  }
}

/**
 * Calculate split amounts for SPLIT responsibility
 */
function calculateSplitAmounts(
  rule:
    | Pick<PaymentRuleRow, 'splitPaymentType' | 'splitPercentage' | 'splitFixedSenderPsw'>
    | null
    | undefined,
  totalChargePsw: number,
  customSplitPercentage?: number,
): { senderAmountPsw: number; recipientAmountPsw: number } {
  const splitType = rule?.splitPaymentType ?? SplitPaymentType.PERCENTAGE;

  switch (splitType) {
    case SplitPaymentType.PERCENTAGE: {
      const senderPercentage = customSplitPercentage ?? rule?.splitPercentage ?? 50;
      const senderAmount = (totalChargePsw * senderPercentage) / 100;
      return {
        senderAmountPsw: senderAmount,
        recipientAmountPsw: totalChargePsw - senderAmount,
      };
    }

    case SplitPaymentType.FIXED: {
      const fixedSender = rule?.splitFixedSenderPsw ?? totalChargePsw / 2;
      return {
        senderAmountPsw: fixedSender,
        recipientAmountPsw: totalChargePsw - fixedSender,
      };
    }

    case SplitPaymentType.WEIGHTED: {
      // Complex logic based on multiple factors
      // For now, fall back to 50/50
      const weightedHalf = totalChargePsw / 2;
      return {
        senderAmountPsw: weightedHalf,
        recipientAmountPsw: totalChargePsw - weightedHalf,
      };
    }

    default: {
      // Default 50/50 split
      const defaultHalf = totalChargePsw / 2;
      return {
        senderAmountPsw: defaultHalf,
        recipientAmountPsw: totalChargePsw - defaultHalf,
      };
    }
  }
}

/**
 * Calculate Ghana taxes (VAT 3/23, GETFUND 2.5%, NHIL 2.5%, COVID 1%)
 * Note: VAT is inclusive (3/23 = 13.04%), others are exclusive
 */
function calculateGhanaTaxes(amountPsw: number): {
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  taxTotalPsw: number;
} {
  // VAT is 3/23 of the amount (inclusive)
  const vatPsw = Math.round((amountPsw * 3) / 23);

  // GETFUND, NHIL, COVID are percentages of the amount (exclusive)
  const getfundPsw = Math.round((amountPsw * 25) / 1000); // 2.5%
  const nhilPsw = Math.round((amountPsw * 25) / 1000); // 2.5%
  const covidPsw = Math.round((amountPsw * 10) / 1000); // 1%

  const taxTotalPsw = vatPsw + getfundPsw + nhilPsw + covidPsw;

  return {
    vatPsw,
    getfundPsw,
    nhilPsw,
    covidPsw,
    taxTotalPsw,
  };
}

/**
 * Generate hash for payment calculation caching
 */
function generateCalculationHash(input: PaymentCalculationInput): string {
  // Convert BigInt values to strings for serialization
  const hashInput = JSON.stringify({
    ...input,
    // Handle any BigInt values by converting to strings
    parcelValue: input.parcelValue,
  });
  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Map database calculation result to API response format
 */
function mapDbResultToCalculation(dbResult: PaymentCalculationRow): PaymentCalculationResult {
  return {
    parcelValue: (Number(dbResult.parcelValuePsw) / 100).toFixed(2),
    parcelValuePsw: dbResult.parcelValuePsw,
    weight: dbResult.weight ?? undefined,
    distanceKm: dbResult.distanceKm ?? undefined,

    baseCharge: (Number(dbResult.baseChargePsw) / 100).toFixed(2),
    baseChargePsw: dbResult.baseChargePsw,
    deliveryFee: (Number(dbResult.deliveryFeePsw) / 100).toFixed(2),
    deliveryFeePsw: dbResult.deliveryFeePsw,
    serviceCharge: (Number(dbResult.serviceChargePsw) / 100).toFixed(2),
    serviceChargePsw: dbResult.serviceChargePsw,
    insurance: (Number(dbResult.insurancePsw) / 100).toFixed(2),
    insurancePsw: dbResult.insurancePsw,
    totalCharge: (Number(dbResult.totalChargePsw) / 100).toFixed(2),
    totalChargePsw: dbResult.totalChargePsw,

    senderAmount: (Number(dbResult.senderAmountPsw) / 100).toFixed(2),
    senderAmountPsw: dbResult.senderAmountPsw,
    recipientAmount: (Number(dbResult.recipientAmountPsw) / 100).toFixed(2),
    recipientAmountPsw: dbResult.recipientAmountPsw,

    vat: (Number(dbResult.vatPsw) / 100).toFixed(2),
    vatPsw: dbResult.vatPsw,
    getfund: (Number(dbResult.getfundPsw) / 100).toFixed(2),
    getfundPsw: dbResult.getfundPsw,
    nhil: (Number(dbResult.nhilPsw) / 100).toFixed(2),
    nhilPsw: dbResult.nhilPsw,
    covid: (Number(dbResult.covidPsw) / 100).toFixed(2),
    covidPsw: dbResult.covidPsw,
    taxTotal: (Number(dbResult.taxTotalPsw) / 100).toFixed(2),
    taxTotalPsw: dbResult.taxTotalPsw,

    paymentRuleId: dbResult.paymentRuleId ?? undefined,
    paymentResponsibility: PaymentResponsibility.SENDER,
    splitType: undefined,
    calculationHash: dbResult.calculationHash,
  };
}
