import {
  AudienceTag,
  CartItemInput,
  DeliveryZone,
  Discount,
  PricedLineItem,
  PricingCalculationResult,
  Product,
} from '../types';
import {
  assertIntegerKobo,
  calculateLineTotalKobo,
  calculateNetComponentKobo,
  calculateVatComponentKobo,
  DEFAULT_VAT_RATE,
} from './money';

export interface CalculatePricingInput {
  products: Product[];
  cartItems: CartItemInput[];
  discounts?: Discount[];
  discountCode?: string;
  deliveryZones: DeliveryZone[];
  deliveryZoneId?: string;
  audienceTag?: AudienceTag;
  vatRate?: number;
  now?: Date;
}

/**
 * Evaluates whether a discount is eligible given current timestamp, usage limits,
 * minimum spend, and optional audience tag.
 */
export function validateDiscountEligibility(
  discount: Discount,
  subtotalKobo: number,
  now: Date = new Date(),
  audienceTag?: AudienceTag
): { valid: boolean; reason: string } {
  if (!discount.active) {
    return { valid: false, reason: 'This discount code is currently inactive.' };
  }

  const nowMs = now.getTime();
  const startsMs = Date.parse(discount.startsAt);
  const endsMs = Date.parse(discount.endsAt);

  if (!Number.isNaN(startsMs) && nowMs < startsMs) {
    return { valid: false, reason: 'This discount promotion has not started yet.' };
  }

  if (!Number.isNaN(endsMs) && nowMs > endsMs) {
    return { valid: false, reason: 'This discount code has expired.' };
  }

  if (typeof discount.maxUses === 'number' && discount.usedCount >= discount.maxUses) {
    return { valid: false, reason: 'This discount code has reached its usage limit.' };
  }

  if (subtotalKobo < discount.minSubtotalKobo) {
    const minNaira = Math.round(discount.minSubtotalKobo / 100).toLocaleString('en-NG');
    return {
      valid: false,
      reason: `Minimum order subtotal of ₦${minNaira} required for this discount.`,
    };
  }

  if (
    discount.audienceTags &&
    discount.audienceTags.length > 0 &&
    audienceTag &&
    !discount.audienceTags.includes(audienceTag)
  ) {
    return {
      valid: false,
      reason: 'This discount is restricted to a different buyer segment.',
    };
  }

  return { valid: true, reason: discount.description || 'Discount applied.' };
}

/**
 * Computes integer kobo discount for a given eligible subtotal.
 * Rule A6:
 * - Percent discounts use basis points (e.g. 1000 = 10%) and round down to the nearest kobo.
 * - Fixed discounts never exceed the eligible subtotal.
 */
export function computeDiscountAmountKobo(
  discount: Discount,
  eligibleSubtotalKobo: number
): number {
  assertIntegerKobo(eligibleSubtotalKobo, 'eligibleSubtotalKobo');
  if (eligibleSubtotalKobo <= 0 || discount.value <= 0) {
    return 0;
  }

  if (discount.type === 'percent') {
    // Basis points: 10000 bp = 100%. Round down to nearest integer kobo.
    const rawDiscount = Math.floor((eligibleSubtotalKobo * discount.value) / 10000);
    return Math.min(rawDiscount, eligibleSubtotalKobo);
  }

  // fixed_kobo
  return Math.min(Math.floor(discount.value), eligibleSubtotalKobo);
}

/**
 * Pure pricing engine shared by client cart, server /api/price, /api/order/create, and unit tests.
 */
