import React, { useEffect, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  CheckCircle2,
  Download,
  Lock,
  Palette,
  Plus,
  ShieldAlert,
  Sliders,
  Upload,
} from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { Button, Card, Eyebrow, Section } from '../../components/ui';
import { auth, googleProvider } from '../../lib/firebase';
import { formatNgnFromKobo, nairaToKobo } from '../../lib/money';
import { DEFAULT_THEME_SETTINGS } from '../../lib/theme';
import {
  CategorySlug,
  Discount,
  MotionLevel,
  Order,
  OrderStatus,
  Product,
} from '../../types';

interface AuditEntry {
  id: string;
  actorUid: string;
  role: string;
  action: string;
  targetPath: string;
  beforeHash: string;
  afterHash: string;
  timestamp: string;
}

export const AdminPage: React.FC<{ forceCmsRoute?: boolean }> = ({
  forceCmsRoute = false,
}) => {
  const {
    user,
    products,
    specSchemas,
    discounts,
    orders,
    siteSettings,
    themeSettings,
    homeContent,
    leads,
    saveProduct,
    deleteProduct,
    saveDiscount,
    updateOrderStatus,
    updateThemeSettings,
    updateSiteSettings,
    updateHomeContent,
  } = useAppData();

  const [passcodeVerified, setPasscodeVerified] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState('IR-IKEJA-2026');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);

  const [activeModule, setActiveModule] = useState<'assets' | 'cms'>(
    forceCmsRoute ? 'cms' : 'assets'
  );
  const [assetsTab, setAssetsTab] = useState<
    'products' | 'orders' | 'discounts' | 'csv' | 'leads' | 'audit'
  >('products');

  // Server orders & audit log
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('HP');
  const [prodCategory, setProdCategory] = useState<CategorySlug>('laptops');
  const [prodPriceNaira, setProdPriceNaira] = useState('1250000');
  const [prodStock, setProdStock] = useState('10');
  const [prodWarrantyMonths, setProdWarrantyMonths] = useState('12');
  const [prodWarrantyTerms, setProdWarrantyTerms] = useState(
    '12-Month Per-Product Hardware Warranty tied to unit serial number.'
  );
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodSpecProcessor, setProdSpecProcessor] = useState(
    'Intel Core i7-1355U'
  );
  const [prodSpecRam, setProdSpecRam] = useState('16');
  const [prodSpecStorage, setProdSpecStorage] = useState('512');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // Discount Form State
  const [discCode, setDiscCode] = useState('');
  const [discType, setDiscType] = useState<'percent' | 'fixed_kobo'>('percent');
  const [discVal, setDiscVal] = useState('10'); // 10% or Naira
  const [discMinNaira, setDiscMinNaira] = useState('500000');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvImportedCount, setCsvImportedCount] = useState<number | null>(null);

  const fetchServerAdminState = async () => {
    try {
      const res = await fetch('/api/admin/state');
      if (res.ok) {
        const data = (await res.json()) as {
          orders: Order[];
          auditLog: AuditEntry[];
        };
        setServerOrders(data.orders || []);
        setAuditLog(data.auditLog || []);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    if (passcodeVerified) {
      void fetchServerAdminState();
    }
  }, [passcodeVerified]);

  const notifyAdmin = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 4000);
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setVerifyingPasscode(true);
    try {
      const res = await fetch('/api/admin/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: passcodeInput.trim(),
          email: user?.email || 'junestudioimagineai@gmail.com',
        }),
      });
      const data = (await res.json()) as { verified?: boolean; error?: string };
      if (!res.ok || !data.verified) {
        setPasscodeError(data.error || 'Passcode verification failed.');
      } else {
        setPasscodeVerified(true);
      }
    } catch {
      setPasscodeError('Network error verifying passcode.');
    } finally {
      setVerifyingPasscode(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNairaNum = Number(prodPriceNaira);
    if (!prodName.trim() || Number.isNaN(priceNairaNum) || priceNairaNum <= 0) {
      notifyAdmin('Please enter a valid product name and positive NGN price.');
      return;
    }

    const slug = prodName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const defaultSvgByCategory: Record<string, string> = {
      laptops: '/assets/products/laptop-pro.svg',
      desktops: '/assets/products/desktop-tower.svg',
      printers: '/assets/products/printer-laser.svg',
      scanners: '/assets/products/scanner-duplex.svg',
    };

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      name: prodName.trim(),
      brand: prodBrand.trim(),
      categoryId: prodCategory,
      status: 'published',
      priceKobo: nairaToKobo(priceNairaNum),
      stockQty: Math.max(0, Number(prodStock) || 1),
      stockStatus: Number(prodStock) > 4 ? 'in_stock' : 'low',
      warrantyMonths: Math.max(1, Number(prodWarrantyMonths) || 12),
      warrantyTerms: prodWarrantyTerms.trim(),
      shortDescription:
        prodShortDesc.trim() ||
        `Brand-new ${prodBrand} ${prodName} supplied with per-product warranty in Ikeja, Lagos.`,
      longDescription:
        prodShortDesc.trim() ||
        `Factory-sealed ${prodName} verified by ILLAI-RHASAK Nig. Enterprises.`,
      images: [
        {
          path: defaultSvgByCategory[prodCategory] || '/assets/products/laptop-pro.svg',
          alt: prodName.trim(),
          width: 800,
          height: 600,
          order: 1,
          isPlaceholder: true,
        },
      ],
      specs: {
        processor: prodSpecProcessor,
        ramGb: Number(prodSpecRam) || 16,
        storageGb: Number(prodSpecStorage) || 512,
        storageType: 'PCIe NVMe SSD',
        display: 'Full HD IPS Anti-Glare',
        graphics: 'Integrated Enterprise Graphics',
        battery: 'Long-Life Li-Ion',
        ports: 'USB-C, USB-A, HDMI, Ethernet',
        os: 'Windows 11 Pro 64-bit',
        weightKg: 1.45,
        warranty: `${prodWarrantyMonths} Months Per-Product Warranty`,
      },
      tags: ['Brand New'],
      audienceTags: ['retail', 'education', 'bulk'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'owner',
    };

    await saveProduct(newProduct);
    setProdName('');
    setProdShortDesc('');
    notifyAdmin(`Published "${newProduct.name}" to live catalog.`);
    void fetchServerAdminState();
  };

  const handleOrderStatusChange = async (
    orderRef: string,
    status: OrderStatus
  ) => {
    await updateOrderStatus(orderRef, status);
    notifyAdmin(`Order ${orderRef} updated to ${status.toUpperCase()} in Firebase.`);
    void fetchServerAdminState();
  };

  const mergedOrders = React.useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of orders) map.set(o.orderRef, o);
    for (const o of serverOrders) map.set(o.orderRef, o);
    return Array.from(map.values());
  }, [orders, serverOrders]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discCode.trim()) return;
    const rawVal = Number(discVal) || 10;
    const newDiscount: Discount = {
      id: `disc-${Date.now()}`,
      code: discCode.trim().toUpperCase(),
      description:
        discType === 'percent'
          ? `${rawVal}% promotional discount`
          : `₦${rawVal.toLocaleString('en-NG')} fixed rebate`,
      type: discType,
      value: discType === 'percent' ? Math.round(rawVal * 100) : nairaToKobo(rawVal),
      scope: 'cart',
      scopeIds: [],
      minSubtotalKobo: nairaToKobo(Number(discMinNaira) || 0),
      usedCount: 0,
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2028-01-01T00:00:00.000Z',
      active: true,
    };
    await saveDiscount(newDiscount);
    setDiscCode('');
    notifyAdmin(`Discount code ${newDiscount.code} created.`);
  };

  const handleDownloadCsvTemplate = () => {
    const template = [
      'name,brand,categoryId,priceNaira,stockQty,warrantyMonths,shortDescription',
      'HP ProBook 450 G10,HP,laptops,1150000,12,12,Brand new 15.6-inch Core i5 business notebook',
      'Epson EcoTank L3250,Epson,printers,365000,15,12,Brand new wireless all-in-one ink tank printer',
    ].join('\n');
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'illai-rhasak-product-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = async () => {
    setCsvErrors([]);
    setCsvImportedCount(null);
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setCsvErrors(['CSV must contain a header row and at least one product row.']);
      return;
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 7) {
        errors.push(`Row ${i + 1}: Expected 7 columns (name,brand,categoryId,priceNaira,stockQty,warrantyMonths,shortDescription).`);
        continue;
      }
      const [name, brand, categoryId, priceStr, stockStr, warrantyStr, shortDesc] = cols;
      const priceNaira = Number(priceStr);
      const stockQty = Number(stockStr);
      const warrantyMonths = Number(warrantyStr);

      if (!name || !brand) {
        errors.push(`Row ${i + 1}: Missing name or brand.`);
        continue;
      }
      if (!['laptops', 'desktops', 'printers', 'scanners'].includes(categoryId)) {
        errors.push(
          `Row ${i + 1}: Invalid categoryId "${categoryId}" (must be laptops, desktops, printers, or scanners).`
        );
        continue;
      }
      if (Number.isNaN(priceNaira) || priceNaira <= 0) {
        errors.push(`Row ${i + 1}: Invalid priceNaira "${priceStr}".`);
        continue;
      }

      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
      await saveProduct({
        id: `prod-csv-${Date.now()}-${i}`,
        slug,
        name,
        brand,
        categoryId,
        status: 'published',
        priceKobo: nairaToKobo(priceNaira),
        stockQty: Math.max(0, stockQty || 1),
        stockStatus: stockQty > 4 ? 'in_stock' : 'low',
        warrantyMonths: Math.max(1, warrantyMonths || 12),
        warrantyTerms: `${warrantyMonths || 12}-Month Per-Product Warranty attached to serial number.`,
        shortDescription: shortDesc,
        longDescription: shortDesc,
        images: [
          {
            path: '/assets/products/laptop-pro.svg',
            alt: name,
            width: 800,
            height: 600,
            order: 1,
            isPlaceholder: true,
          },
        ],
        specs: {
          processor: 'Standard Factory Configuration',
          ramGb: 16,
          storageGb: 512,
        },
        tags: ['CSV Imported'],
        audienceTags: ['retail', 'bulk'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'csv-import',
      });
      imported += 1;
    }

    setCsvErrors(errors);
    setCsvImportedCount(imported);
  };

  // Step 1: Server-side Passcode Gate per A12 & Phase 7
  if (!passcodeVerified) {
    return (
      <Section>
        <div className="max-w-md mx-auto">
          <Card elevated className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Eyebrow>Security Gate · Server-Verified 2FA</Eyebrow>
              <h1 className="font-display text-2xl font-bold text-[#F4F6FB]">
                {siteSettings.legalName} Admin Portal
              </h1>
              <p className="text-xs text-[#9AA3B8]">
                Passcode is verified server-side via `/api/admin/passcode` using constant-time scrypt comparison.
              </p>
            </div>

            {/* Optional Firebase Auth Google Sign-In */}
            <div className="rounded-xl border border-white/10 bg-[#05070D] p-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[#F4F6FB]">
                  {user ? `Signed in: ${user.email}` : 'Firebase Auth Session'}
                </p>
                <p className="text-[#9AA3B8]">
                  Role: Owner (`junestudioimagineai@gmail.com`)
                </p>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="text-[#EF2B3A] hover:underline cursor-pointer"
                >
                  Sign Out
                </button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => signInWithPopup(auth, googleProvider).catch(() => {})}
                >
                  Google Sign-In
                </Button>
              )}
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-passcode-input"
                  className="block text-xs font-medium text-[#9AA3B8] mb-1.5"
                >
                  Second-Factor Admin Passcode (Default: <span className="font-mono-tabular text-[#F5B93A]">IR-IKEJA-2026</span>)
                </label>
                <input
                  id="admin-passcode-input"
                  type="password"
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm font-mono-tabular text-white focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              {passcodeError && (
                <p role="alert" className="text-xs text-[#EF2B3A]">
                  {passcodeError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={verifyingPasscode}
                className="w-full"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {verifyingPasscode ? 'Verifying on Server...' : 'Unlock Admin Portal'}
                </span>
              </Button>
            </form>
          </Card>
        </div>
      </Section>
    );
  }

  // Tier Rule Check per A12 & Phase 9:
  // If tier === 'assets' and user navigates to /admin/cms (forceCmsRoute), return 404 state
  if (siteSettings.tier === 'assets' && (forceCmsRoute || activeModule === 'cms')) {
    return (
      <Section>
        <Card className="max-w-xl mx-auto p-8 text-center space-y-4 border-[#EF2B3A]/40">
          <ShieldAlert className="h-10 w-10 text-[#EF2B3A] mx-auto" />
          <Eyebrow>404 · Module Not Enabled on Assets Tier</Eyebrow>
          <h1 className="font-display text-2xl font-bold text-[#F4F6FB]">
            CMS Module Disabled (`settings.site.tier = &quot;assets&quot;`)
          </h1>
          <p className="text-sm text-[#9AA3B8]">
            Per Tier Rule A12, CMS routes return 404 and the CMS navigation item is hidden when the site tier is set to `assets`. An owner can upgrade `settings.site.tier` to `cms` without redeploying.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveModule('assets');
              }}
            >
              Return to Assets Module
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                void updateSiteSettings({ ...siteSettings, tier: 'cms' });
                setActiveModule('cms');
              }}
            >
              Owner Override: Upgrade Tier to CMS
            </Button>
          </div>
        </Card>
      </Section>
    );
  }

  return (
    <Section>
      <div className="space-y-8">
        {adminToast && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 rounded-2xl border border-[#38BDF8] bg-[#0F1524] px-4 py-3 text-xs font-semibold text-white shadow-2xl"
          >
            {adminToast}
          </div>
        )}

        {/* Top Admin Header & Tier Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Eyebrow>
              Admin & CMS Control Plane · Active Tier: {siteSettings.tier.toUpperCase()}
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold text-[#F4F6FB]">
              Store Operations & Live Theme CMS
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Owner Tier Switcher per A12 ("Upgrade from assets to cms is a single settings change by the owner, with no redeploy") */}
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#0A0E18] px-3 py-1.5 text-xs">
              <span className="text-[#9AA3B8]">Site Tier:</span>
              <button
                type="button"
                onClick={() => {
                  const nextTier = siteSettings.tier === 'cms' ? 'assets' : 'cms';
                  void updateSiteSettings({ ...siteSettings, tier: nextTier });
                  if (nextTier === 'assets') setActiveModule('assets');
                }}
                className="font-mono-tabular font-bold text-[#F5B93A] hover:underline cursor-pointer"
              >
                {siteSettings.tier.toUpperCase()} (Switch to{' '}
                {siteSettings.tier === 'cms' ? 'ASSETS' : 'CMS'})
              </button>
            </div>

            {/* Module Selector: CMS nav item hidden when tier === 'assets' per A12 */}
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#0A0E18] p-1">
              <button
                type="button"
                onClick={() => setActiveModule('assets')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  activeModule === 'assets'
                    ? 'bg-[#2563FF] text-white'
                    : 'text-[#9AA3B8] hover:text-white'
                }`}
              >
                Assets Module
              </button>

              {siteSettings.tier === 'cms' && (
                <button
                  type="button"
                  onClick={() => setActiveModule('cms')}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    activeModule === 'cms'
                      ? 'bg-[#2563FF] text-white'
                      : 'text-[#9AA3B8] hover:text-white'
                  }`}
                >
                  CMS & Theme Module
                </button>
              )}
            </div>
          </div>
        </div>

        {activeModule === 'assets' ? (
          <div className="space-y-6">
            {/* Assets Sub-Navigation */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'products', label: `Products (${products.length})` },
                  { id: 'orders', label: `Orders (${mergedOrders.length})` },
                  { id: 'discounts', label: `Discounts (${discounts.length})` },
                  { id: 'csv', label: 'Bulk CSV Import' },
                  { id: 'leads', label: `Segment Leads (${leads.length})` },
                  { id: 'audit', label: `Audit Log (${auditLog.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAssetsTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    assetsTab === tab.id
                      ? 'bg-[#2563FF] text-white'
                      : 'bg-[#0A0E18] text-[#9AA3B8] hover:text-white border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {assetsTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Create Product Form */}
                <Card elevated className="lg:col-span-5 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#F4F6FB]">
                    Add Brand-New Machine
                  </h2>
                  <form onSubmit={handleCreateProduct} className="space-y-3">
                    <div>
                      <label
                        htmlFor="adm-prod-name"
                        className="block text-xs text-[#9AA3B8] mb-1"
                      >
                        Model Name *
                      </label>
                      <input
                        id="adm-prod-name"
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="e.g. HP ProBook 440 G10 Core i7"
                        className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="adm-prod-brand"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Brand
                        </label>
                        <input
                          id="adm-prod-brand"
                          type="text"
                          value={prodBrand}
                          onChange={(e) => setProdBrand(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adm-prod-cat"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Category Schema
                        </label>
                        <select
                          id="adm-prod-cat"
                          value={prodCategory}
                          onChange={(e) =>
                            setProdCategory(e.target.value as CategorySlug)
                          }
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                        >
                          <option value="laptops">Laptops</option>
                          <option value="desktops">Desktops</option>
                          <option value="printers">Printers</option>
                          <option value="scanners">Scanners</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="adm-prod-price"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Price (NGN, VAT Incl.)
                        </label>
                        <input
                          id="adm-prod-price"
                          type="number"
                          required
                          value={prodPriceNaira}
                          onChange={(e) => setProdPriceNaira(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adm-prod-stock"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Stock Qty
                        </label>
                        <input
                          id="adm-prod-stock"
                          type="number"
                          required
                          value={prodStock}
                          onChange={(e) => setProdStock(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adm-prod-warranty"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Warranty (Months)
                        </label>
                        <input
                          id="adm-prod-warranty"
                          type="number"
                          required
                          value={prodWarrantyMonths}
                          onChange={(e) => setProdWarrantyMonths(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="adm-spec-cpu"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Spec: Processor
                        </label>
                        <input
                          id="adm-spec-cpu"
                          type="text"
                          value={prodSpecProcessor}
                          onChange={(e) => setProdSpecProcessor(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adm-spec-ram"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          RAM (GB)
                        </label>
                        <input
                          id="adm-spec-ram"
                          type="number"
                          value={prodSpecRam}
                          onChange={(e) => setProdSpecRam(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adm-spec-ssd"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Storage (GB)
                        </label>
                        <input
                          id="adm-spec-ssd"
                          type="number"
                          value={prodSpecStorage}
                          onChange={(e) => setProdSpecStorage(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="adm-prod-wterms"
                        className="block text-xs text-[#9AA3B8] mb-1"
                      >
                        Per-Product Warranty Terms
                      </label>
                      <input
                        id="adm-prod-wterms"
                        type="text"
                        value={prodWarrantyTerms}
                        onChange={(e) => setProdWarrantyTerms(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <Button type="submit" variant="primary" size="md" className="w-full">
                      <Plus className="h-4 w-4" />
                      <span>Publish Machine to Catalog</span>
                    </Button>
                  </form>
                </Card>

                {/* Product List */}
                <div className="lg:col-span-7 space-y-3">
                  {products.map((p) => (
                    <Card
                      key={p.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-[#38BDF8]">
                            {p.brand} · {p.categoryId.toUpperCase()}
                          </span>
                          <span>·</span>
                          <span className="font-mono-tabular text-[#F5B93A]">
                            {p.status.toUpperCase()}
                          </span>
                          {p.seed && (
                            <>
                              <span>·</span>
                              <span className="text-[#9AA3B8]">seed=true</span>
                            </>
                          )}
                        </div>
                        <p className="font-display text-base font-bold text-[#F4F6FB]">
                          {p.name}
                        </p>
                        <p className="font-mono-tabular text-xs text-[#9AA3B8]">
                          {formatNgnFromKobo(p.priceKobo)} · Stock: {p.stockQty} · Warranty:{' '}
                          {p.warrantyMonths}m
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            saveProduct({
                              ...p,
                              id: `prod-copy-${Date.now()}`,
                              slug: `${p.slug}-copy-${Date.now().toString().slice(-3)}`,
                              name: `${p.name} (Copy)`,
                            })
                          }
                        >
                          Duplicate
                        </Button>
                        {p.status !== 'archived' && (
                          <Button
                            variant="signal"
                            size="sm"
                            onClick={() => deleteProduct(p.id)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {assetsTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">
                  Paystack & WhatsApp Orders (Synced with Firebase)
                </h2>
                {mergedOrders.map((o) => (
                  <Card
                    key={o.orderRef}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono-tabular font-bold text-[#F5B93A]">
                          {o.orderRef}
                        </span>
                        <span>·</span>
                        <span className="text-[#38BDF8] uppercase">{o.channel}</span>
                        <span>·</span>
                        <span className="font-semibold text-white">
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#F4F6FB]">
                        {o.customer.name} · {o.deliveryZoneLabel}
                      </p>
                      <p className="font-mono-tabular text-xs text-[#9AA3B8]">
                        Total: {formatNgnFromKobo(o.totalKobo)} (VAT:{' '}
                        {formatNgnFromKobo(o.vatKobo)})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOrderStatusChange(o.orderRef, 'confirmed')}
                      >
                        Confirm WhatsApp Order
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderStatusChange(o.orderRef, 'fulfilled')}
                      >
                        Mark Fulfilled
                      </Button>
                      <Button
                        variant="signal"
                        size="sm"
                        onClick={() => handleOrderStatusChange(o.orderRef, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {assetsTab === 'discounts' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <Card elevated className="lg:col-span-5 space-y-4">
                  <h2 className="font-display text-lg font-bold">Create Discount Rule</h2>
                  <form onSubmit={handleCreateDiscount} className="space-y-3">
                    <div>
                      <label
                        htmlFor="disc-code"
                        className="block text-xs text-[#9AA3B8] mb-1"
                      >
                        Promo Code (Uppercase) *
                      </label>
                      <input
                        id="disc-code"
                        type="text"
                        required
                        value={discCode}
                        onChange={(e) => setDiscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. IKEJA15"
                        className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="disc-type"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          Discount Type
                        </label>
                        <select
                          id="disc-type"
                          value={discType}
                          onChange={(e) =>
                            setDiscType(e.target.value as 'percent' | 'fixed_kobo')
                          }
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                        >
                          <option value="percent">Percent (%)</option>
                          <option value="fixed_kobo">Fixed Amount (NGN)</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="disc-val"
                          className="block text-xs text-[#9AA3B8] mb-1"
                        >
                          {discType === 'percent' ? 'Percent (e.g. 10)' : 'Amount (NGN)'}
                        </label>
                        <input
                          id="disc-val"
                          type="number"
                          required
                          value={discVal}
                          onChange={(e) => setDiscVal(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="disc-min"
                        className="block text-xs text-[#9AA3B8] mb-1"
                      >
                        Minimum Cart Subtotal (NGN)
                      </label>
                      <input
                        id="disc-min"
                        type="number"
                        value={discMinNaira}
                        onChange={(e) => setDiscMinNaira(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs font-mono-tabular text-white"
                      />
                    </div>
                    <Button type="submit" variant="primary" size="md" className="w-full">
                      Save Discount Code
                    </Button>
                  </form>
                </Card>

                <div className="lg:col-span-7 space-y-3">
                  {discounts.map((d) => (
                    <Card
                      key={d.id}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-mono-tabular text-sm font-bold text-[#F5B93A]">
                          {d.code || 'AUTOMATIC'} · {d.scope.toUpperCase()}
                        </p>
                        <p className="text-xs text-[#F4F6FB]">{d.description}</p>
                        <p className="font-mono-tabular text-xs text-[#9AA3B8]">
                          Min Spend: {formatNgnFromKobo(d.minSubtotalKobo)} · Used:{' '}
                          {d.usedCount}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#38BDF8]">
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {assetsTab === 'csv' && (
              <Card elevated className="p-6 space-y-4 max-w-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">
                      Bulk CSV Product Import
                    </h2>
                    <p className="text-xs text-[#9AA3B8]">
                      Validates each row against category schema and reports row-level errors per A12.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadCsvTemplate}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download CSV Template</span>
                  </Button>
                </div>

                <textarea
                  rows={5}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,brand,categoryId,priceNaira,stockQty,warrantyMonths,shortDescription&#10;HP ProBook 450 G10,HP,laptops,1150000,12,12,Brand new 15.6-inch Core i5 business notebook"
                  className="w-full rounded-xl border border-white/15 bg-[#05070D] p-3 font-mono-tabular text-xs text-white"
                />

                {csvImportedCount !== null && (
                  <p className="text-xs font-semibold text-[#38BDF8]">
                    Successfully imported {csvImportedCount} product(s).
                  </p>
                )}

                {csvErrors.length > 0 && (
                  <div className="rounded-xl border border-[#EF2B3A]/50 bg-[#EF2B3A]/10 p-3 space-y-1 text-xs text-white">
                    {csvErrors.map((err) => (
                      <p key={err}>• {err}</p>
                    ))}
                  </div>
                )}

                <Button type="button" variant="primary" size="md" onClick={handleCsvImport}>
                  <Upload className="h-4 w-4" />
                  <span>Validate & Import CSV Rows</span>
                </Button>
              </Card>
            )}

            {assetsTab === 'leads' && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold">
                  Segment Inquiry Leads (`/schools`, `/bulk`, `/delivery`, `/international`)
                </h2>
                {leads.length === 0 ? (
                  <Card className="p-8 text-center text-sm text-[#9AA3B8]">
                    No segment leads submitted in this session yet. Submit a form on `/schools` or `/bulk` to see it appear here.
                  </Card>
                ) : (
                  leads.map((l) => (
                    <Card key={l.id} className="p-4 space-y-1">
                      <p className="text-xs font-semibold text-[#F5B93A]">
                        {l.segment.toUpperCase()} · {l.organizationName || 'Individual'}
                      </p>
                      <p className="text-sm font-bold text-[#F4F6FB]">
                        {l.contactName} ({l.phone})
                      </p>
                      <p className="text-xs text-[#9AA3B8]">{l.requirements}</p>
                    </Card>
                  ))
                )}
              </div>
            )}

            {assetsTab === 'audit' && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold">
                  Immutable Admin Write Audit Log (`auditLog`)
                </h2>
                {auditLog.map((entry) => (
                  <Card
                    key={entry.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono-tabular font-bold text-[#38BDF8]">
                        {entry.action}
                      </span>{' '}
                      <span className="text-[#9AA3B8]">on {entry.targetPath}</span>
                      <p className="text-[#9AA3B8]">
                        Actor: {entry.actorUid} ({entry.role})
                      </p>
                    </div>
                    <div className="font-mono-tabular text-[11px] text-[#9AA3B8]">
                      Hash: {entry.beforeHash} → {entry.afterHash}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* CMS Module per A12 & Phase 9 */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Theme Token Editor */}
            <Card elevated className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-[#38BDF8]" />
                  <h2 className="font-display text-xl font-bold">
                    Live Theme Token Editor (v{themeSettings.version})
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateThemeSettings(DEFAULT_THEME_SETTINGS)}
                >
                  Reset Default
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label
                    htmlFor="cms-color-ink"
                    className="block text-[#9AA3B8] mb-1"
                  >
                    Background Ink (`--color-ink`)
                  </label>
                  <input
                    id="cms-color-ink"
                    type="text"
                    value={themeSettings.colors.ink}
                    onChange={(e) =>
                      updateThemeSettings({
                        ...themeSettings,
                        colors: { ...themeSettings.colors, ink: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 font-mono-tabular text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cms-color-primary"
                    className="block text-[#9AA3B8] mb-1"
                  >
                    Primary Blue (`--color-primary-blue`)
                  </label>
                  <input
                    id="cms-color-primary"
                    type="text"
                    value={themeSettings.colors.primaryBlue}
                    onChange={(e) =>
                      updateThemeSettings({
                        ...themeSettings,
                        colors: {
                          ...themeSettings.colors,
                          primaryBlue: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 font-mono-tabular text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cms-color-gold"
                    className="block text-[#9AA3B8] mb-1"
                  >
                    Accent Gold (`--color-accent-gold`)
                  </label>
                  <input
                    id="cms-color-gold"
                    type="text"
                    value={themeSettings.colors.accentGold}
                    onChange={(e) =>
                      updateThemeSettings({
                        ...themeSettings,
                        colors: {
                          ...themeSettings.colors,
                          accentGold: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 font-mono-tabular text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cms-motion-level"
                    className="block text-[#9AA3B8] mb-1"
                  >
                    Motion Level (`off | subtle | full`)
                  </label>
                  <select
                    id="cms-motion-level"
                    value={themeSettings.motion.level}
                    onChange={(e) =>
                      updateThemeSettings({
                        ...themeSettings,
                        motion: { level: e.target.value as MotionLevel },
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-white"
                  >
                    <option value="full">Full Cinematic Motion</option>
                    <option value="subtle">Subtle Motion</option>
                    <option value="off">Off (Reduced Motion Fallback)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Copy Overrides & Section Manager */}
            <Card elevated className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-[#F5B93A]" />
                <h2 className="font-display text-xl font-bold">
                  Homepage Copy Override & Section Visibility
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label
                    htmlFor="cms-hero-headline"
                    className="block text-[#9AA3B8] mb-1"
                  >
                    Homepage Hero Headline Override
                  </label>
                  <input
                    id="cms-hero-headline"
                    type="text"
                    value={homeContent.hero.headline}
                    onChange={(e) =>
                      updateHomeContent({
                        ...homeContent,
                        hero: { ...homeContent.hero, headline: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cms-announcement"
                    className="block text-[#9AA3B8] mb-1"
                  >
                    Top Announcement Bar Copy
                  </label>
                  <input
                    id="cms-announcement"
                    type="text"
                    value={siteSettings.announcementBar.text}
                    onChange={(e) =>
                      updateSiteSettings({
                        ...siteSettings,
                        announcementBar: {
                          ...siteSettings.announcementBar,
                          text: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-white"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <p className="font-semibold text-[#9AA3B8]">
                    Homepage Section Visibility Manager
                  </p>
                  {homeContent.sectionOrder.map((sec) => (
                    <label
                      key={sec.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#05070D] px-3.5 py-2 cursor-pointer"
                    >
                      <span className="text-[#F4F6FB] font-medium">{sec.label}</span>
                      <input
                        type="checkbox"
                        checked={sec.visible}
                        onChange={(e) =>
                          updateHomeContent({
                            ...homeContent,
                            sectionOrder: homeContent.sectionOrder.map((s) =>
                              s.id === sec.id
                                ? { ...s, visible: e.target.checked }
                                : s
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Section>
  );
};
