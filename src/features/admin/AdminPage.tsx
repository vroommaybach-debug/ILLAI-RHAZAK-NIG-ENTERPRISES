import React, { useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  Download,
  Edit3,
  Image as ImageIcon,
  Lock,
  Plus,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { ImageUploader } from '../../components/ImageUploader';
import { Button, Card, Eyebrow, ProductImageStage, Section } from '../../components/ui';
import { auth, googleProvider } from '../../lib/firebase';
import { formatNgnFromKobo, nairaToKobo } from '../../lib/money';
import {
  Category,
  CategorySlug,
  Discount,
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

const DEFAULT_SVG_BY_CATEGORY: Record<string, string> = {
  laptops: '/assets/products/laptop-pro.svg',
  'uk-used': '/assets/products/laptop-edu.svg',
  desktops: '/assets/products/desktop-tower.svg',
  printers: '/assets/products/printer-laser.svg',
  photocopiers: '/assets/products/photocopier-pro.svg',
  scanners: '/assets/products/scanner-duplex.svg',
  ups: '/assets/products/ups-power.svg',
  consumables: '/assets/products/consumables-kit.svg',
};

const VALID_CATEGORY_SLUGS: CategorySlug[] = [
  'laptops',
  'uk-used',
  'desktops',
  'printers',
  'photocopiers',
  'scanners',
  'ups',
  'consumables',
];

export const AdminPage: React.FC<{ forceCmsRoute?: boolean }> = () => {
  const {
    user,
    products,
    categories,
    discounts,
    orders,
    siteSettings,
    leads,
    saveProduct,
    deleteProduct,
    saveCategory,
    saveDiscount,
    updateOrderStatus,
    updateSiteSettings,
  } = useAppData();

  const [passcodeVerified, setPasscodeVerified] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState('IR-IKEJA-2026');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'products' | 'images' | 'orders' | 'discounts' | 'csv' | 'leads'
  >('products');

  // Server orders
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [, setAuditLog] = useState<AuditEntry[]>([]);

  // Create Product Form State
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('HP');
  const [prodCategory, setProdCategory] = useState<CategorySlug>('laptops');
  const [prodPriceNaira, setProdPriceNaira] = useState('1250000');
  const [prodStock, setProdStock] = useState('10');
  const [prodWarrantyMonths, setProdWarrantyMonths] = useState('12');
  const [prodWarrantyTerms, setProdWarrantyTerms] = useState(
    '12-Month Per-Product Hardware Warranty tied to unit serial number at Computer Village, Ikeja.'
  );
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodImagePath, setProdImagePath] = useState(
    DEFAULT_SVG_BY_CATEGORY['laptops']
  );
  const [prodSpecProcessor, setProdSpecProcessor] = useState(
    'Intel Core i7-1355U'
  );
  const [prodSpecRam, setProdSpecRam] = useState('16');
  const [prodSpecStorage, setProdSpecStorage] = useState('512');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // Inline Edit Product State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState<CategorySlug>('laptops');
  const [editPriceNaira, setEditPriceNaira] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editWarrantyMonths, setEditWarrantyMonths] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editImagePath, setEditImagePath] = useState('');

  // Filter products in admin list
  const [adminCatFilter, setAdminCatFilter] = useState<string>('all');

  // Discount Form State
  const [discCode, setDiscCode] = useState('');
  const [discType, setDiscType] = useState<'percent' | 'fixed_kobo'>('percent');
  const [discVal, setDiscVal] = useState('10');
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

  const handleCategoryChangeInCreate = (nextCat: CategorySlug) => {
    setProdCategory(nextCat);
    if (
      !prodImagePath ||
      Object.values(DEFAULT_SVG_BY_CATEGORY).includes(prodImagePath)
    ) {
      setProdImagePath(
        DEFAULT_SVG_BY_CATEGORY[nextCat] || '/assets/products/laptop-pro.svg'
      );
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

    const chosenImage =
      prodImagePath.trim() ||
      DEFAULT_SVG_BY_CATEGORY[prodCategory] ||
      '/assets/products/laptop-pro.svg';

    const isUkUsed = prodCategory === 'uk-used';

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
        `${isUkUsed ? 'Grade-A UK Used' : 'Brand-new'} ${prodBrand} ${prodName} supplied with warranty at Computer Village, Ikeja, Lagos.`,
      longDescription:
        prodShortDesc.trim() ||
        `${prodName} verified by ILLAI-RHASAK Nig. Enterprises in Computer Village, Ikeja, Lagos.`,
      images: [
        {
          path: chosenImage,
          alt: prodName.trim(),
          width: 800,
          height: 600,
          order: 1,
          isPlaceholder: chosenImage.startsWith('/assets/products/'),
        },
      ],
      specs: {
        ...(isUkUsed
          ? { conditionGrade: 'Grade-A UK Corporate Import' }
          : {}),
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
      tags: [isUkUsed ? 'Grade-A UK Used' : 'Brand New'],
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

  const startEditingProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditBrand(p.brand);
    setEditCategory((p.categoryId as CategorySlug) || 'laptops');
    setEditPriceNaira(String(Math.round(p.priceKobo / 100)));
    setEditStock(String(p.stockQty));
    setEditWarrantyMonths(String(p.warrantyMonths));
    setEditShortDesc(p.shortDescription);
    setEditImagePath(p.images[0]?.path || DEFAULT_SVG_BY_CATEGORY[p.categoryId] || '');
  };

  const handleSaveEditedProduct = async (original: Product) => {
    const priceNairaNum = Number(editPriceNaira);
    if (!editName.trim() || Number.isNaN(priceNairaNum) || priceNairaNum <= 0) {
      notifyAdmin('Please provide a valid product name and positive NGN price.');
      return;
    }
    const nextStock = Math.max(0, Number(editStock) || 0);
    const updatedProduct: Product = {
      ...original,
      name: editName.trim(),
      brand: editBrand.trim() || original.brand,
      categoryId: editCategory,
      priceKobo: nairaToKobo(priceNairaNum),
      stockQty: nextStock,
      stockStatus: nextStock === 0 ? 'out' : nextStock <= 4 ? 'low' : 'in_stock',
      warrantyMonths: Math.max(1, Number(editWarrantyMonths) || original.warrantyMonths),
      shortDescription: editShortDesc.trim() || original.shortDescription,
      longDescription: editShortDesc.trim() || original.longDescription,
      images: [
        {
          path: editImagePath || original.images[0]?.path || '/assets/products/laptop-pro.svg',
          alt: editName.trim(),
          width: 800,
          height: 600,
          order: 1,
          isPlaceholder: false,
        },
      ],
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'owner',
    };

    await saveProduct(updatedProduct);
    setEditingProductId(null);
    notifyAdmin(`Updated "${updatedProduct.name}" across the storefront.`);
  };

  const handleQuickProductImageChange = async (product: Product, newUrl: string) => {
    const updated: Product = {
      ...product,
      images: [
        {
          path: newUrl,
          alt: product.name,
          width: 800,
          height: 600,
          order: 1,
          isPlaceholder: false,
        },
      ],
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'owner',
    };
    await saveProduct(updated);
    notifyAdmin(`Updated image for "${product.name}".`);
  };

  const handleCategoryImageChange = async (category: Category, newUrl: string) => {
    const updated: Category = {
      ...category,
      heroImage: newUrl,
    };
    await saveCategory(updated);
    notifyAdmin(`Updated section image for "${category.name}".`);
  };

  const handleOrderStatusChange = async (
    orderRef: string,
    status: OrderStatus
  ) => {
    await updateOrderStatus(orderRef, status);
    notifyAdmin(`Order ${orderRef} updated to ${status.toUpperCase()}.`);
    void fetchServerAdminState();
  };

  const mergedOrders = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of orders) map.set(o.orderRef, o);
    for (const o of serverOrders) map.set(o.orderRef, o);
    return Array.from(map.values());
  }, [orders, serverOrders]);

  const filteredAdminProducts = useMemo(() => {
    if (adminCatFilter === 'all') return products;
    return products.filter((p) => p.categoryId === adminCatFilter);
  }, [products, adminCatFilter]);

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
      'name,brand,categoryId,priceNaira,stockQty,warrantyMonths,shortDescription,imageUrl',
      'HP ProBook 450 G10,HP,laptops,1150000,12,12,Brand new 15.6-inch Core i5 business notebook,/assets/products/laptop-pro.svg',
      'HP EliteBook 840 G8 UK Used,HP,uk-used,565000,15,6,Clean Grade-A UK used Core i7 16GB/512GB notebook,/assets/products/laptop-edu.svg',
      'Sharp BP-30M28 A3 Photocopier,Sharp,photocopiers,1720000,4,12,Commercial 28ppm A3/A4 duplex network photocopier,/assets/products/photocopier-pro.svg',
      'APC Smart-UPS 2200VA,APC,ups,680000,8,12,Line-interactive pure sine wave UPS backup,/assets/products/ups-power.svg',
      'Original HP 151X Black Toner,HP,consumables,165000,25,6,High-yield 9700-page original laser toner cartridge,/assets/products/consumables-kit.svg',
    ].join('\n');
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'illai-rhasak-catalog-import-template.csv';
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
        errors.push(
          `Row ${i + 1}: Expected at least 7 columns (name,brand,categoryId,priceNaira,stockQty,warrantyMonths,shortDescription[,imageUrl]).`
        );
        continue;
      }
      const [
        name,
        brand,
        categoryId,
        priceStr,
        stockStr,
        warrantyStr,
        shortDesc,
        customImgUrl,
      ] = cols;
      const priceNaira = Number(priceStr);
      const stockQty = Number(stockStr);
      const warrantyMonths = Number(warrantyStr);

      if (!name || !brand) {
        errors.push(`Row ${i + 1}: Missing name or brand.`);
        continue;
      }
      if (!VALID_CATEGORY_SLUGS.includes(categoryId as CategorySlug)) {
        errors.push(
          `Row ${i + 1}: Invalid categoryId "${categoryId}" (allowed: ${VALID_CATEGORY_SLUGS.join(', ')}).`
        );
        continue;
      }
      if (Number.isNaN(priceNaira) || priceNaira <= 0) {
        errors.push(`Row ${i + 1}: Invalid priceNaira "${priceStr}".`);
        continue;
      }

      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
      const imgPath =
        customImgUrl ||
        DEFAULT_SVG_BY_CATEGORY[categoryId] ||
        '/assets/products/laptop-pro.svg';

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
            path: imgPath,
            alt: name,
            width: 800,
            height: 600,
            order: 1,
            isPlaceholder: false,
          },
        ],
        specs: {
          processor: 'Standard Verified Configuration',
          ramGb: 16,
          storageGb: 512,
        },
        tags: [categoryId === 'uk-used' ? 'Grade-A UK Used' : 'Brand New'],
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

  if (!passcodeVerified) {
    return (
      <Section>
        <div className="max-w-md mx-auto">
          <Card elevated className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Eyebrow>Security Gate · Computer Village, Ikeja Admin</Eyebrow>
              <h1 className="font-display text-2xl font-bold text-[#F4F6FB]">
                {siteSettings.legalName} Admin Console
              </h1>
              <p className="text-xs text-[#9AA3B8]">
                Verify your admin passcode to manage the catalog, upload product photos, and process customer orders.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#05070D] p-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[#F4F6FB]">
                  {user ? `Signed in: ${user.email}` : 'Firebase Auth Session'}
                </p>
                <p className="text-[#9AA3B8]">
                  Store Operations &amp; Catalog Manager
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
                  Admin Passcode (Default: <span className="font-mono-tabular text-[#F5B93A]">IR-IKEJA-2026</span>)
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
                  {verifyingPasscode ? 'Verifying...' : 'Unlock Admin Console'}
                </span>
              </Button>
            </form>
          </Card>
        </div>
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

        {/* Streamlined Admin Header (No CMS Clutter) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <Eyebrow>
              Computer Village, Ikeja, Lagos · Live Firebase Operations Console
            </Eyebrow>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F6FB]">
              Catalog Upgrades, Site-Wide Image Upload &amp; Order Management
            </h1>
            <p className="text-xs text-[#9AA3B8]">
              Upload product and section images directly from File, Camera, Google Drive, or Simple Link. Specialist WhatsApp Line:{' '}
              <span className="font-mono-tabular font-semibold text-[#38BDF8]">
                {siteSettings.whatsappDisplay || '0706 176 6728'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'products', label: `Catalog & Upgrades (${products.length})` },
                { id: 'images', label: 'Site-Wide Images (File/Camera/Drive)' },
                { id: 'orders', label: `Orders (${mergedOrders.length})` },
                { id: 'discounts', label: `Discounts (${discounts.length})` },
                { id: 'csv', label: 'Bulk CSV Import' },
                { id: 'leads', label: `Quotes & Servicing (${leads.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#2563FF] text-white'
                    : 'bg-[#0A0E18] text-[#9AA3B8] hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: CATALOG & UPGRADES */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Add Product or Consumable Form with Multi-Source Image Upload */}
            <Card elevated className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <Eyebrow>New Catalog Entry</Eyebrow>
                <h2 className="font-display text-lg font-bold text-[#F4F6FB]">
                  Add Machine, UPS, Photocopier or Consumable
                </h2>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div>
                  <label
                    htmlFor="adm-prod-name"
                    className="block text-xs text-[#9AA3B8] mb-1"
                  >
                    Product / Model Name *
                  </label>
                  <input
                    id="adm-prod-name"
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. HP EliteBook 840 G8 UK Used / Sharp Copier / APC UPS"
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
                      placeholder="HP, Dell, Canon, Sharp, APC..."
                      className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="adm-prod-cat"
                      className="block text-xs text-[#9AA3B8] mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="adm-prod-cat"
                      value={prodCategory}
                      onChange={(e) =>
                        handleCategoryChangeInCreate(e.target.value as CategorySlug)
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                    >
                      <option value="laptops">Brand-New Laptops</option>
                      <option value="uk-used">UK Used Laptops (Grade-A)</option>
                      <option value="desktops">Desktops &amp; Workstations</option>
                      <option value="printers">Printers</option>
                      <option value="photocopiers">Photocopier Machines</option>
                      <option value="scanners">Document Scanners</option>
                      <option value="ups">UPS &amp; Power Backup</option>
                      <option value="consumables">Consumables &amp; Extras</option>
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

                {/* Immediate File / Camera / Google Drive / Simple Link Image Uploader */}
                <ImageUploader
                  label="Product Image (File, Camera, Google Drive or Link)"
                  value={prodImagePath}
                  onChange={(url) => setProdImagePath(url)}
                />

                <div>
                  <label
                    htmlFor="adm-prod-shortdesc"
                    className="block text-xs text-[#9AA3B8] mb-1"
                  >
                    Summary / Key Specifications
                  </label>
                  <textarea
                    id="adm-prod-shortdesc"
                    rows={2}
                    value={prodShortDesc}
                    onChange={(e) => setProdShortDesc(e.target.value)}
                    placeholder="Key specs, condition, included accessories or toner yield..."
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="adm-spec-cpu"
                      className="block text-xs text-[#9AA3B8] mb-1"
                    >
                      Primary Spec / CPU
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
                    Warranty &amp; Support Terms
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
                  <span>Publish to Live Catalog</span>
                </Button>
              </form>
            </Card>

            {/* Right: Existing Catalog Items with Inline Edit & Image Upgrade */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0A0E18] p-3">
                <span className="text-xs font-semibold text-[#F4F6FB]">
                  Filter Catalog ({filteredAdminProducts.length} items)
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdminCatFilter('all')}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold cursor-pointer ${
                      adminCatFilter === 'all'
                        ? 'bg-[#2563FF] text-white'
                        : 'bg-[#05070D] text-[#9AA3B8] hover:text-white'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAdminCatFilter(c.slug)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold cursor-pointer ${
                        adminCatFilter === c.slug
                          ? 'bg-[#2563FF] text-white'
                          : 'bg-[#05070D] text-[#9AA3B8] hover:text-white'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredAdminProducts.map((p) => {
                  const isEditing = editingProductId === p.id;
                  return (
                    <Card key={p.id} className="p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <ProductImageStage
                            src={p.images[0]?.path}
                            alt={p.name}
                            categoryId={p.categoryId}
                            className="h-16 w-20 shrink-0"
                          />
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-[#38BDF8]">
                                {p.brand} · {p.categoryId.toUpperCase()}
                              </span>
                              <span>·</span>
                              <span className="font-mono-tabular text-[#F5B93A]">
                                {p.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="font-display text-base font-bold text-[#F4F6FB] truncate">
                              {p.name}
                            </p>
                            <p className="font-mono-tabular text-xs text-[#9AA3B8]">
                              {formatNgnFromKobo(p.priceKobo)} · Stock: {p.stockQty} · Warranty:{' '}
                              {p.warrantyMonths}m
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              isEditing
                                ? setEditingProductId(null)
                                : startEditingProduct(p)
                            }
                          >
                            {isEditing ? (
                              <>
                                <X className="h-3.5 w-3.5" />
                                <span>Close</span>
                              </>
                            ) : (
                              <>
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>Edit / Upload Image</span>
                              </>
                            )}
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
                      </div>

                      {isEditing && (
                        <div className="pt-4 border-t border-white/10 space-y-3 bg-[#05070D]/60 p-4 rounded-xl">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-[#9AA3B8] mb-1">
                                Product Name
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-[#9AA3B8] mb-1">
                                  Brand
                                </label>
                                <input
                                  type="text"
                                  value={editBrand}
                                  onChange={(e) => setEditBrand(e.target.value)}
                                  className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-[#9AA3B8] mb-1">
                                  Category
                                </label>
                                <select
                                  value={editCategory}
                                  onChange={(e) =>
                                    setEditCategory(e.target.value as CategorySlug)
                                  }
                                  className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs text-white"
                                >
                                  <option value="laptops">Brand-New Laptops</option>
                                  <option value="uk-used">UK Used Laptops</option>
                                  <option value="desktops">Desktops</option>
                                  <option value="printers">Printers</option>
                                  <option value="photocopiers">Photocopiers</option>
                                  <option value="scanners">Scanners</option>
                                  <option value="ups">UPS &amp; Power</option>
                                  <option value="consumables">Consumables</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] text-[#9AA3B8] mb-1">
                                Price (NGN)
                              </label>
                              <input
                                type="number"
                                value={editPriceNaira}
                                onChange={(e) => setEditPriceNaira(e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs font-mono-tabular text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#9AA3B8] mb-1">
                                Stock Qty
                              </label>
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs font-mono-tabular text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#9AA3B8] mb-1">
                                Warranty (Months)
                              </label>
                              <input
                                type="number"
                                value={editWarrantyMonths}
                                onChange={(e) => setEditWarrantyMonths(e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs font-mono-tabular text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#9AA3B8] mb-1">
                              Short Description
                            </label>
                            <textarea
                              rows={2}
                              value={editShortDesc}
                              onChange={(e) => setEditShortDesc(e.target.value)}
                              className="w-full rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs text-white"
                            />
                          </div>

                          <ImageUploader
                            label="Replace Product Image (File, Camera, Google Drive or Link)"
                            value={editImagePath}
                            onChange={(url) => setEditImagePath(url)}
                          />

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProductId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleSaveEditedProduct(p)}
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Save Product Upgrade</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SITE-WIDE IMAGE MANAGER (FILE, CAMERA, GOOGLE DRIVE, SIMPLE LINK) */}
        {activeTab === 'images' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <Eyebrow>Site-Wide Visual Asset Manager</Eyebrow>
              <h2 className="font-display text-2xl font-bold text-[#F4F6FB]">
                Homepage Category Sections &amp; Product Gallery Images
              </h2>
              <p className="text-xs text-[#9AA3B8] max-w-3xl">
                Upload or replace images for any category card on the homepage or any product across the site using a local File, live Camera photo, Google Drive share link, or direct URL. Changes sync immediately to Firebase.
              </p>
            </div>

            {/* Category Section Images */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-[#38BDF8] flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <span>1. Homepage &amp; Catalog Category Section Images ({categories.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categories.map((cat) => (
                  <Card key={cat.id} className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <ProductImageStage
                        src={cat.heroImage}
                        alt={cat.name}
                        categoryId={cat.slug}
                        className="h-20 w-24 shrink-0"
                      />
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F5B93A]">
                          Category Section · #{cat.order}
                        </span>
                        <h4 className="font-display text-lg font-bold text-[#F4F6FB]">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-[#9AA3B8] line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <ImageUploader
                      compact
                      label={`Update "${cat.name}" Section Image`}
                      value={cat.heroImage}
                      onChange={(newUrl) => handleCategoryImageChange(cat, newUrl)}
                    />
                  </Card>
                ))}
              </div>
            </div>

            {/* All Product Images Site-Wide */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="font-display text-lg font-bold text-[#38BDF8] flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <span>2. All Product Images Site-Wide ({products.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {products.map((prod) => (
                  <Card key={prod.id} className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <ProductImageStage
                        src={prod.images[0]?.path}
                        alt={prod.name}
                        categoryId={prod.categoryId}
                        className="h-20 w-24 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38BDF8]">
                          {prod.brand} · {prod.categoryId}
                        </span>
                        <h4 className="font-display text-base font-bold text-[#F4F6FB] truncate">
                          {prod.name}
                        </h4>
                        <p className="font-mono-tabular text-xs text-[#F5B93A]">
                          {formatNgnFromKobo(prod.priceKobo)}
                        </p>
                      </div>
                    </div>

                    <ImageUploader
                      compact
                      label="Upload via File, Camera, Google Drive or Link"
                      value={prod.images[0]?.path || ''}
                      onChange={(newUrl) => handleQuickProductImageChange(prod, newUrl)}
                    />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDER PROCESSING & SHOWROOM DISPATCH */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <Card elevated className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Eyebrow>Showroom &amp; Specialist Dispatch Settings</Eyebrow>
                <p className="text-sm font-bold text-[#F4F6FB]">
                  {siteSettings.address} · Specialist WhatsApp: {siteSettings.whatsappDisplay}
                </p>
                <p className="text-xs text-[#9AA3B8]">
                  All Paystack and WhatsApp orders below sync with Firebase Firestore in real time.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void updateSiteSettings({
                    ...siteSettings,
                    whatsappNumber: '2347061766728',
                    whatsappDisplay: '0706 176 6728',
                    address: 'Computer Village, Ikeja, Lagos, Nigeria',
                  });
                  notifyAdmin('Synced Computer Village, Ikeja & 0706 176 6728 across site.');
                }}
              >
                Verify Showroom Contact Sync
              </Button>
            </Card>

            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">
                Customer Orders ({mergedOrders.length})
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
                      {o.customer.name} ({o.customer.phone}) · {o.deliveryZoneLabel}
                    </p>
                    <p className="font-mono-tabular text-xs text-[#9AA3B8]">
                      Total: {formatNgnFromKobo(o.totalKobo)} (Incl. VAT:{' '}
                      {formatNgnFromKobo(o.vatKobo)}) · Items:{' '}
                      {o.items.map((i) => `${i.nameSnapshot} ×${i.qty}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOrderStatusChange(o.orderRef, 'confirmed')}
                    >
                      Confirm Order
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrderStatusChange(o.orderRef, 'fulfilled')}
                    >
                      Mark Dispatched / Fulfilled
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
          </div>
        )}

        {/* TAB 4: DISCOUNTS */}
        {activeTab === 'discounts' && (
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

        {/* TAB 5: BULK CSV IMPORT */}
        {activeTab === 'csv' && (
          <Card elevated className="p-6 space-y-4 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold">
                  Bulk CSV Catalog Import
                </h2>
                <p className="text-xs text-[#9AA3B8]">
                  Supports laptops, uk-used, desktops, printers, photocopiers, scanners, ups, and consumables.
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
              placeholder="name,brand,categoryId,priceNaira,stockQty,warrantyMonths,shortDescription,imageUrl&#10;HP EliteBook 840 G8 UK Used,HP,uk-used,565000,15,6,Clean Grade-A UK used Core i7 notebook,/assets/products/laptop-edu.svg"
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
              <span>Validate &amp; Import CSV Rows</span>
            </Button>
          </Card>
        )}

        {/* TAB 6: QUOTE & GENERAL SERVICING LEADS */}
        {activeTab === 'leads' && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold">
              Quote &amp; General Servicing Leads (`schools`, `bulk`, `servicing`, `delivery`, `international`)
            </h2>
            {leads.length === 0 ? (
              <Card className="p-8 text-center text-sm text-[#9AA3B8]">
                No quote or servicing leads submitted yet. Submit a form on the Homepage, `/schools`, or `/bulk` to see it appear here.
              </Card>
            ) : (
              leads.map((l) => (
                <Card key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#38BDF8]">
                      <span className="uppercase font-bold">{l.segment}</span>
                      <span>·</span>
                      <span>{l.contactName}</span>
                      <span>·</span>
                      <span className="font-mono-tabular">{l.phone}</span>
                    </div>
                    {l.organizationName && (
                      <p className="text-xs font-semibold text-[#F5B93A]">
                        Organization: {l.organizationName}
                      </p>
                    )}
                    <p className="text-xs text-[#F4F6FB]">{l.requirements}</p>
                  </div>
                  <a
                    href={`https://wa.me/${l.phone.replace(/[^\d]/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(
                      `Hello ${l.contactName}, this is ILLAI-RHASAK Nig. Enterprises (Computer Village, Ikeja) following up on your ${l.segment} request.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary shrink-0"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    Reply on WhatsApp
                  </a>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Section>
  );
};
