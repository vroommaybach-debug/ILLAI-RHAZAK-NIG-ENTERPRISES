import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_DISCOUNTS, SEED_PRODUCTS, SEED_SITE_SETTINGS } from '../../content/seedData';
import { calculateCartPricing } from '../../lib/pricing';
import {
  CartItemInput,
  DeliveryZone,
  Discount,
  PricingCalculationResult,
  Product,
} from '../../types';

function createAnonymousSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ir-sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface CartStoreState {
  sessionId: string;
  items: CartItemInput[];
  discountCode: string;
  deliveryZoneId: string;
  isDrawerOpen: boolean;
  isSyncingPrice: boolean;
  toastMessage: string | null;
  pricing: PricingCalculationResult;
  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  clearToast: () => void;
  showToast: (msg: string) => void;
  addItem: (product: Product, qtyToAdd?: number, allProducts?: Product[]) => void;
  updateQty: (productId: string, newQty: number, allProducts?: Product[]) => void;
  removeItem: (productId: string, allProducts?: Product[]) => void;
  clearCart: () => void;
  setDiscountCode: (code: string, allProducts?: Product[]) => void;
  setDeliveryZoneId: (zoneId: string, allProducts?: Product[]) => void;
  refreshPricingFromServer: (catalogOverride?: {
    products?: Product[];
    discounts?: Discount[];
    deliveryZones?: DeliveryZone[];
  }) => Promise<void>;
}

let priceDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function computeLocalFallbackPricing(
  items: CartItemInput[],
  discountCode: string,
  deliveryZoneId: string,
  products: Product[] = SEED_PRODUCTS,
  discounts: Discount[] = SEED_DISCOUNTS,
  deliveryZones: DeliveryZone[] = SEED_SITE_SETTINGS.deliveryZones
): PricingCalculationResult {
  return calculateCartPricing({
    products,
    cartItems: items,
    discounts,
    discountCode: discountCode || undefined,
    deliveryZones,
    deliveryZoneId,
  });
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      sessionId: createAnonymousSessionId(),
      items: [],
      discountCode: '',
      deliveryZoneId: 'ikeja-pickup',
      isDrawerOpen: false,
      isSyncingPrice: false,
      toastMessage: null,
      pricing: computeLocalFallbackPricing([], '', 'ikeja-pickup'),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      clearToast: () => set({ toastMessage: null }),
      showToast: (msg: string) => {
        set({ toastMessage: msg });
        setTimeout(() => {
          if (get().toastMessage === msg) {
            set({ toastMessage: null });
          }
        }, 4000);
      },

      addItem: (product, qtyToAdd = 1, allProducts = SEED_PRODUCTS) => {
        const state = get();
        const existing = state.items.find((i) => i.productId === product.id);
        const currentQty = existing ? existing.qty : 0;
        const desiredQty = currentQty + qtyToAdd;
        const maxStock = Math.max(0, product.stockQty);

        if (maxStock === 0) {
          state.showToast(`${product.name} is currently out of stock.`);
          return;
        }

        const clampedQty = Math.min(desiredQty, maxStock);
        const wasClamped = desiredQty > maxStock;

        const nextItems = existing
          ? state.items.map((i) =>
              i.productId === product.id ? { ...i, qty: clampedQty } : i
            )
          : [
              ...state.items,
              {
                productId: product.id,
                qty: clampedQty,
                addedAt: new Date().toISOString(),
              },
            ];

        const nextPricing = computeLocalFallbackPricing(
          nextItems,
          state.discountCode,
          state.deliveryZoneId,
          allProducts
        );

        set({
          items: nextItems,
          pricing: nextPricing,
          isDrawerOpen: true,
        });

        if (wasClamped) {
          state.showToast(
            `Quantity clamped to ${maxStock} (maximum available stock for ${product.name}).`
          );
        } else {
          state.showToast(`Added ${product.name} to your cart.`);
        }

        if (priceDebounceTimer) clearTimeout(priceDebounceTimer);
        priceDebounceTimer = setTimeout(() => {
          void get().refreshPricingFromServer({ products: allProducts });
        }, 250);
      },

      updateQty: (productId, newQty, allProducts = SEED_PRODUCTS) => {
        const state = get();
        const product = allProducts.find((p) => p.id === productId);
        const maxStock = product ? product.stockQty : 99;

        if (newQty <= 0) {
          get().removeItem(productId, allProducts);
          return;
        }

        const clampedQty = Math.min(newQty, maxStock);
        const wasClamped = newQty > maxStock;

        const nextItems = state.items.map((i) =>
          i.productId === productId ? { ...i, qty: clampedQty } : i
        );

        const nextPricing = computeLocalFallbackPricing(
          nextItems,
          state.discountCode,
          state.deliveryZoneId,
          allProducts
        );

        set({
          items: nextItems,
          pricing: nextPricing,
        });

        if (wasClamped && product) {
          state.showToast(
            `Maximum available stock for ${product.name} is ${maxStock} units.`
          );
        }

        if (priceDebounceTimer) clearTimeout(priceDebounceTimer);
        priceDebounceTimer = setTimeout(() => {
          void get().refreshPricingFromServer({ products: allProducts });
        }, 250);
      },

      removeItem: (productId, allProducts = SEED_PRODUCTS) => {
        const state = get();
        const nextItems = state.items.filter((i) => i.productId !== productId);
        const nextPricing = computeLocalFallbackPricing(
          nextItems,
          state.discountCode,
          state.deliveryZoneId,
          allProducts
        );
        set({ items: nextItems, pricing: nextPricing });

        if (priceDebounceTimer) clearTimeout(priceDebounceTimer);
        priceDebounceTimer = setTimeout(() => {
          void get().refreshPricingFromServer({ products: allProducts });
        }, 250);
      },

      clearCart: () => {
        const state = get();
        set({
          items: [],
          discountCode: '',
          pricing: computeLocalFallbackPricing([], '', state.deliveryZoneId),
        });
      },

      setDiscountCode: (code, allProducts = SEED_PRODUCTS) => {
        const state = get();
        const normalized = code.trim().toUpperCase();
        const nextPricing = computeLocalFallbackPricing(
          state.items,
          normalized,
          state.deliveryZoneId,
          allProducts
        );
        set({ discountCode: normalized, pricing: nextPricing });

        if (priceDebounceTimer) clearTimeout(priceDebounceTimer);
        priceDebounceTimer = setTimeout(() => {
          void get().refreshPricingFromServer({ products: allProducts });
        }, 250);
      },

      setDeliveryZoneId: (zoneId, allProducts = SEED_PRODUCTS) => {
        const state = get();
        const nextPricing = computeLocalFallbackPricing(
          state.items,
          state.discountCode,
          zoneId,
          allProducts
        );
        set({ deliveryZoneId: zoneId, pricing: nextPricing });

        if (priceDebounceTimer) clearTimeout(priceDebounceTimer);
        priceDebounceTimer = setTimeout(() => {
          void get().refreshPricingFromServer({ products: allProducts });
        }, 250);
      },

      refreshPricingFromServer: async (catalogOverride) => {
        const state = get();
        set({ isSyncingPrice: true });
        try {
          const response = await fetch('/api/price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: state.items,
              discountCode: state.discountCode || undefined,
              deliveryZoneId: state.deliveryZoneId,
            }),
          });
          if (response.ok) {
            const serverPricing = (await response.json()) as PricingCalculationResult;
            set({ pricing: serverPricing, isSyncingPrice: false });
            return;
          }
        } catch {
          // Fallback to deterministic local pricing calculation if offline
        }
        const fallback = computeLocalFallbackPricing(
          state.items,
          state.discountCode,
          state.deliveryZoneId,
          catalogOverride?.products ?? SEED_PRODUCTS,
          catalogOverride?.discounts ?? SEED_DISCOUNTS,
          catalogOverride?.deliveryZones ?? SEED_SITE_SETTINGS.deliveryZones
        );
        set({ pricing: fallback, isSyncingPrice: false });
      },
    }),
    {
      name: 'ir-cart-v1',
      partialize: (state) => ({
        sessionId: state.sessionId,
        items: state.items,
        discountCode: state.discountCode,
        deliveryZoneId: state.deliveryZoneId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          void state.refreshPricingFromServer();
        }
      },
    }
  )
);
