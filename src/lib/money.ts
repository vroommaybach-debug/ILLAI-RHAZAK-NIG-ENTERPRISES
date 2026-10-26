/**
 * Pure integer kobo monetary calculations, VAT breakdown, and NGN formatting.
 * Rule A5 & A6:
 * - All money values are integers in kobo (1 NGN = 100 kobo). Never store floats for money.
 * - Price is stored VAT inclusive at 7.5% (0.075).
 * - VAT component for display: vatKobo = round(priceKobo - priceKobo / (1 + vatRate)).
 * - Display format: en-NG currency, no decimals for whole naira, two decimals only when kobo is non-zero.
 */

export const DEFAULT_VAT_RATE = 0.075;

export function assertIntegerKobo(value: number, label = 'kobo value'): void {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`Invalid ${label}: expected integer kobo, received ${value}`);
  }
}

export function nairaToKobo(naira: number): number {
  if (!Number.isFinite(naira)) {
    throw new Error(`Invalid naira amount: ${naira}`);
  }
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  assertIntegerKobo(kobo);
  return kobo / 100;
}

/**
 * Extracts the VAT component embedded inside a VAT-inclusive kobo amount.
 * Formula per A6: vatKobo = round(priceKobo - priceKobo / (1 + vatRate))
 */
export function calculateVatComponentKobo(
  vatInclusiveKobo: number,
  vatRate: number = DEFAULT_VAT_RATE
): number {
  assertIntegerKobo(vatInclusiveKobo, 'vatInclusiveKobo');
  if (vatInclusiveKobo <= 0 || vatRate <= 0) {
    return 0;
  }
  return Math.round(vatInclusiveKobo - vatInclusiveKobo / (1 + vatRate));
}

/**
 * Returns the net (ex-VAT) kobo component from a VAT-inclusive kobo amount.
 */
export function calculateNetComponentKobo(
  vatInclusiveKobo: number,
  vatRate: number = DEFAULT_VAT_RATE
): number {
  assertIntegerKobo(vatInclusiveKobo, 'vatInclusiveKobo');
  const vatKobo = calculateVatComponentKobo(vatInclusiveKobo, vatRate);
  return vatInclusiveKobo - vatKobo;
}

/**
 * Calculates integer line total in kobo without floating-point arithmetic.
 */
export function calculateLineTotalKobo(unitPriceKobo: number, qty: number): number {
  assertIntegerKobo(unitPriceKobo, 'unitPriceKobo');
  assertIntegerKobo(qty, 'qty');
  if (qty <= 0 || unitPriceKobo < 0) {
    return 0;
  }
  return unitPriceKobo * qty;
}

/**
 * Formats integer kobo as Nigerian Naira (NGN) per A6:
 * - en-NG currency format (₦)
 * - No decimals for whole naira (e.g. ₦1,450,000)
 * - Two decimals only when kobo is non-zero (e.g. ₦1,450,000.50)
 */
export function formatNgnFromKobo(kobo: number): string {
  assertIntegerKobo(kobo, 'kobo');
  const isNegative = kobo < 0;
  const absKobo = Math.abs(kobo);
  const hasKoboFraction = absKobo % 100 !== 0;
  const nairaValue = absKobo / 100;

  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: hasKoboFraction ? 2 : 0,
    maximumFractionDigits: hasKoboFraction ? 2 : 0,
  }).format(nairaValue);

  return isNegative ? `-${formatted}` : formatted;
}
