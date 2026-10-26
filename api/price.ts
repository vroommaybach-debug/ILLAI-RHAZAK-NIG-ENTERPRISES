import { z } from 'zod';
import { calculateCartPricing } from '../src/lib/pricing';
import { serverState } from '../src/server/storeState';

export const PriceRequestSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(128),
            qty: z.number().int().min(0).max(999),
            addedAt: z.string().optional(),
          })
          .strict()
      )
      .max(100),
    discountCode: z.string().max(40).optional(),
    deliveryZoneId: z.string().max(64).optional(),
    audienceTag: z.enum(['retail', 'education', 'bulk']).optional(),
  })
  .strict();

export function handlePriceCalculation(body: unknown) {
  const parsed = PriceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: 'Invalid pricing request payload',
        details: parsed.error.flatten(),
      },
    };
  }

  const result = calculateCartPricing({
    products: serverState.products,
    cartItems: parsed.data.items,
    discounts: serverState.discounts,
    discountCode: parsed.data.discountCode,
    deliveryZones: serverState.siteSettings.deliveryZones,
    deliveryZoneId: parsed.data.deliveryZoneId,
    audienceTag: parsed.data.audienceTag,
    vatRate: serverState.siteSettings.vatRate,
  });

  return {
    status: 200,
    data: result,
  };
}
