import crypto from 'node:crypto';
import { z } from 'zod';
import { serverState } from '../../src/server/storeState';

export const PaystackWebhookSchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        reference: z.string(),
        amount: z.number().int(),
        currency: z.string(),
        status: z.string(),
        metadata: z
          .object({
            orderRef: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();

export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) return false;
  const expected = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  if (expected.length !== signatureHeader.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

export function handlePaystackWebhook(
  rawBody: string,
  signatureHeader: string | undefined,
  parsedBody: unknown
) {
  const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_illai_rhasak_webhook_secret';

  if (!verifyPaystackSignature(rawBody, signatureHeader, secret)) {
    return {
      status: 401,
      data: { error: 'Invalid x-paystack-signature header.' },
    };
  }

  const parsed = PaystackWebhookSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return {
      status: 400,
      data: { error: 'Malformed webhook payload.' },
    };
  }

  const { event, data } = parsed.data;

  // Idempotency guard keyed on Paystack reference per A8 & A13
  if (serverState.processedWebhookRefs.has(data.reference)) {
    return {
      status: 200,
      data: { received: true, idempotent: true },
    };
  }

  if (event === 'charge.success' && data.status === 'success') {
    const orderRef = data.metadata?.orderRef;
    const order = orderRef
      ? serverState.orders.get(orderRef)
      : Array.from(serverState.orders.values()).find(
          (o) => o.paystackReference === data.reference
        );

    if (
      order &&
      data.amount === order.totalKobo &&
      data.currency.toUpperCase() === 'NGN'
    ) {
      order.status = 'paid';
      order.updatedAt = new Date().toISOString();
      serverState.processedWebhookRefs.add(data.reference);
      return {
        status: 200,
        data: { received: true, idempotent: false, orderRef: order.orderRef },
      };
    }
  }

  return {
    status: 200,
    data: { received: true, idempotent: false },
  };
}
