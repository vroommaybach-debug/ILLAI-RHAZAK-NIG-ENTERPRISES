import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { Button, Card, Eyebrow, Section } from '../../components/ui';
import { formatNgnFromKobo } from '../../lib/money';
import { useCartStore } from './cartStore';

export const CartPage: React.FC = () => {
  const { products, siteSettings } = useAppData();
  const navigate = useNavigate();
  const {
    pricing,
    discountCode,
    deliveryZoneId,
    updateQty,
    removeItem,
    setDiscountCode,
    setDeliveryZoneId,
    clearCart,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState(discountCode);

  return (
    <Section>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Eyebrow>Shopping Cart · Server-Verified Kobo Math</Eyebrow>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F4F6FB]">
              Your Hardware Selection
            </h1>
          </div>
          {pricing.items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-medium text-[#9AA3B8] hover:text-[#EF2B3A] cursor-pointer"
            >
              Clear Entire Cart
            </button>
          )}
        </div>

        {pricing.items.length === 0 ? (
          <Card className="py-16 text-center space-y-4">
            <h2 className="font-display text-xl font-bold">Your cart is empty</h2>
            <p className="text-sm text-[#9AA3B8] max-w-md mx-auto">
              Add brand-new laptops, desktops, printers, or scanners from our catalog to calculate VAT-inclusive totals and delivery.
            </p>
            <Button onClick={() => navigate('/shop')}>Browse Catalog</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {pricing.items.map((item) => (
                <Card
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#38BDF8]">
                      {item.brand} · {item.categoryId.toUpperCase()}
                    </p>
                    <Link
                      to={`/product/${item.slug}`}
                      className="font-display text-lg font-bold text-[#F4F6FB] hover:text-[#38BDF8]"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[#9AA3B8] flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#F5B93A]" />
                      <span>
                        {item.warrantyMonths}-Month Per-Product Warranty · Unit:{' '}
                        {formatNgnFromKobo(item.unitPriceKobo)}
                      </span>
                    </p>
                    {item.stale && (
                      <p className="text-xs font-semibold text-[#EF2B3A]">
                        {item.staleReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    {!item.stale && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#05070D] px-3 py-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(item.productId, item.qty - 1, products)
                          }
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="p-1 text-[#9AA3B8] hover:text-white cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono-tabular text-xs font-bold px-2">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(item.productId, item.qty + 1, products)
                          }
                          aria-label={`Increase quantity of ${item.name}`}
                          className="p-1 text-[#9AA3B8] hover:text-white cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="text-right min-w-[130px]">
                      <p className="font-mono-tabular text-base font-bold text-[#F4F6FB]">
                        {formatNgnFromKobo(item.lineTotalKobo)}
                      </p>
                      {item.clamped && (
                        <span className="text-[11px] text-[#F5B93A]">
                          Clamped to max stock
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, products)}
                      aria-label={`Remove ${item.name}`}
                      className="text-[#9AA3B8] hover:text-[#EF2B3A] p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Column */}
            <Card elevated className="lg:col-span-4 space-y-5">
              <h2 className="font-display text-xl font-bold">Order Summary</h2>

              <div className="space-y-2">
                <label
                  htmlFor="cart-promo"
                  className="block text-xs font-medium text-[#9AA3B8]"
                >
                  Discount Code (<span className="text-[#F5B93A]">SCHOOL10</span>, <span className="text-[#F5B93A]">LAGOS50K</span>, <span className="text-[#F5B93A]">PRINT5</span>)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cart-promo"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white uppercase"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDiscountCode(promoInput, products)}
                  >
                    Apply
                  </Button>
                </div>
                {discountCode && (
                  <p
                    className={`text-xs ${
                      pricing.discountApplied ? 'text-[#38BDF8]' : 'text-[#F5B93A]'
                    }`}
                  >
                    {pricing.discountReason}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cart-zone"
                  className="block text-xs font-medium text-[#9AA3B8]"
                >
                  Delivery Zone or Ikeja Pickup
                </label>
                <select
                  id="cart-zone"
                  value={deliveryZoneId}
                  onChange={(e) => setDeliveryZoneId(e.target.value, products)}
                  className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                >
                  {siteSettings.deliveryZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.label} ({formatNgnFromKobo(zone.feeKobo)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
                <div className="flex justify-between text-[#9AA3B8]">
                  <span>Subtotal (VAT Inclusive)</span>
                  <span className="font-mono-tabular text-[#F4F6FB]">
                    {formatNgnFromKobo(pricing.subtotalKobo)}
                  </span>
                </div>
                {pricing.discountKobo > 0 && (
                  <div className="flex justify-between text-[#38BDF8]">
                    <span>Discount ({pricing.discountCode})</span>
                    <span className="font-mono-tabular">
                      -{formatNgnFromKobo(pricing.discountKobo)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#9AA3B8]">
                  <span>Delivery Fee</span>
                  <span className="font-mono-tabular text-[#F4F6FB]">
                    {formatNgnFromKobo(pricing.deliveryKobo)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#9AA3B8] pt-1 border-t border-white/8">
                  <span>Embedded 7.5% VAT Breakdown</span>
                  <span className="font-mono-tabular">
                    {formatNgnFromKobo(pricing.vatKobo)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                  <span className="text-sm font-bold text-[#F4F6FB]">Total Payable</span>
                  <span className="font-mono-tabular text-2xl font-bold text-[#F5B93A]">
                    {formatNgnFromKobo(pricing.totalKobo)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/checkout')}
              >
                Continue to Checkout
              </Button>
            </Card>
          </div>
        )}
      </div>
    </Section>
  );
};
