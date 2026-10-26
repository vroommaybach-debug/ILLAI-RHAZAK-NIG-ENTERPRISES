import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLineTotalKobo,
  calculateNetComponentKobo,
  calculateVatComponentKobo,
  formatNgnFromKobo,
  nairaToKobo,
} from '../src/lib/money';
import {
  calculateCartPricing,
  computeDiscountAmountKobo,
  validateDiscountEligibility,
} from '../src/lib/pricing';
import {
  buildOrderWhatsAppUrl,
  buildProductWhatsAppUrl,
  buildSegmentWhatsAppUrl,
} from '../src/lib/whatsapp';
import { getSafeEntranceConfig, shouldReduceMotion } from '../src/lib/motion';
import { DeliveryZone, Discount, Product } from '../src/types';

const SAMPLE_ZONES: DeliveryZone[] = [
  {
    id: 'ikeja-pickup',
    label: 'Pickup at Ikeja Showroom (Lagos)',
    region: 'lagos_pickup',
    feeKobo: 0,
    etaDays: 'Same day',
    notes: 'Free showroom pickup in Ikeja.',
  },
  {
    id: 'lagos-mainland',
    label: 'Lagos Mainland Express',
    region: 'lagos',
    feeKobo: 1500000, // ₦15,000
    etaDays: 'Same day / 24 hrs',
    notes: 'Insured dispatch rider or van.',
  },
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-laptop-1',
    slug: 'hp-elitebook-840-g10',
    name: 'HP EliteBook 840 G10 (Core i7 13th Gen)',
    brand: 'HP',
    categoryId: 'laptops',
    status: 'published',
    priceKobo: 145000000, // ₦1,450,000.00
    stockQty: 5,
    stockStatus: 'in_stock',
    warrantyMonths: 12,
    warrantyTerms: '12 Months HP Factory Carry-In Warranty attached to serial number.',
    shortDescription: 'Enterprise 14-inch business notebook.',
    longDescription: 'Full description.',
    images: [],
    specs: { processor: 'Intel Core i7-1355U', ramGb: 16, storageGb: 512 },
    tags: ['executive'],
    audienceTags: ['retail', 'bulk'],
    seed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'seed',
  },
  {
    id: 'prod-printer-1',
    slug: 'hp-laserjet-pro-4003dn',
    name: 'HP LaserJet Pro 4003dn Duplex Network Printer',
    brand: 'HP',
    categoryId: 'printers',
    status: 'published',
    priceKobo: 48500000, // ₦485,000.00
    stockQty: 3,
    stockStatus: 'in_stock',
    warrantyMonths: 12,
    warrantyTerms: '12 Months hardware warranty (excludes toner consumables).',
    shortDescription: 'High-speed monochrome laser printer.',
    longDescription: 'Full description.',
    images: [],
    specs: { printSpeedPpm: 40, duplex: true },
    tags: ['office'],
    audienceTags: ['retail', 'education', 'bulk'],
    seed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'seed',
  },
  {
    id: 'prod-archived',
    slug: 'legacy-scanner',
    name: 'Archived Scanner Model',
    brand: 'Canon',
    categoryId: 'scanners',
    status: 'archived',
    priceKobo: 32000000,
    stockQty: 0,
    stockStatus: 'out',
    warrantyMonths: 12,
    warrantyTerms: '12 Months warranty.',
    shortDescription: 'Legacy scanner.',
    longDescription: 'Legacy scanner.',
    images: [],
    specs: {},
    tags: [],
    audienceTags: ['retail'],
    seed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'seed',
  },
];

test('money.ts: integer kobo conversions, VAT 7.5% breakdown, and NGN formatting', () => {
  assert.equal(nairaToKobo(1450000), 145000000);
  assert.equal(calculateLineTotalKobo(145000000, 2), 290000000);

  // VAT component for ₦107,500 (10,750,000 kobo) at 7.5% is exactly ₦7,500 (750,000 kobo)
  const vatKobo = calculateVatComponentKobo(10750000, 0.075);
  const netKobo = calculateNetComponentKobo(10750000, 0.075);
  assert.equal(vatKobo, 750000);
  assert.equal(netKobo, 10000000);
  assert.equal(vatKobo + netKobo, 10750000);

  // Formatting: no decimals for whole naira, 2 decimals when kobo != 0
  const wholeFormatted = formatNgnFromKobo(145000000);
  assert.ok(wholeFormatted.includes('1,450,000'));
  assert.ok(!wholeFormatted.includes('.00'));

  const fractionFormatted = formatNgnFromKobo(145000050);
  assert.ok(fractionFormatted.includes('1,450,000.50'));
});