export function calculateCartPricing(input: CalculatePricingInput): PricingCalculationResult {
  const {
    products,
    cartItems,
    discounts = [],
    discountCode,
    deliveryZones,
    deliveryZoneId,
    audienceTag,
    vatRate = DEFAULT_VAT_RATE,
    now = new Date(),
  } = input;

  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  const lineItems: PricedLineItem[] = [];
  let subtotalKobo = 0;
  let hasStaleItems = false;
  let hasClampedItems = false;

  for (const rawItem of cartItems) {
    const requestedQty = Math.max(0, Math.floor(rawItem.qty));
    if (requestedQty === 0) continue;

    const product = productMap.get(rawItem.productId);
    if (!product) {
      hasStaleItems = true;
      lineItems.push({
        productId: rawItem.productId,
        slug: rawItem.productId,
        name: 'Unavailable Product',
        brand: 'ILLAI-RHASAK',
        categoryId: 'laptops',
        unitPriceKobo: 0,
        requestedQty,
        qty: 0,
        clamped: false,
        stale: true,
        staleReason: 'Product is no longer in the catalog.',
        lineSubtotalKobo: 0,
        lineDiscountKobo: 0,
        lineTotalKobo: 0,
        warrantyMonths: 0,
        warrantyTerms: '',
      });
      continue;
    }

    if (product.status !== 'published' || product.stockQty <= 0) {
      hasStaleItems = true;
      lineItems.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        unitPriceKobo: product.priceKobo,
        requestedQty,
        qty: 0,
        clamped: false,
        stale: true,
        staleReason:
          product.status !== 'published'
            ? 'This item has been archived.'
            : 'This item is currently out of stock.',
        lineSubtotalKobo: 0,
        lineDiscountKobo: 0,
        lineTotalKobo: 0,
        warrantyMonths: product.warrantyMonths,
        warrantyTerms: product.warrantyTerms,
        image: product.images[0]?.path,
      });
      continue;
    }

    const clamped = requestedQty > product.stockQty;
    if (clamped) {
      hasClampedItems = true;
    }
    const qty = Math.min(requestedQty, product.stockQty);
    const lineSubtotalKobo = calculateLineTotalKobo(product.priceKobo, qty);
    subtotalKobo += lineSubtotalKobo;

    lineItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      categoryId: product.categoryId,
      unitPriceKobo: product.priceKobo,
      requestedQty,
      qty,
      clamped,
      stale: false,
      lineSubtotalKobo,
      lineDiscountKobo: 0,
      lineTotalKobo: lineSubtotalKobo,
      warrantyMonths: product.warrantyMonths,
      warrantyTerms: product.warrantyTerms,
      image: product.images[0]?.path,
    });
  }

  // Discount resolution per A6:
  // Order of precedence/application: product-level -> category-level -> cart-level
  let discountKobo = 0;
  let discountApplied = false;
  let discountReason = 'No discount code entered.';
  const normalizedCode = discountCode?.trim().toUpperCase() || undefined;

  if (normalizedCode) {
    const matchedDiscount = discounts.find(
      (d) => d.code && d.code.trim().toUpperCase() === normalizedCode
    );

    if (!matchedDiscount) {
      discountReason = `Discount code "${normalizedCode}" was not found.`;
    } else {
      const eligibility = validateDiscountEligibility(
        matchedDiscount,
        subtotalKobo,
        now,
        audienceTag
      );

      if (!eligibility.valid) {
        discountReason = eligibility.reason;
      } else {
        // Calculate eligible subtotal by scope (product -> category -> cart)
        let eligibleSubtotalKobo = 0;

        if (matchedDiscount.scope === 'product') {
          for (const item of lineItems) {
            if (!item.stale && matchedDiscount.scopeIds.includes(item.productId)) {
              eligibleSubtotalKobo += item.lineSubtotalKobo;
            }
          }
        } else if (matchedDiscount.scope === 'category') {
          for (const item of lineItems) {
            if (!item.stale && matchedDiscount.scopeIds.includes(item.categoryId)) {
              eligibleSubtotalKobo += item.lineSubtotalKobo;
            }
          }
        } else {
          // cart scope
          eligibleSubtotalKobo = subtotalKobo;
        }

        if (eligibleSubtotalKobo <= 0) {
          discountReason = 'No items in your cart match the scope for this discount code.';
        } else {
          discountKobo = computeDiscountAmountKobo(matchedDiscount, eligibleSubtotalKobo);
          discountApplied = discountKobo > 0;
          discountReason = discountApplied
            ? matchedDiscount.description || `Code ${normalizedCode} applied.`
            : 'Discount amount evaluated to ₦0.';
        }
      }
    }
  } else {
    // Check automatic discounts (discounts without a code) ordered by product -> category -> cart
    const autoDiscounts = discounts.filter((d) => !d.code && d.active);
    const scopePriority: Record<string, number> = { product: 1, category: 2, cart: 3 };
    autoDiscounts.sort((a, b) => (scopePriority[a.scope] ?? 9) - (scopePriority[b.scope] ?? 9));

    for (const autoDiscount of autoDiscounts) {
      const eligibility = validateDiscountEligibility(
        autoDiscount,
        subtotalKobo,
        now,
        audienceTag
      );
      if (!eligibility.valid) continue;

      let eligibleSubtotalKobo = 0;
      if (autoDiscount.scope === 'product') {
        eligibleSubtotalKobo = lineItems
          .filter((i) => !i.stale && autoDiscount.scopeIds.includes(i.productId))
          .reduce((acc, i) => acc + i.lineSubtotalKobo, 0);
      } else if (autoDiscount.scope === 'category') {
        eligibleSubtotalKobo = lineItems
          .filter((i) => !i.stale && autoDiscount.scopeIds.includes(i.categoryId))
          .reduce((acc, i) => acc + i.lineSubtotalKobo, 0);
      } else {
        eligibleSubtotalKobo = subtotalKobo;
      }

      if (eligibleSubtotalKobo > 0) {
        const computed = computeDiscountAmountKobo(autoDiscount, eligibleSubtotalKobo);
        if (computed > 0) {
          discountKobo = computed;
          discountApplied = true;
          discountReason = autoDiscount.description || 'Automatic promotion applied.';
          break;
        }
      }
    }
  }

  // Delivery zone resolution
  const fallbackZone: DeliveryZone = deliveryZones[0] || {
    id: 'ikeja-pickup',
    label: 'Pickup at Ikeja Showroom (Lagos)',
    region: 'lagos_pickup',
    feeKobo: 0,
    etaDays: 'Same day',
    notes: 'Collect directly at ILLAI-RHASAK Nig. Enterprises, Ikeja, Lagos.',
  };

  const selectedZone =
    deliveryZones.find((z) => z.id === deliveryZoneId) || fallbackZone;

  const merchandiseAfterDiscountKobo = Math.max(0, subtotalKobo - discountKobo);
  const deliveryKobo = merchandiseAfterDiscountKobo > 0 ? selectedZone.feeKobo : 0;

  // VAT is inclusive in merchandise prices (7.5%)
  const vatKobo = calculateVatComponentKobo(merchandiseAfterDiscountKobo, vatRate);
  const netMerchandiseKobo = calculateNetComponentKobo(merchandiseAfterDiscountKobo, vatRate);
  const totalKobo = merchandiseAfterDiscountKobo + deliveryKobo;

  return {
    items: lineItems,
    subtotalKobo,
    discountKobo,
    discountCode: normalizedCode,
    discountApplied,
    discountReason,
    deliveryZoneId: selectedZone.id,
    deliveryZoneLabel: selectedZone.label,
    deliveryKobo,
    vatRate,
    vatKobo,
    netMerchandiseKobo,
    totalKobo,
    hasStaleItems,
    hasClampedItems,
  };
}
