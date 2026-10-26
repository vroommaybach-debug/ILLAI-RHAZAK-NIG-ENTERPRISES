import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { Button, Card, Eyebrow, Section } from '../../components/ui';
import { formatNgnFromKobo } from '../../lib/money';
import { Order, OrderChannel } from '../../types';
import { useCartStore } from '../cart/cartStore';

export const CheckoutPage: React.FC = () => {
  const { products, siteSettings, saveOrder } = useAppData();
  const navigate = useNavigate();

  const {
    pricing,
    discountCode,
    deliveryZoneId,
    setDeliveryZoneId,
    clearCart,
  } = useCartStore();

  const [channel, setChannel] = useState<OrderChannel>('paystack');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stateRegion, setStateRegion] = useState('Lagos');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validItems = pricing.items.filter((i) => !i.stale && i.qty > 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (validItems.length === 0) {
      setErrorMsg('Your cart is empty. Please add at least one machine before checking out.');
      return;
    }

    if (
      name.trim().length < 2 ||
      phone.trim().length < 7 ||
      !email.includes('@') ||
      address.trim().length < 4
    ) {
      setErrorMsg('Please complete all required customer contact and delivery fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          items: validItems.map((i) => ({
            productId: i.productId,
            qty: i.qty,
          })),
          discountCode: discountCode || undefined,
          deliveryZoneId,
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            state: stateRegion.trim(),
            country: 'Nigeria',
            notes: notes.trim() || undefined,
          },
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        orderRef?: string;
        paystackReference?: string;
        whatsappUrl?: string;
        order?: Order;
      };

      if (!response.ok || !data.orderRef) {
        setErrorMsg(data.error || 'Unable to create order. Please review your details.');
        setIsSubmitting(false);
        return;
      }

      let finalOrder = data.order;

      if (channel === 'paystack' && data.paystackReference) {
        const verifyRes = await fetch('/api/order/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef: data.orderRef,
            reference: data.paystackReference,
          }),
        });
        const verifyJson = (await verifyRes.json()) as { order?: Order };
        if (verifyJson.order) {
          finalOrder = verifyJson.order;
        }
      }

      if (finalOrder) {
        sessionStorage.setItem(`ir-order-${data.orderRef}`, JSON.stringify(finalOrder));
        await saveOrder(finalOrder);
      }

      clearCart();
      setIsSubmitting(false);
      navigate(`/order/${data.orderRef}`);
    } catch {
      setErrorMsg('Network error while submitting order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Section>
      <div className="space-y-8">
        <div className="space-y-2 border-b border-[var(--line)] pb-6">
          <Eyebrow>Dual-Channel Checkout &middot; Ikeja, Lagos</Eyebrow>
          <h1 className="font-display text-3xl sm:text-5xl font-bold">
            Complete Your Order
          </h1>
          <p className="lead">
            Pay online via Paystack (Card / Bank Transfer) or generate an official WhatsApp Order Reference for our Ikeja sales desk.
          </p>
        </div>

        <form
          onSubmit={handleCheckoutSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Customer Details & Channel Selection */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="space-y-4">
              <h2 className="font-display text-xl font-bold">
                1. Choose Your Checkout Channel
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setChannel('paystack')}
                  className={`rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    channel === 'paystack'
                      ? 'border-[#38bdf8] bg-[#2563ff]/15'
                      : 'border-[var(--line)] bg-[#05070d] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-base font-bold">
                      Pay Online (Paystack)
                    </span>
                    <CreditCard className="h-4 w-4 text-[#38bdf8]" />
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Instant NGN Card, Bank Transfer, or USSD verification synced with Firebase.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'border-[#f5b93a] bg-[#f5b93a]/10'
                      : 'border-[var(--line)] bg-[#05070d] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-base font-bold">
                      Order on WhatsApp
                    </span>
                    <MessageSquare className="h-4 w-4 text-[#f5b93a]" />
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Creates your order in Firebase and opens WhatsApp ({siteSettings.whatsappDisplay}) with itemized totals.
                  </p>
                </button>
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="font-display text-xl font-bold">
                2. Buyer &amp; Delivery Information
              </h2>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#ef2b3a]/50 bg-[#ef2b3a]/15 p-3 text-xs text-white"
                >
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                  >
                    Full Name or Company Name *
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Adebayo Ogunlesi"
                    className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08031234567"
                    className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="buyer@company.com"
                    className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-state"
                    className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                  >
                    Delivery State *
                  </label>
                  <input
                    id="checkout-state"
                    type="text"
                    required
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="Lagos, FCT Abuja, Rivers..."
                    className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="checkout-zone"
                  className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                >
                  Delivery Zone / Ikeja Showroom Pickup *
                </label>
                <select
                  id="checkout-zone"
                  value={deliveryZoneId}
                  onChange={(e) => setDeliveryZoneId(e.target.value, products)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                >
                  {siteSettings.deliveryZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.label} — {formatNgnFromKobo(zone.feeKobo)} ({zone.etaDays})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                >
                  Street Address (or &quot;Ikeja Showroom Pickup&quot;) *
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 Allen Avenue, Ikeja, Lagos"
                  className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-notes"
                  className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                >
                  Order Notes / Company TIN (Optional)
                </label>
                <textarea
                  id="checkout-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery instructions..."
                  className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-3.5 py-2 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Order Summary */}
          <Card elevated className="lg:col-span-5 space-y-5">
            <h2 className="font-display text-xl font-bold">Order Summary</h2>

            <div className="divide-y divide-[var(--line)] space-y-3">
              {validItems.map((item) => (
                <div key={item.productId} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>
                      {item.name} &times; {item.qty}
                    </span>
                    <span>{formatNgnFromKobo(item.lineTotalKobo)}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#f5b93a]" />
                    <span>{item.warrantyMonths}-Month Per-Product Warranty</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-[var(--line)] text-xs">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal (VAT Inclusive)</span>
                <span className="text-[var(--ink)]">
                  {formatNgnFromKobo(pricing.subtotalKobo)}
                </span>
              </div>
              {pricing.discountKobo > 0 && (
                <div className="flex justify-between text-[#38bdf8]">
                  <span>Discount ({pricing.discountCode})</span>
                  <span>-{formatNgnFromKobo(pricing.discountKobo)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--muted)]">
                <span>Delivery ({pricing.deliveryZoneLabel})</span>
                <span className="text-[var(--ink)]">
                  {formatNgnFromKobo(pricing.deliveryKobo)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                <span>Included 7.5% VAT Component</span>
                <span>{formatNgnFromKobo(pricing.vatKobo)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[var(--line)]">
                <span className="text-base font-bold">Total Due</span>
                <span className="text-2xl font-bold font-display text-[#f5b93a]">
                  {formatNgnFromKobo(pricing.totalKobo)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant={channel === 'paystack' ? 'primary' : 'gold'}
              size="lg"
              disabled={isSubmitting || validItems.length === 0}
              className="w-full"
            >
              {isSubmitting
                ? 'Creating Order...'
                : channel === 'paystack'
                ? `Pay ${formatNgnFromKobo(pricing.totalKobo)} via Paystack`
                : `Confirm WhatsApp Order (${formatNgnFromKobo(pricing.totalKobo)})`}
            </Button>
          </Card>
        </form>
      </div>
    </Section>
  );
};