test('pricing.ts: percent basis-point rounding down and fixed discount capping', () => {
  const percentDiscount: Discount = {
    id: 'd1',
    code: 'TENOFF',
    description: '10% off',
    type: 'percent',
    value: 1000, // 10%
    scope: 'cart',
    scopeIds: [],
    minSubtotalKobo: 0,
    usedCount: 0,
    startsAt: '2025-01-01T00:00:00Z',
    endsAt: '2028-01-01T00:00:00Z',
    active: true,
  };

  // 333 kobo * 10% = 33.3 -> rounds down to 33 kobo
  assert.equal(computeDiscountAmountKobo(percentDiscount, 333), 33);

  const fixedDiscount: Discount = {
    ...percentDiscount,
    type: 'fixed_kobo',
    value: 5000000, // ₦50,000
  };
  // Never exceeds eligible subtotal
  assert.equal(computeDiscountAmountKobo(fixedDiscount, 3000000), 3000000);
});

test('pricing.ts: validates discount minimum spend, expiry, usage cap, and scope', () => {
  const now = new Date('2026-10-26T12:00:00Z');
  const baseDiscount: Discount = {
    id: 'disc-school',
    code: 'SCHOOL10',
    description: '10% Education Discount',
    type: 'percent',
    value: 1000,
    scope: 'category',
    scopeIds: ['printers'],
    minSubtotalKobo: 40000000,
    maxUses: 10,
    usedCount: 5,
    startsAt: '2026-01-01T00:00:00Z',
    endsAt: '2027-01-01T00:00:00Z',
    active: true,
  };

  assert.equal(validateDiscountEligibility(baseDiscount, 50000000, now).valid, true);
  assert.equal(validateDiscountEligibility(baseDiscount, 20000000, now).valid, false);
  assert.equal(
    validateDiscountEligibility({ ...baseDiscount, usedCount: 10 }, 50000000, now).valid,
    false
  );
  assert.equal(
    validateDiscountEligibility(
      { ...baseDiscount, endsAt: '2026-02-01T00:00:00Z' },
      50000000,
      now
    ).valid,
    false
  );

  // Category-scoped discount applies only to printers in the cart
  const result = calculateCartPricing({
    products: SAMPLE_PRODUCTS,
    cartItems: [
      { productId: 'prod-laptop-1', qty: 1 },
      { productId: 'prod-printer-1', qty: 1 },
    ],
    discounts: [baseDiscount],
    discountCode: 'school10',
    deliveryZones: SAMPLE_ZONES,
    deliveryZoneId: 'lagos-mainland',
    now,
  });

  assert.equal(result.discountApplied, true);
  // 10% of printer (48,500,000 kobo) = 4,850,000 kobo
  assert.equal(result.discountKobo, 4850000);
  assert.equal(result.subtotalKobo, 145000000 + 48500000);
  assert.equal(result.deliveryKobo, 1500000);
  assert.equal(result.totalKobo, 145000000 + 48500000 - 4850000 + 1500000);
});

test('pricing.ts: clamps quantity to stockQty and flags stale/archived items', () => {
  const result = calculateCartPricing({
    products: SAMPLE_PRODUCTS,
    cartItems: [
      { productId: 'prod-laptop-1', qty: 99 }, // stockQty is 5
      { productId: 'prod-archived', qty: 1 },
    ],
    deliveryZones: SAMPLE_ZONES,
    deliveryZoneId: 'ikeja-pickup',
  });

  assert.equal(result.hasClampedItems, true);
  assert.equal(result.hasStaleItems, true);
  assert.equal(result.items[0].qty, 5);
  assert.equal(result.items[0].clamped, true);
  assert.equal(result.items[1].stale, true);
  assert.equal(result.items[1].qty, 0);
});

