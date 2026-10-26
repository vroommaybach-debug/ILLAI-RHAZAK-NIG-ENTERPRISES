import { Order, PricedLineItem, Product } from '../types';
import { formatNgnFromKobo } from './money';

export const DEFAULT_WHATSAPP_NUMBER = '2347061766728';

export function cleanWhatsAppNumber(phone: string = DEFAULT_WHATSAPP_NUMBER): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  return digits || DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsAppUrl(
  message: string,
  phone: string = DEFAULT_WHATSAPP_NUMBER
): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function buildGeneralInquiryWhatsAppUrl(phone = DEFAULT_WHATSAPP_NUMBER): string {
  return buildWhatsAppUrl(
    'Hello ILLAI-RHASAK Nig. Enterprises, I would like to inquire about hardware availability, pricing, or servicing in Computer Village, Ikeja, Lagos.',
    phone
  );
}

export function buildProductWhatsAppUrl(
  product: Pick<Product, 'name' | 'brand' | 'priceKobo' | 'warrantyMonths' | 'slug'>,
  phone = DEFAULT_WHATSAPP_NUMBER
): string {
  const formattedPrice = formatNgnFromKobo(product.priceKobo);
  const msg = [
    `Hello ILLAI-RHASAK Nig. Enterprises,`,
    `I want to order / inquire about this item:`,
    `• Product: ${product.name} (${product.brand})`,
    `• Listed Price (VAT Incl.): ${formattedPrice}`,
    `• Product Warranty: ${product.warrantyMonths} Months`,
    `Please confirm immediate stock availability for pickup at Computer Village, Ikeja or delivery.`,
  ].join('\n');
  return buildWhatsAppUrl(msg, phone);
}

export function buildSegmentWhatsAppUrl(
  segment: 'schools' | 'bulk' | 'lagos' | 'nationwide' | 'international' | 'servicing',
  phone = DEFAULT_WHATSAPP_NUMBER
): string {
  const messages: Record<typeof segment, string> = {
    schools:
      'Hello ILLAI-RHASAK Nig. Enterprises, I am contacting you regarding a School / ICT Lab hardware bundle (laptops, desktop, printer, scanner, photocopier, UPS). Please share your current term pricing and pro-forma invoice process.',
    bulk:
      'Hello ILLAI-RHASAK Nig. Enterprises, we would like to request corporate volume pricing and a formal invoice for a bulk hardware order.',
    lagos:
      'Hello ILLAI-RHASAK Nig. Enterprises, I would like to arrange same-day/next-day Lagos delivery or Computer Village, Ikeja showroom pickup.',
    nationwide:
      'Hello ILLAI-RHASAK Nig. Enterprises, I am ordering from outside Lagos and would like to confirm inter-state waybill/air delivery timelines and insurance.',
    international:
      'Hello ILLAI-RHASAK Nig. Enterprises, I would like to request an international shipping quote for computer/office equipment.',
    servicing:
      'Hello ILLAI-RHASAK Nig. Enterprises, I would like to book General Servicing / Maintenance or order consumables for our laptops, printers, photocopiers, or UPS machines at Computer Village, Ikeja.',
  };

  return buildWhatsAppUrl(messages[segment], phone);
}

export function buildOrderWhatsAppUrl(
  order: Pick<
    Order,
    | 'orderRef'
    | 'items'
    | 'subtotalKobo'
    | 'discountKobo'
    | 'deliveryZoneLabel'
    | 'deliveryKobo'
    | 'vatKobo'
    | 'totalKobo'
    | 'customer'
  >,
  phone = DEFAULT_WHATSAPP_NUMBER
): string {
  const itemLines = order.items.map(
    (item, idx) =>
      `${idx + 1}. ${item.nameSnapshot} × ${item.qty} — ${formatNgnFromKobo(item.lineTotalKobo)} (${item.warrantyMonths}m warranty)`
  );

  const lines = [
    `Hello ILLAI-RHASAK Nig. Enterprises,`,
    `I have placed a WhatsApp Order from your online store.`,
    ``,
    `Order Reference: *${order.orderRef}*`,
    `Customer: ${order.customer.name} (${order.customer.phone})`,
    `Delivery Zone: ${order.deliveryZoneLabel} (${order.customer.state}, ${order.customer.country})`,
    `Address: ${order.customer.address}`,
    ``,
    `Items:`,
    ...itemLines,
    ``,
    `Subtotal: ${formatNgnFromKobo(order.subtotalKobo)}`,
    ...(order.discountKobo > 0
      ? [`Discount: -${formatNgnFromKobo(order.discountKobo)}`]
      : []),
    `Delivery Fee: ${formatNgnFromKobo(order.deliveryKobo)}`,
    `Total (VAT 7.5% Incl.): *${formatNgnFromKobo(order.totalKobo)}*`,
    `Included VAT Component: ${formatNgnFromKobo(order.vatKobo)}`,
    ``,
    `Please confirm my order *${order.orderRef}* and share payment/dispatch instructions.`,
  ];

  return buildWhatsAppUrl(lines.join('\n'), phone);
}

export function buildCartPreviewWhatsAppUrl(
  items: PricedLineItem[],
  totalKobo: number,
  deliveryZoneLabel: string,
  phone = DEFAULT_WHATSAPP_NUMBER
): string {
  const activeItems = items.filter((i) => !i.stale && i.qty > 0);
  const lines = [
    `Hello ILLAI-RHASAK Nig. Enterprises,`,
    `I would like to order these items from my cart:`,
    ...activeItems.map(
      (i, idx) => `${idx + 1}. ${i.name} × ${i.qty} — ${formatNgnFromKobo(i.lineTotalKobo)}`
    ),
    `Delivery Option: ${deliveryZoneLabel}`,
    `Estimated Total (VAT Incl.): ${formatNgnFromKobo(totalKobo)}`,
  ];
  return buildWhatsAppUrl(lines.join('\n'), phone);
}
