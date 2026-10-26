import { z } from 'zod';
import { serverState } from '../../src/server/storeState';

export const VerifyOrderSchema = z
  .object({
    orderRef: z.string().regex(/^IR-[A-Z0-9]{6}$/),
    reference: z.string().min(4).max(128),
  })
  .strict();

export async function handleOrderVerify(body: unknown) {
  const parsed = VerifyOrderSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: 'Invalid payment verification payload',
        details: parsed.error.flatten(),
      },
    };
  }

  const { orderRef, reference } = parsed.data;
  const order = serverState.orders.get(orderRef);

  if (!order) {
    return {
      status: 404,
      data: { error: 'Order reference not found.' },
    };
  }

  // Idempotent return if already paid
  if (order.status === 'paid') {
    return {
      status: 200,
      data: {
        verified: true,
        idempotent: true,
        order,
      },
    };
  }

  if (order.paystackReference && order.paystackReference !== reference) {
    return {
      status: 400,
      data: { error: 'Paystack reference mismatch for this order.' },
    };
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (paystackSecret && paystackSecret.startsWith('sk_')) {
    try {
      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
          },
        }
      );
      const payload = (await res.json()) as {
        status?: boolean;
        data?: { status?: string; amount?: number; currency?: string };
      };

      if (
        !payload.status ||
        payload.data?.status !== 'success' ||
        payload.data?.amount !== order.totalKobo ||
        payload.data?.currency !== 'NGN'
      ) {
        return {
          status: 400,
          data: {
            error:
              'Paystack verification failed: transaction status, amount in kobo, or currency NGN did not match.',
          },
        };
      }
    } catch {
      return {
        status: 502,
        data: { error: 'Unable to reach Paystack verification endpoint.' },
      };
    }
  }

  // Mark order paid and decrement stock once
  order.status = 'paid';
  order.updatedAt = new Date().toISOString();
  serverState.processedWebhookRefs.add(reference);

  for (const item of order.items) {
    const product = serverState.products.find((p) => p.id === item.productId);
    if (product) {
      product.stockQty = Math.max(0, product.stockQty - item.qty);
      product.stockStatus =
        product.stockQty === 0 ? 'out' : product.stockQty <= 4 ? 'low' : 'in_stock';
    }
  }

  return {
    status: 200,
    data: {
      verified: true,
      idempotent: false,
      order,
    },
  };
}