test('pricing.ts: 20 random cart scenarios maintain exact integer kobo invariants', () => {
  const discounts: Discount[] = [
    {
      id: 'd-cart',
      code: 'CORP5',
      description: '5% corporate discount',
      type: 'percent',
      value: 500,
      scope: 'cart',
      scopeIds: [],
      minSubtotalKobo: 100000000,
      usedCount: 0,
      startsAt: '2025-01-01T00:00:00Z',
      endsAt: '2028-01-01T00:00:00Z',
      active: true,
    },
  ];

  for (let i = 0; i < 20; i++) {
    const laptopQty = (i % 6) + 1;
    const printerQty = i % 4;
    const useCode = i % 2 === 0 ? 'CORP5' : undefined;
    const zoneId = i % 3 === 0 ? 'ikeja-pickup' : 'lagos-mainland';

    const res = calculateCartPricing({
      products: SAMPLE_PRODUCTS,
      cartItems: [
        { productId: 'prod-laptop-1', qty: laptopQty },
        { productId: 'prod-printer-1', qty: printerQty },
      ],
      discounts,
      discountCode: useCode,
      deliveryZones: SAMPLE_ZONES,
      deliveryZoneId: zoneId,
      now: new Date('2026-10-26T12:00:00Z'),
    });

    assert.equal(Number.isInteger(res.subtotalKobo), true);
    assert.equal(Number.isInteger(res.discountKobo), true);
    assert.equal(Number.isInteger(res.vatKobo), true);
    assert.equal(Number.isInteger(res.totalKobo), true);
    const expectedMerch = Math.max(0, res.subtotalKobo - res.discountKobo);
    assert.equal(res.vatKobo + res.netMerchandiseKobo, expectedMerch);
    assert.equal(res.totalKobo, expectedMerch + res.deliveryKobo);
  }
});

test('motion.ts & whatsapp.ts: reduced-motion disables spatial displacement and wa.me links decode accurately', () => {
  assert.equal(shouldReduceMotion('off', false), true);
  assert.equal(shouldReduceMotion('full', true), true);
  const reducedConfig = getSafeEntranceConfig({ y: 40, forceReducedMotion: true });
  assert.equal(reducedConfig.isReduced, true);
  assert.equal(reducedConfig.from.y, 0);

  const prodUrl = buildProductWhatsAppUrl(SAMPLE_PRODUCTS[0]);
  assert.ok(prodUrl.startsWith('https://wa.me/2347061766728?text='));
  const decodedProd = decodeURIComponent(prodUrl.split('?text=')[1]);
  assert.ok(decodedProd.includes('HP EliteBook 840 G10'));
  assert.ok(decodedProd.includes('12 Months'));

  const segUrl = buildSegmentWhatsAppUrl('schools');
  assert.ok(decodeURIComponent(segUrl).includes('School / ICT Lab'));

  const orderUrl = buildOrderWhatsAppUrl({
    orderRef: 'IR-84K9P2',
    items: [
      {
        productId: 'prod-laptop-1',
        slug: 'hp-elitebook-840-g10',
        nameSnapshot: 'HP EliteBook 840 G10',
        brandSnapshot: 'HP',
        unitPriceKobo: 145000000,
        qty: 2,
        lineTotalKobo: 290000000,
        warrantyMonths: 12,
        warrantyTerms: '12m warranty',
      },
    ],
    subtotalKobo: 290000000,
    discountKobo: 0,
    deliveryZoneLabel: 'Pickup at Ikeja Showroom (Lagos)',
    deliveryKobo: 0,
    vatKobo: calculateVatComponentKobo(290000000),
    totalKobo: 290000000,
    customer: {
      name: 'Adebayo Ogunlesi',
      phone: '08030001111',
      email: 'adebayo@example.com',
      address: '14 Allen Avenue, Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
    },
  });
  const decodedOrder = decodeURIComponent(orderUrl.split('?text=')[1]);
  assert.ok(decodedOrder.includes('IR-84K9P2'));
  assert.ok(decodedOrder.includes('HP EliteBook 840 G10 × 2'));
});

import crypto from 'node:crypto';
import { handlePriceCalculation } from '../api/price';
import { handleOrderCreate } from '../api/order/create';
import { handleOrderVerify } from '../api/order/verify';
import { handleOrderLookup } from '../api/order/lookup';
import { handlePaystackWebhook } from '../api/paystack/webhook';
import { handleAdminPasscode } from '../api/admin/passcode';
import { handleAdminGrant } from '../api/admin/grant';

