import crypto from 'node:crypto';
import {
  SEED_CATEGORIES,
  SEED_DISCOUNTS,
  SEED_PRODUCTS,
  SEED_SITE_SETTINGS,
  SEED_SPEC_SCHEMAS,
} from '../content/seedData';
import { DEFAULT_THEME_SETTINGS } from '../lib/theme';
import {
  Category,
  Discount,
  Order,
  Product,
  SiteSettings,
  SpecSchema,
  ThemeSettings,
} from '../types';

const UNAMBIGUOUS_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateOrderRef(): string {
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += UNAMBIGUOUS_ALPHABET[bytes[i] % UNAMBIGUOUS_ALPHABET.length];
  }
  return `IR-${code}`;
}

export function normalizePhoneForComparison(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return digits.slice(-8);
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  ip: string,
  routeKey: string,
  maxRequests = 45,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const key = `${routeKey}:${ip}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxRequests - bucket.count };
}

export interface ServerAuditEntry {
  id: string;
  actorUid: string;
  role: string;
  action: string;
  targetPath: string;
  beforeHash: string;
  afterHash: string;
  timestamp: string;
}

class ServerStoreState {
  products: Product[] = structuredClone(SEED_PRODUCTS);
  categories: Category[] = structuredClone(SEED_CATEGORIES);
  specSchemas: Record<string, SpecSchema> = structuredClone(SEED_SPEC_SCHEMAS);
  discounts: Discount[] = structuredClone(SEED_DISCOUNTS);
  siteSettings: SiteSettings = structuredClone(SEED_SITE_SETTINGS);
  themeSettings: ThemeSettings = structuredClone(DEFAULT_THEME_SETTINGS);
  orders: Map<string, Order> = new Map();
  processedWebhookRefs: Set<string> = new Set();
  adminRoles: Map<string, 'assets' | 'cms' | 'owner'> = new Map([
    ['junestudioimagineai@gmail.com', 'owner'],
  ]);
  auditLog: ServerAuditEntry[] = [];

  constructor() {
    // Seed one sample order so order lookup and admin orders table have immediate realistic state
    const sampleOrder: Order = {
      orderRef: 'IR-7K4M9P',
      status: 'pending_whatsapp',
      channel: 'whatsapp',
      items: [
        {
          productId: 'prod-hp-elitebook-840-g10',
          slug: 'hp-elitebook-840-g10-i7-16gb-512gb',
          nameSnapshot: 'HP EliteBook 840 G10 14" Executive Notebook',
          brandSnapshot: 'HP',
          unitPriceKobo: 158000000,
          qty: 1,
          lineTotalKobo: 158000000,
          warrantyMonths: 12,
          warrantyTerms:
            '12-Month Product Hardware Warranty tied to this unit’s factory serial number.',
        },
      ],
      subtotalKobo: 158000000,
      discountKobo: 0,
      deliveryZoneId: 'ikeja-pickup',
      deliveryZoneLabel: 'Pickup at Ikeja Showroom (Lagos)',
      deliveryKobo: 0,
      vatKobo: Math.round(158000000 - 158000000 / 1.075),
      totalKobo: 158000000,
      customer: {
        name: 'Chidi Nwosu (Demo Order)',
        phone: '08031234567',
        email: 'procurement@example.ng',
        address: 'Ikeja Showroom Pickup',
        state: 'Lagos',
        country: 'Nigeria',
      },
      createdAt: '2026-10-25T14:30:00.000Z',
      updatedAt: '2026-10-25T14:30:00.000Z',
    };
    this.orders.set(sampleOrder.orderRef, sampleOrder);
  }

  recordAudit(
    actorUid: string,
    role: string,
    action: string,
    targetPath: string,
    beforeObj: unknown,
    afterObj: unknown
  ) {
    const hashObj = (val: unknown) =>
      crypto
        .createHash('sha256')
        .update(JSON.stringify(val ?? null))
        .digest('hex')
        .slice(0, 16);

    this.auditLog.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorUid,
      role,
      action,
      targetPath,
      beforeHash: hashObj(beforeObj),
      afterHash: hashObj(afterObj),
      timestamp: new Date().toISOString(),
    });
  }
}

export const serverState = new ServerStoreState();
