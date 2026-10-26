import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { handleAdminGrant } from './api/admin/grant';
import { handleAdminPasscode } from './api/admin/passcode';
import { handleOrderCreate } from './api/order/create';
import { handleOrderLookup } from './api/order/lookup';
import { handleOrderVerify } from './api/order/verify';
import { handlePaystackWebhook } from './api/paystack/webhook';
import { handlePriceCalculation } from './api/price';
import { checkRateLimit, serverState } from './src/server/storeState';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Capture raw body for Paystack HMAC SHA-512 webhook signature verification
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: Request & { rawBody?: string }, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );

  // Security headers middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // POST /api/price (Rate limited per A13)
  app.post('/api/price', (req: Request, res: Response) => {
    const rate = checkRateLimit(getClientIp(req), 'price', 60, 60_000);
    if (!rate.allowed) {
      res.status(429).json({ error: 'Too many pricing requests. Please wait a moment.' });
      return;
    }
    const result = handlePriceCalculation(req.body);
    res.status(result.status).json(result.data);
  });

  // POST /api/order/create (Rate limited per A13)
  app.post('/api/order/create', async (req: Request, res: Response) => {
    const rate = checkRateLimit(getClientIp(req), 'order_create', 20, 60_000);
    if (!rate.allowed) {
      res.status(429).json({ error: 'Too many order attempts. Please wait a moment.' });
      return;
    }
    const result = await handleOrderCreate(req.body);
    res.status(result.status).json(result.data);
  });

  // POST /api/order/verify
  app.post('/api/order/verify', async (req: Request, res: Response) => {
    const result = await handleOrderVerify(req.body);
    res.status(result.status).json(result.data);
  });

  // POST /api/order/lookup (Rate limited per A13)
  app.post('/api/order/lookup', (req: Request, res: Response) => {
    const rate = checkRateLimit(getClientIp(req), 'order_lookup', 25, 60_000);
    if (!rate.allowed) {
      res.status(429).json({ error: 'Too many order lookup requests. Please wait a moment.' });
      return;
    }
    const result = handleOrderLookup(req.body);
    res.status(result.status).json(result.data);
  });

  // POST /api/paystack/webhook
  app.post(
    '/api/paystack/webhook',
    (req: Request & { rawBody?: string }, res: Response) => {
      const signature = req.headers['x-paystack-signature'] as string | undefined;
      const result = handlePaystackWebhook(req.rawBody || '', signature, req.body);
      res.status(result.status).json(result.data);
    }
  );

  // POST /api/admin/passcode
  app.post('/api/admin/passcode', (req: Request, res: Response) => {
    const rate = checkRateLimit(getClientIp(req), 'admin_passcode', 15, 60_000);
    if (!rate.allowed) {
      res.status(429).json({ error: 'Too many passcode attempts.' });
      return;
    }
    const result = handleAdminPasscode(req.body);
    res.status(result.status).json(result.data);
  });

  // POST /api/admin/grant
  app.post('/api/admin/grant', (req: Request, res: Response) => {
    const result = handleAdminGrant(req.body);
    res.status(result.status).json(result.data);
  });

  // GET /api/admin/orders & audit log
  app.get('/api/admin/state', (_req: Request, res: Response) => {
    res.json({
      orders: Array.from(serverState.orders.values()),
      auditLog: serverState.auditLog,
      adminRoles: Object.fromEntries(serverState.adminRoles.entries()),
    });
  });

  // POST /api/admin/order-status
  const OrderStatusUpdateSchema = z
    .object({
      orderRef: z.string(),
      status: z.enum([
        'pending_payment',
        'paid',
        'pending_whatsapp',
        'confirmed',
        'fulfilled',
        'cancelled',
        'refunded',
      ]),
      adminNotes: z.string().max(500).optional(),
      actorEmail: z.string().optional(),
    })
    .strict();

  app.post('/api/admin/order-status', (req: Request, res: Response) => {
    const parsed = OrderStatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid status update payload' });
      return;
    }
    const order = serverState.orders.get(parsed.data.orderRef);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const before = { status: order.status, adminNotes: order.adminNotes };
    order.status = parsed.data.status;
    if (parsed.data.adminNotes !== undefined) {
      order.adminNotes = parsed.data.adminNotes;
    }
    order.updatedAt = new Date().toISOString();
    serverState.recordAudit(
      parsed.data.actorEmail || 'owner',
      'owner',
      'order.update_status',
      `/orders/${order.orderRef}`,
      before,
      { status: order.status, adminNotes: order.adminNotes }
    );
    res.json({ order, auditLog: serverState.auditLog });
  });

  // POST /api/admin/sync-catalog (syncs admin product/discount/settings edits with server pricing engine)
  const SyncCatalogSchema = z
    .object({
      products: z.array(z.any()).optional(),
      discounts: z.array(z.any()).optional(),
      siteSettings: z.any().optional(),
      actorEmail: z.string().optional(),
      actionLabel: z.string().optional(),
    })
    .strict();

  app.post('/api/admin/sync-catalog', (req: Request, res: Response) => {
    const parsed = SyncCatalogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid sync payload' });
      return;
    }
    if (parsed.data.products) {
      serverState.products = parsed.data.products;
    }
    if (parsed.data.discounts) {
      serverState.discounts = parsed.data.discounts;
    }
    if (parsed.data.siteSettings) {
      serverState.siteSettings = parsed.data.siteSettings;
    }
    serverState.recordAudit(
      parsed.data.actorEmail || 'owner',
      'owner',
      parsed.data.actionLabel || 'catalog.sync',
      '/catalog',
      {},
      { updatedAt: new Date().toISOString() }
    );
    res.json({ ok: true, auditLog: serverState.auditLog });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ILLAI-RHASAK server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