test('API routes: /api/price rejects unknown fields with Zod and returns server totals', () => {
  const bad = handlePriceCalculation({ items: [], unknownHackField: true });
  assert.equal(bad.status, 400);

  const good = handlePriceCalculation({
    items: [{ productId: 'prod-hp-elitebook-840-g10', qty: 1 }],
    deliveryZoneId: 'ikeja-pickup',
  });
  assert.equal(good.status, 200);
  if ('totalKobo' in good.data) {
    assert.equal(good.data.totalKobo, 158000000);
  }
});

test('API routes: /api/order/create, /api/order/verify, /api/paystack/webhook idempotency, and /api/order/lookup', async () => {
  const createRes = await handleOrderCreate({
    channel: 'paystack',
    items: [{ productId: 'prod-hp-elitebook-840-g10', qty: 1 }],
    deliveryZoneId: 'ikeja-pickup',
    customer: {
      name: 'Ngozi Okonjo',
      phone: '08099887766',
      email: 'ngozi@example.com',
      address: '10 Oba Akran Avenue, Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
    },
  });

  assert.equal(createRes.status, 201);
  if (!('orderRef' in createRes.data) || !createRes.data.orderRef || !createRes.data.paystackReference) {
    assert.fail('Expected orderRef and paystackReference in response');
  }

  const { orderRef, paystackReference, totalKobo } = createRes.data;
  assert.match(orderRef, /^IR-[A-Z0-9]{6}$/);

  // Verify Paystack order
  const verifyRes1 = await handleOrderVerify({
    orderRef,
    reference: paystackReference,
  });
  assert.equal(verifyRes1.status, 200);
  if ('order' in verifyRes1.data) {
    assert.equal(verifyRes1.data.order?.status, 'paid');
    assert.equal(verifyRes1.data.idempotent, false);
  }

  // Second verification is idempotent
  const verifyRes2 = await handleOrderVerify({
    orderRef,
    reference: paystackReference!,
  });
  assert.equal(verifyRes2.status, 200);
  if ('idempotent' in verifyRes2.data) {
    assert.equal(verifyRes2.data.idempotent, true);
  }

  // Webhook replay is idempotent and validates HMAC SHA512
  const rawPayload = JSON.stringify({
    event: 'charge.success',
    data: {
      reference: paystackReference,
      amount: totalKobo,
      currency: 'NGN',
      status: 'success',
      metadata: { orderRef },
    },
  });
  const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_illai_rhasak_webhook_secret';
  const sig = crypto.createHmac('sha512', secret).update(rawPayload).digest('hex');

  const webhookRes = handlePaystackWebhook(rawPayload, sig, JSON.parse(rawPayload));
  assert.equal(webhookRes.status, 200);
  if ('idempotent' in webhookRes.data) {
    assert.equal(webhookRes.data.idempotent, true);
  }

  // Lookup protection: wrong phone fails with 403, right phone succeeds with 200
  const wrongLookup = handleOrderLookup({ orderRef, phone: '08011112222' });
  assert.equal(wrongLookup.status, 403);

  const rightLookup = handleOrderLookup({ orderRef, phone: '+2348099887766' });
  assert.equal(rightLookup.status, 200);
});

test('API routes: /api/admin/passcode and /api/admin/grant enforce server security', () => {
  const wrongPass = handleAdminPasscode({ passcode: 'wrong-code' });
  assert.equal(wrongPass.status, 401);

  const rightPass = handleAdminPasscode({
    passcode: 'IR-IKEJA-2026',
    email: 'junestudioimagineai@gmail.com',
  });
  assert.equal(rightPass.status, 200);

  const unauthorizedGrant = handleAdminGrant({
    requesterEmail: 'intruder@example.com',
    targetEmail: 'staff@example.com',
    role: 'assets',
  });
  assert.equal(unauthorizedGrant.status, 403);

  const ownerGrant = handleAdminGrant({
    requesterEmail: 'junestudioimagineai@gmail.com',
    targetEmail: 'catalog@illairhasak.ng',
    role: 'assets',
  });
  assert.equal(ownerGrant.status, 200);
});
