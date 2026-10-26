import { z } from 'zod';
import { calculateCartPricing } from '../../src/lib/pricing';
import { buildOrderWhatsAppUrl } from '../../src/lib/whatsapp';
import { generateOrderRef, serverState } from '../../src/server/storeState';
import { Order } from '../../src/types';

export const CreateOrderSchema = z
  .object({
    channel: z.enum(['paystack', 'whatsapp']),
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(128),
            qty: z.number().int().min(1).max(999),
          })
          .strict()
      )
      .min(1)
      .max(50),
    discountCode: z.string().max(40).optional(),
    deliveryZoneId: z.string().min(1).max(64),
    customer: z
      .object({
        name: z.string().min(2).max(120),
        phone: z.string().min(7).max(30),
        email: z.string().email().max(160),
        address: z.string().min(4).max(300),
        state: z.string().min(2).max(80),
        country: z.string().min(2).max(80).default('Nigeria'),
        notes: z.string().max(500).optional(),
      })
      .strict(),
  })
  .strict();

export async function handleOrderCreate(body: unknown) {
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: 'Invalid checkout submission. Please check all required customer fields.',
        details: parsed.error.flatten(),
      },
    };
  }

  const { channel, items, discountCode, deliveryZoneId, customer } = parsed.data;

  const pricing = calculateCartPricing({
    products: serverState.products,
    cartItems: items,
    discounts: serverState.discounts,
    discountCode,
    deliveryZones: serverState.siteSettings.deliveryZones,
    deliveryZoneId,
    vatRate: serverState.siteSettings.vatRate,
  });

  const validItems = pricing.items.filter((i) => !i.stale && i.qty > 0);
  if (validItems.length === 0 || pricing.totalKobo <= 0) {
    return {
      status: 400,
      data: {
        error: 'Your cart has no available in-stock items to checkout.',
      },
    };
  }

  let orderRef = generateOrderRef();
  while (serverState.orders.has(orderRef)) {
    orderRef = generateOrderRef();
  }

  const nowIso = new Date().toISOString();
  const paystackRef = channel === 'paystack' ? `PSTK_${orderRef}_${Date.now()}` : undefined;

  const order: Order = {
    orderRef,
    status: channel === 'paystack' ? 'pending_payment' : 'pending_whatsapp',
    channel,
    items: validItems.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      nameSnapshot: item.name,
      brandSnapshot: item.brand,
      unitPriceKobo: item.unitPriceKobo,
      qty: item.qty,
      lineTotalKobo: item.lineTotalKobo,
      warrantyMonths: item.warrantyMonths,
      warrantyTerms: item.warrantyTerms,
    })),
    subtotalKobo: pricing.subtotalKobo,
    discountKobo: pricing.discountKobo,
    discountCode: pricing.discountApplied ? pricing.discountCode : undefined,
    deliveryZoneId: pricing.deliveryZoneId,
    deliveryZoneLabel: pricing.deliveryZoneLabel,
    deliveryKobo: pricing.deliveryKobo,
    vatKobo: pricing.vatKobo,
    totalKobo: pricing.totalKobo,
    customer,
    paystackReference: paystackRef,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Increment discount usedCount if applied
  if (pricing.discountApplied && pricing.discountCode) {
    const disc = serverState.discounts.find(
      (d) => d.code?.toUpperCase() === pricing.discountCode?.toUpperCase()
    );
    if (disc) {
      disc.usedCount += 1;
    }
  }

  // If Paystack secret key is configured in production, initialize via Paystack API;
  // otherwise provide deterministic test-mode initialization metadata
  let paystackAuthorizationUrl = `/order/${orderRef}?paystack_test=1&reference=${paystackRef}`;
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  if (channel === 'paystack' && paystackSecret && paystackSecret.startsWith('sk_')) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customer.email,
          amount: order.totalKobo, // integer kobo
          currency: 'NGN',
          reference: paystackRef,
          metadata: {
            orderRef: order.orderRef,
          },
        }),
      });
      const json = (await response.json()) as {
        status?: boolean;
        data?: { authorization_url?: string; reference?: string };
      };
      if (json.status && json.data?.authorization_url) {
        paystackAuthorizationUrl = json.data.authorization_url;
      }
    } catch {
      // Fall back cleanly to test simulation mode when external network is unavailable
    }
  }

  order.paystackAuthorizationUrl =
    channel === 'paystack' ? paystackAuthorizationUrl : undefined;
  serverState.orders.set(order.orderRef, order);

  const whatsappUrl =
    channel === 'whatsapp'
      ? buildOrderWhatsAppUrl(order, serverState.siteSettings.whatsappNumber)
      : undefined;

  return {
    status: 201,
    data: {
      orderRef: order.orderRef,
      status: order.status,
      channel: order.channel,
      totalKobo: order.totalKobo,
      paystackReference: order.paystackReference,
      paystackAuthorizationUrl: order.paystackAuthorizationUrl,
      whatsappUrl,
      order,
    },
  };
}
