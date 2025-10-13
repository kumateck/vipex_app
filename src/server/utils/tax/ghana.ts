/* Ghana tax breakdown for amounts RECEIVED (inclusive-of-tax principal).
   - VAT = (3/23) of principal
   - GETFUND = (25/1219) of principal
   - NHIL = (25/1219) of principal
   - COVID = (10/1219) of principal
   - Net (actual) price = principal - sum(taxes)

   All calculations are done in cents with BigInt and rounded half-up to avoid FP errors.
*/

export type GhanaTaxBreakdown = {
  principal: number; // gross, as provided
  net: number; // principal - totalTax
  vat: number;
  getfund: number;
  nhil: number;
  covid: number;
  totalTax: number; // vat + getfund + nhil + covid
  residual: number; // 0 or +/-0.01 to balance rounding; applied to VAT
};

const FRACTIONS = {
  VAT: { num: 3n, den: 23n }, // 3/23
  GETFUND: { num: 25n, den: 1219n }, // 25/1219
  NHIL: { num: 25n, den: 1219n }, // 25/1219
  COVID: { num: 10n, den: 1219n }, // 10/1219
};

// Round half up: floor((x + d/2) / d)
function roundDivHalfUp(n: bigint, d: bigint): bigint {
  const half = d / 2n;
  return (n + half) / d;
}

/**
 * Convert a decimal amount to cents (integer) safely.
 */
function toCents(amount: number): bigint {
  // Multiply and round to the nearest cent to guard against input like 12.345
  return BigInt(Math.round(amount * 100));
}

/**
 * Convert cents to decimal number with two dp.
 */
function fromCents(cents: bigint): number {
  return Number(cents) / 100;
}

/**
 * Compute tax components from an inclusive principal.
 * Ensures components + net == principal exactly (by balancing on VAT).
 */
export function computeGhanaTaxesFromPrincipal(principal: number): GhanaTaxBreakdown {
  if (!Number.isFinite(principal) || principal < 0) {
    throw new Error('Principal must be a non-negative finite number');
  }

  const principalC = toCents(principal);

  // Raw components (rounded to cents)
  const vatC = roundDivHalfUp(principalC * FRACTIONS.VAT.num, FRACTIONS.VAT.den);
  const getfundC = roundDivHalfUp(principalC * FRACTIONS.GETFUND.num, FRACTIONS.GETFUND.den);
  const nhilC = roundDivHalfUp(principalC * FRACTIONS.NHIL.num, FRACTIONS.NHIL.den);
  const covidC = roundDivHalfUp(principalC * FRACTIONS.COVID.num, FRACTIONS.COVID.den);

  // Sum and net
  let totalTaxC = vatC + getfundC + nhilC + covidC;
  let netC = principalC - totalTaxC;

  // Balance any rounding residual so that net + taxes == principal exactly.
  // Residual should be in {-1, 0, 1} cent in practice.
  const recomposed = netC + totalTaxC;
  const residualC = principalC - recomposed;
  if (residualC !== 0n) {
    // Apply residual onto VAT to keep total consistent
    const balancedVatC = vatC + residualC;
    // Ensure VAT does not go negative (extremely unlikely with positive principal)
    const finalVatC = balancedVatC < 0n ? 0n : balancedVatC;
    totalTaxC = finalVatC + getfundC + nhilC + covidC;
    netC = principalC - totalTaxC;
    return {
      principal,
      net: fromCents(netC),
      vat: fromCents(finalVatC),
      getfund: fromCents(getfundC),
      nhil: fromCents(nhilC),
      covid: fromCents(covidC),
      totalTax: fromCents(totalTaxC),
      residual: fromCents(residualC),
    };
  }

  return {
    principal,
    net: fromCents(netC),
    vat: fromCents(vatC),
    getfund: fromCents(getfundC),
    nhil: fromCents(nhilC),
    covid: fromCents(covidC),
    totalTax: fromCents(totalTaxC),
    residual: 0,
  };
}

/**
 * Convenience helpers aligned with your original API
 */
export const CalculateVAT = (principal: number) => computeGhanaTaxesFromPrincipal(principal).vat;
export const CalculateGetFUND = (principal: number) =>
  computeGhanaTaxesFromPrincipal(principal).getfund;
export const CalculateNHIL = (principal: number) => computeGhanaTaxesFromPrincipal(principal).nhil;
export const CalculateCOVID = (principal: number) =>
  computeGhanaTaxesFromPrincipal(principal).covid;
export const CalculateGetActualPrice = (
  principal: number,
  VAT?: number,
  GETFUND?: number,
  NHIL?: number,
  COVID?: number,
) => {
  if ([VAT, GETFUND, NHIL, COVID].every((v) => typeof v === 'number')) {
    return principal - (VAT! + GETFUND! + NHIL! + COVID!);
  }
  return computeGhanaTaxesFromPrincipal(principal).net;
};
