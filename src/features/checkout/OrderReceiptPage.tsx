import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { Card, Eyebrow, Section } from '../../components/ui';
import { formatNgnFromKobo } from '../../lib/money';
import { buildOrderWhatsAppUrl } from '../../lib/whatsapp';
import { Order } from '../../types';

export const OrderReceiptPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const navigate = useNavigate();
  const { orders, siteSettings } = useAppData();

  const targetRef = (ref || 'IR-7K4M9P').toUpperCase();
  const firestoreMatch =
    orders.find((o) => o.orderRef.toUpperCase() === targetRef) || orders[0] || null;

  const [order, setOrder] = useState<Order | null>(firestoreMatch);

  useEffect(() => {
    const found = orders.find((o) => o.orderRef.toUpperCase() === targetRef);
    if (found) {
      setOrder(found);
      return;
    }

    const cached = sessionStorage.getItem(`ir-order-${targetRef}`);
    if (cached) {
      try {
        setOrder(JSON.parse(cached) as Order);
        return;
      } catch {
        // Ignore parse error
      }
    }

    // Fetch directly from server without requiring any manual phone input
    fetch('/api/order/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderRef: targetRef }),
    })
      .then((res) => res.json())
      .then((data: { order?: Order }) => {
        if (data.order) {
          setOrder(data.order);
        } else if (orders[0]) {
          setOrder(orders[0]);
        }
      })
      .catch(() => {
        if (orders[0]) setOrder(orders[0]);
      });
  }, [targetRef, orders]);

  return (
    <Section>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div className="space-y-2">
            <Eyebrow>Firebase Synced Receipt &amp; Warranty Record</Eyebrow>
            <h1 className="font-display text-3xl sm:text-5xl font-bold">
              Order {order ? order.orderRef : targetRef}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Automatically loaded from Firebase Firestore. Every unit carries its own attached per-product warranty.
            </p>
          </div>

          {orders.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {orders.slice(0, 4).map((o) => (
                <button
                  key={o.orderRef}
                  type="button"
                  onClick={() => navigate(`/order/${o.orderRef}`)}
                  className={`btn ${
                    order?.orderRef === o.orderRef ? 'btn-primary' : 'btn-ghost'
                  }`}
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  {o.orderRef}
                </button>
              ))}
            </div>
          )}
        </div>

        {order && (
          <Card elevated className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#38bdf8]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Status: {order.status.replace('_', ' ').toUpperCase()} &middot; Channel:{' '}
                    {order.channel.toUpperCase()}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold">
                  Reference: {order.orderRef}
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Issued by {siteSettings.legalName} &middot; {siteSettings.address}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={buildOrderWhatsAppUrl(order, siteSettings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '12px 20px', fontSize: '14px' }}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Send Order to WhatsApp Desk</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-[var(--line)] bg-[#05070d] p-4 space-y-1">
                <p className="text-[var(--muted)] font-semibold">Buyer Details</p>
                <p className="text-sm font-bold">{order.customer.name}</p>
                <p className="text-[var(--muted)]">{order.customer.phone}</p>
                <p className="text-[var(--muted)]">{order.customer.email}</p>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[#05070d] p-4 space-y-1">
                <p className="text-[var(--muted)] font-semibold">Delivery / Pickup Zone</p>
                <p className="text-sm font-bold">{order.deliveryZoneLabel}</p>
                <p className="text-[var(--muted)]">
                  {order.customer.address}, {order.customer.state}, {order.customer.country}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-base font-bold">
                Itemized Hardware &amp; Attached Product Warranties
              </h3>
              <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[#05070d] overflow-hidden">
                {order.items.map((item) => (
                  <div key={item.productId} className="p-4 space-y-2">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold">
                          {item.nameSnapshot} &times; {item.qty}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          Unit Price: {formatNgnFromKobo(item.unitPriceKobo)}
                        </p>
                      </div>
                      <span className="text-sm font-bold">
                        {formatNgnFromKobo(item.lineTotalKobo)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-[#0f1524] p-2.5 text-xs text-[var(--muted)]">
                      <ShieldCheck className="h-4 w-4 text-[#f5b93a] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#f5b93a]">
                          {item.warrantyMonths}-Month Per-Product Warranty:{' '}
                        </span>
                        <span>{item.warrantyTerms}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[#05070d] p-5 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal (VAT Inclusive)</span>
                <span className="text-[var(--ink)]">
                  {formatNgnFromKobo(order.subtotalKobo)}
                </span>
              </div>
              {order.discountKobo > 0 && (
                <div className="flex justify-between text-[#38bdf8]">
                  <span>Discount Applied ({order.discountCode})</span>
                  <span>-{formatNgnFromKobo(order.discountKobo)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--muted)]">
                <span>Delivery ({order.deliveryZoneLabel})</span>
                <span className="text-[var(--ink)]">
                  {formatNgnFromKobo(order.deliveryKobo)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                <span>Included 7.5% VAT Component Breakdown</span>
                <span className="text-[#38bdf8]">
                  {formatNgnFromKobo(order.vatKobo)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[var(--line)]">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-2xl font-bold font-display text-[#f5b93a]">
                  {formatNgnFromKobo(order.totalKobo)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <Link to="/shop" className="text-[#38bdf8] hover:underline">
                &larr; Continue Shopping
              </Link>
              <Link to="/policies/warranty" className="hover:text-white">
                View Full Warranty &amp; Claim Terms
              </Link>
            </div>
          </Card>
        )}
      </div>
    </Section>
  );
};
