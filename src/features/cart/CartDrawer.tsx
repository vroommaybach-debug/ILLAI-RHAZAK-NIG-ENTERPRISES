import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { formatNgnFromKobo } from '../../lib/money';
import { buildCartPreviewWhatsAppUrl } from '../../lib/whatsapp';
import { Button } from '../../components/ui';
import { useCartStore } from './cartStore';

export const CartDrawer: React.FC = () => {
  const { products, siteSettings } = useAppData();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  const {
    isDrawerOpen,
    closeDrawer,
    pricing,
    discountCode,
    deliveryZoneId,
    isSyncingPrice,
    toastMessage,
    clearToast,
    updateQty,
    removeItem,
    setDiscountCode,
    setDeliveryZoneId,
  } = useCartStore();

  const [codeDraft, setCodeDraft] = useState(discountCode);

  useEffect(() => {
    setCodeDraft(discountCode);
  }, [discountCode]);

  // Escape key handler for WCAG 2.2 AA accessibility per A14
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const whatsappCartUrl = buildCartPreviewWhatsAppUrl(
    pricing.items,
    pricing.totalKobo,
    pricing.deliveryZoneLabel,
    siteSettings.whatsappNumber
  );

  return (
    <>
      {/* Global Toast Notification for Stock Clamping / Cart Actions */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-[#38BDF8]/40 bg-[#0F1524] px-4 py-3 text-xs font-medium text-[#F4F6FB] shadow-2xl"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={clearToast}
            aria-label="Dismiss notification"
            className="text-[#9AA3B8] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!isDrawerOpen ? null : (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
          onClick={closeDrawer}
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart drawer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-white/12 bg-[#0A0E18] text-[#F4F6FB] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold">Your Hardware Cart</h2>
                <p className="text-xs text-[#9AA3B8]">
                  All prices include 7.5% VAT · Server-verified totals
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close shopping cart"
                className="rounded-full border border-white/15 p-2 text-[#9AA3B8] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {pricing.items.length === 0 ? (
                <div className="py-14 text-center space-y-4">
                  <p className="text-sm text-[#9AA3B8]">
                    Your cart is currently empty. Browse our factory-sealed laptops, desktops, printers, and scanners.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      closeDrawer();
                      navigate('/shop');
                    }}
                  >
                    Browse Hardware Catalog
                  </Button>
                </div>
              ) : (
                <>
                  {pricing.hasStaleItems && (
                    <div className="rounded-xl border border-[#EF2B3A]/50 bg-[#EF2B3A]/10 p-3 text-xs text-[#F4F6FB]">
                      One or more items in your cart are out of stock or archived and have been excluded from your total.
                    </div>
                  )}

                  {pricing.items.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-white/10 bg-[#0F1524] p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#38BDF8]">{item.brand}</p>
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={closeDrawer}
                            className="text-sm font-semibold text-[#F4F6FB] hover:text-[#38BDF8]"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] text-[#9AA3B8] flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#F5B93A]" />
                            <span>{item.warrantyMonths}-Month Product Warranty</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, products)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="text-[#9AA3B8] hover:text-[#EF2B3A] p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.stale ? (
                        <p className="text-xs font-medium text-[#EF2B3A]">
                          {item.staleReason || 'Currently unavailable'}
                        </p>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#05070D] px-2.5 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateQty(item.productId, item.qty - 1, products)
                              }
                              aria-label={`Decrease quantity for ${item.name}`}
                              className="p-1 text-[#9AA3B8] hover:text-white cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="font-mono-tabular text-xs font-semibold px-2">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQty(item.productId, item.qty + 1, products)
                              }
                              aria-label={`Increase quantity for ${item.name}`}
                              className="p-1 text-[#9AA3B8] hover:text-white cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="font-mono-tabular text-sm font-bold text-[#F4F6FB]">
                              {formatNgnFromKobo(item.lineTotalKobo)}
                            </p>
                            {item.clamped && (
                              <p className="text-[11px] text-[#F5B93A]">
                                Max stock reached
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Discount Code Input */}
                  <div className="rounded-2xl border border-white/10 bg-[#0F1524] p-4 space-y-2">
                    <label
                      htmlFor="drawer-discount-input"
                      className="block text-xs font-medium text-[#9AA3B8]"
                    >
                      Discount Code (Try <span className="text-[#F5B93A] font-mono-tabular">SCHOOL10</span> or <span className="text-[#F5B93A] font-mono-tabular">LAGOS50K</span>)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="drawer-discount-input"
                        type="text"
                        value={codeDraft}
                        onChange={(e) => setCodeDraft(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white uppercase focus:border-[#38BDF8] focus:outline-none"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDiscountCode(codeDraft, products)}
                      >
                        Apply
                      </Button>
                    </div>
                    {pricing.discountReason && discountCode && (
                      <p
                        className={`text-[11px] ${
                          pricing.discountApplied ? 'text-[#38BDF8]' : 'text-[#F5B93A]'
                        }`}
                      >
                        {pricing.discountReason}
                      </p>
                    )}
                  </div>

                  {/* Delivery Zone Selector */}
                  <div className="rounded-2xl border border-white/10 bg-[#0F1524] p-4 space-y-2">
                    <label
                      htmlFor="drawer-zone-select"
                      className="block text-xs font-medium text-[#9AA3B8]"
                    >
                      Delivery or Ikeja Pickup Zone
                    </label>
                    <select
                      id="drawer-zone-select"
                      value={deliveryZoneId}
                      onChange={(e) => setDeliveryZoneId(e.target.value, products)}
                      className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
                    >
                      {siteSettings.deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label} — {formatNgnFromKobo(zone.feeKobo)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Footer Totals */}
            {pricing.items.length > 0 && (
              <div className="border-t border-white/10 bg-[#05070D] px-6 py-5 space-y-3">
                <div className="space-y-1.5 text-xs">
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
                    <span>Delivery ({pricing.deliveryZoneLabel})</span>
                    <span className="font-mono-tabular text-[#F4F6FB]">
                      {formatNgnFromKobo(pricing.deliveryKobo)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#9AA3B8]/80 pt-1 border-t border-white/8">
                    <span>Included 7.5% VAT Component (Not added on top)</span>
                    <span className="font-mono-tabular">
                      {formatNgnFromKobo(pricing.vatKobo)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                    <span className="text-sm font-semibold text-[#F4F6FB]">
                      Total Payable {isSyncingPrice ? '(Syncing...)' : ''}
                    </span>
                    <span className="font-mono-tabular text-lg font-bold text-[#F5B93A]">
                      {formatNgnFromKobo(pricing.totalKobo)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      closeDrawer();
                      navigate('/checkout');
                    }}
                  >
                    Proceed to Checkout (Paystack or WhatsApp)
                  </Button>
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to="/cart"
                      onClick={closeDrawer}
                      className="flex-1 text-center rounded-full border border-white/15 py-2 text-xs font-semibold text-[#9AA3B8] hover:text-white"
                    >
                      Full Cart View
                    </Link>
                    <a
                      href={whatsappCartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center rounded-full border border-[#38BDF8]/40 bg-[#0F1524] py-2 text-xs font-semibold text-[#38BDF8] hover:bg-[#162038]"
                    >
                      Quick WhatsApp Chat
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
