import { z } from 'zod';
import { normalizePhoneForComparison, serverState } from '../../src/server/storeState';

export const OrderLookupSchema = z
  .object({
    orderRef: z
      .string()
      .transform((s) => s.trim().toUpperCase())
      .refine((s) => /^IR-[A-Z0-9]{6}$/.test(s), {
        message: 'Order reference must be in the format IR-XXXXXX',
      }),
    phone: z.string().min(6).max(30).optional(),
  })
  .strict();

export function handleOrderLookup(body: unknown) {
  const parsed = OrderLookupSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: 'Invalid Order Reference format.',
        details: parsed.error.flatten(),
      },
    };
  }

  const { orderRef, phone } = parsed.data;
  const order = serverState.orders.get(orderRef);

  if (!order) {
    return {
      status: 404,
      data: { error: 'No order found matching that reference.' },
    };
  }

  if (phone) {
    const expectedSuffix = normalizePhoneForComparison(order.customer.phone);
    const providedSuffix = normalizePhoneForComparison(phone);

    if (!expectedSuffix || expectedSuffix !== providedSuffix) {
      return {
        status: 403,
        data: { error: 'Phone number does not match the contact recorded for this order.' },
      };
    }
  }

  return {
    status: 200,
    data: { order },
  };
}
