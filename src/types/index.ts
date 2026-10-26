export type ProductStatus = 'draft' | 'published' | 'archived';
export type StockStatus = 'in_stock' | 'low' | 'out';
export type AudienceTag = 'retail' | 'education' | 'bulk';
export type CategorySlug = 'laptops' | 'desktops' | 'printers' | 'scanners';

export interface Category {
  id: string;
  slug: CategorySlug | string;
  name: string;
  description: string;
  heroImage: string;
  order: number;
  visible: boolean;
  eyebrow?: string;
  highlightSpec?: string;
}

export type ProductFinish = 'matte' | 'gloss' | 'metal';

export interface ProductDimensions {
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

export interface ProductModel3D {
  url: string;
  source: string;
  license: string;
  fileName?: string;
  sizeBytes?: number;
}

export interface ProductImage {
  path: string;
  alt: string;
  width: number;
  height: number;
  order: number;
  isPlaceholder?: boolean;
  source?: string;
  license?: string;
  photographer?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: CategorySlug | string;
  status: ProductStatus;
  priceKobo: number; // Integer in kobo, VAT 7.5% inclusive
  compareAtKobo?: number;
  stockQty: number;
  stockStatus: StockStatus;
  warrantyMonths: number;
  warrantyTerms: string;
  shortDescription: string;
  longDescription: string;
  images: ProductImage[];
  specs: Record<string, string | number | boolean | string[]>;
  colorway?: string;
  finish?: ProductFinish;
  dimensions?: ProductDimensions;
  model3d?: ProductModel3D;
  tags: string[];
  audienceTags: AudienceTag[];
  seed?: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type SpecFieldType = 'text' | 'number' | 'boolean' | 'list';

export interface SpecFieldDefinition {
  id: string;
  label: string;
  type: SpecFieldType;
  unit?: string;
  required: boolean;
  group: string;
  filterable?: boolean;
}

export interface SpecSchema {
  categoryId: CategorySlug | string;
  fields: SpecFieldDefinition[];
}

export type DiscountType = 'percent' | 'fixed_kobo';
export type DiscountScope = 'cart' | 'category' | 'product';

export interface Discount {
  id: string;
  code?: string; // Uppercase code when present; if omitted, automatic discount
  description: string;
  type: DiscountType;
  value: number; // Basis points for percent (1000 = 10%) or integer kobo for fixed_kobo
  scope: DiscountScope;
  scopeIds: string[];
  minSubtotalKobo: number;
  maxUses?: number;
  usedCount: number;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  active: boolean;
  audienceTags?: AudienceTag[];
}

export type MotionLevel = 'off' | 'subtle' | 'full';

export interface ThemeSettings {
  colors: {
    ink: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    primaryBlue: string;
    highlightBlue: string;
    signalRed: string;
    accentGold: string;
    hairline: string;
  };
  typography: {
    fontDisplay: string;
    fontBody: string;
    scale: number;
  };
  layout: {
    containerWidthPx: number;
    radiusPx: number;
  };
  motion: {
    level: MotionLevel;
  };
  filters: {
    grainOpacity: number;
    blurIntensity: number;
  };
  version: number;
}

export interface DeliveryZone {
  id: string;
  label: string;
  region: 'lagos_pickup' | 'lagos' | 'nationwide' | 'international';
  feeKobo: number;
  etaDays: string;
  notes: string;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  text: string;
  linkText?: string;
  linkHref?: string;
}

export type SiteTier = 'assets' | 'cms';

export interface SiteSettings {
  tier: SiteTier;
  featureFlags: {
    themeEnabled: boolean;
    copyEnabled: boolean;
    sectionsEnabled: boolean;
  };
  businessName: string;
  legalName: string;
  wordmark: string;
  whatsappNumber: string; // International format without plus: 2349046453977
  whatsappDisplay: string; // 0904 645 3977
  email: string;
  address: string;
  hours: string;
  vatRate: number; // 0.075
  currency: 'NGN';
  deliveryZones: DeliveryZone[];
  announcementBar: AnnouncementBarConfig;
  footerCopy: string;
}

export interface CartItemInput {
  productId: string;
  qty: number;
  addedAt?: string;
}

export interface PricedLineItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  unitPriceKobo: number;
  requestedQty: number;
  qty: number;
  clamped: boolean;
  stale: boolean;
  staleReason?: string;
  lineSubtotalKobo: number;
  lineDiscountKobo: number;
  lineTotalKobo: number;
  warrantyMonths: number;
  warrantyTerms: string;
  image?: string;
}

export interface PricingCalculationResult {
  items: PricedLineItem[];
  subtotalKobo: number;
  discountKobo: number;
  discountCode?: string;
  discountApplied: boolean;
  discountReason: string;
  deliveryZoneId: string;
  deliveryZoneLabel: string;
  deliveryKobo: number;
  vatRate: number;
  vatKobo: number; // VAT component inside the VAT-inclusive merchandise total
  netMerchandiseKobo: number;
  totalKobo: number;
  hasStaleItems: boolean;
  hasClampedItems: boolean;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'pending_whatsapp'
  | 'confirmed'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export type OrderChannel = 'paystack' | 'whatsapp';

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  country: string;
  notes?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  slug: string;
  nameSnapshot: string;
  brandSnapshot: string;
  unitPriceKobo: number;
  qty: number;
  lineTotalKobo: number;
  warrantyMonths: number;
  warrantyTerms: string;
}

export interface Order {
  orderRef: string; // IR-XXXXXX
  status: OrderStatus;
  channel: OrderChannel;
  items: OrderItemSnapshot[];
  subtotalKobo: number;
  discountKobo: number;
  discountCode?: string;
  deliveryZoneId: string;
  deliveryZoneLabel: string;
  deliveryKobo: number;
  vatKobo: number;
  totalKobo: number;
  customer: OrderCustomer;
  paystackReference?: string;
  paystackAuthorizationUrl?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyDoc {
  slug: 'privacy' | 'terms' | 'returns' | 'warranty' | 'shipping' | 'cookies';
  title: string;
  lastUpdated: string;
  isDraft: boolean;
  summary: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

export interface SegmentLead {
  id: string;
  segment: 'schools' | 'bulk' | 'delivery' | 'international';
  organizationName?: string;
  contactName: string;
  phone: string;
  email?: string;
  country?: string;
  state?: string;
  quantities?: string;
  requirements: string;
  createdAt: string;
}
