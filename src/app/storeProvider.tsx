import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { DEFAULT_HOME_CONTENT, HomeContentMap } from '../content/home';
import { SEED_POLICIES } from '../content/policies';
import {
  SEED_CATEGORIES,
  SEED_DISCOUNTS,
  SEED_PRODUCTS,
  SEED_SITE_SETTINGS,
  SEED_SPEC_SCHEMAS,
} from '../content/seedData';
import {
  auth,
  db,
  testFirestoreConnectionOnce,
} from '../lib/firebase';
import { applyThemeTokens, DEFAULT_THEME_SETTINGS } from '../lib/theme';
import {
  Category,
  Discount,
  Order,
  OrderStatus,
  PolicyDoc,
  Product,
  SegmentLead,
  SiteSettings,
  SpecSchema,
  ThemeSettings,
} from '../types';
import { useCartStore } from '../features/cart/cartStore';

const INITIAL_DEMO_ORDER: Order = {
  orderRef: 'IR-7K4M9P',
  channel: 'paystack',
  status: 'paid',
  items: [
    {
      productId: SEED_PRODUCTS[0].id,
      slug: SEED_PRODUCTS[0].slug,
      nameSnapshot: SEED_PRODUCTS[0].name,
      brandSnapshot: SEED_PRODUCTS[0].brand,
      qty: 1,
      unitPriceKobo: SEED_PRODUCTS[0].priceKobo,
      lineTotalKobo: SEED_PRODUCTS[0].priceKobo,
      warrantyMonths: SEED_PRODUCTS[0].warrantyMonths,
      warrantyTerms: SEED_PRODUCTS[0].warrantyTerms,
    },
  ],
  subtotalKobo: SEED_PRODUCTS[0].priceKobo,
  discountKobo: 0,
  deliveryZoneId: 'lagos-mainland',
  deliveryZoneLabel: 'Lagos Mainland Express Dispatch',
  deliveryKobo: 650_000,
  vatKobo: Math.round(SEED_PRODUCTS[0].priceKobo - SEED_PRODUCTS[0].priceKobo / 1.075),
  totalKobo: SEED_PRODUCTS[0].priceKobo + 650_000,
  customer: {
    name: 'Adebayo Ogunlesi',
    phone: '08031234567',
    email: 'adebayo@lagosenterprise.ng',
    address: '14 Allen Avenue, Ikeja',
    state: 'Lagos',
    country: 'Nigeria',
  },
  paystackReference: 'PSTK_IR_7K4M9P_VERIFIED',
  createdAt: '2026-03-01T09:30:00.000Z',
  updatedAt: '2026-03-01T09:31:00.000Z',
};

interface AppDataContextValue {
  user: User | null;
  authReady: boolean;
  firebaseConnected: boolean;
  products: Product[];
  categories: Category[];
  specSchemas: Record<string, SpecSchema>;
  discounts: Discount[];
  orders: Order[];
  siteSettings: SiteSettings;
  themeSettings: ThemeSettings;
  homeContent: HomeContentMap;
  policies: Record<PolicyDoc['slug'], PolicyDoc>;
  leads: SegmentLead[];
  // Mutations for Admin, CMS, Checkout & Lead forms (synced to Firebase Firestore)
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  saveDiscount: (discount: Discount) => Promise<void>;
  saveOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderRef: string, status: OrderStatus) => Promise<void>;
  updateThemeSettings: (nextTheme: ThemeSettings) => Promise<void>;
  updateSiteSettings: (nextSite: SiteSettings) => Promise<void>;
  updateHomeContent: (nextHome: HomeContentMap) => Promise<void>;
  updatePolicy: (policy: PolicyDoc) => Promise<void>;
  submitSegmentLead: (lead: Omit<SegmentLead, 'id' | 'createdAt'>) => Promise<SegmentLead>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const LOCAL_CMS_STORAGE_KEY = 'ir-cms-state-v1';

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(true);

  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [specSchemas] = useState<Record<string, SpecSchema>>(SEED_SPEC_SCHEMAS);
  const [discounts, setDiscounts] = useState<Discount[]>(SEED_DISCOUNTS);
  const [orders, setOrders] = useState<Order[]>([INITIAL_DEMO_ORDER]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(SEED_SITE_SETTINGS);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(
    DEFAULT_THEME_SETTINGS
  );
  const [homeContent, setHomeContent] = useState<HomeContentMap>(
    DEFAULT_HOME_CONTENT
  );
  const [policies, setPolicies] =
    useState<Record<PolicyDoc['slug'], PolicyDoc>>(SEED_POLICIES);
  const [leads, setLeads] = useState<SegmentLead[]>([]);

  const seededRef = useRef(false);
  const refreshPricing = useCartStore((s) => s.refreshPricingFromServer);

  // Hydrate persisted local snapshot immediately
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          products: Product[];
          categories: Category[];
          discounts: Discount[];
          orders: Order[];
          siteSettings: SiteSettings;
          themeSettings: ThemeSettings;
          homeContent: HomeContentMap;
          policies: Record<PolicyDoc['slug'], PolicyDoc>;
          leads: SegmentLead[];
        }>;
        if (parsed.products?.length) setProducts(parsed.products);
        if (parsed.categories?.length) setCategories(parsed.categories);
        if (parsed.discounts?.length) setDiscounts(parsed.discounts);
        if (parsed.orders?.length) setOrders(parsed.orders);
        if (parsed.siteSettings) setSiteSettings(parsed.siteSettings);
        if (parsed.themeSettings) {
          setThemeSettings(parsed.themeSettings);
          applyThemeTokens(parsed.themeSettings);
        }
        if (parsed.homeContent) setHomeContent(parsed.homeContent);
        if (parsed.policies) setPolicies(parsed.policies);
        if (parsed.leads) setLeads(parsed.leads);
      } else {
        applyThemeTokens(DEFAULT_THEME_SETTINGS);
      }
    } catch {
      applyThemeTokens(DEFAULT_THEME_SETTINGS);
    }
  }, []);

  const persistLocalSnapshot = (
    overrides: Partial<{
      products: Product[];
      categories: Category[];
      discounts: Discount[];
      orders: Order[];
      siteSettings: SiteSettings;
      themeSettings: ThemeSettings;
      homeContent: HomeContentMap;
      policies: Record<PolicyDoc['slug'], PolicyDoc>;
      leads: SegmentLead[];
    }>
  ) => {
    try {
      const next = {
        products: overrides.products ?? products,
        categories: overrides.categories ?? categories,
        discounts: overrides.discounts ?? discounts,
        orders: overrides.orders ?? orders,
        siteSettings: overrides.siteSettings ?? siteSettings,
        themeSettings: overrides.themeSettings ?? themeSettings,
        homeContent: overrides.homeContent ?? homeContent,
        policies: overrides.policies ?? policies,
        leads: overrides.leads ?? leads,
      };
      localStorage.setItem(LOCAL_CMS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  useEffect(() => {
    applyThemeTokens(themeSettings);
  }, [themeSettings]);

  // Auth listener & initial Firestore connection check + live listeners
  useEffect(() => {
    void testFirestoreConnectionOnce();
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    // Live Products listener + auto-seed into Firestore if empty
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        setFirebaseConnected(true);
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Product);
          if (list.length > 0) {
            setProducts(list);
          }
        } else if (!seededRef.current) {
          seededRef.current = true;
          for (const p of SEED_PRODUCTS) {
            void setDoc(doc(db, 'products', p.id), p).catch(() => {});
          }
          for (const c of SEED_CATEGORIES) {
            void setDoc(doc(db, 'categories', c.id), c).catch(() => {});
          }
          for (const d of SEED_DISCOUNTS) {
            void setDoc(doc(db, 'discounts', d.id), d).catch(() => {});
          }
          void setDoc(doc(db, 'orders', INITIAL_DEMO_ORDER.orderRef), INITIAL_DEMO_ORDER).catch(() => {});
          void setDoc(doc(db, 'settings', 'site'), SEED_SITE_SETTINGS).catch(() => {});
          void setDoc(doc(db, 'settings', 'theme'), DEFAULT_THEME_SETTINGS).catch(() => {});
        }
      },
      () => {
        // Fallback silently if offline
      }
    );

    const unsubDiscounts = onSnapshot(
      collection(db, 'discounts'),
      (snap) => {
        if (!snap.empty) {
          setDiscounts(snap.docs.map((d) => d.data() as Discount));
        }
      },
      () => {}
    );

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Order);
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setOrders(list);
        }
      },
      () => {}
    );

    const unsubLeads = onSnapshot(
      collection(db, 'leads'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            ...(d.data() as Omit<SegmentLead, 'id'>),
            id: d.id,
          }));
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setLeads(list);
        }
      },
      () => {}
    );

    const unsubTheme = onSnapshot(
      doc(db, 'settings', 'theme'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ThemeSettings;
          if (data?.colors) {
            setThemeSettings(data);
            applyThemeTokens(data);
          }
        }
      },
      () => {}
    );

    const unsubSite = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SiteSettings;
          if (data?.wordmark) {
            setSiteSettings(data);
          }
        }
      },
      () => {}
    );

    return () => {
      unsubAuth();
      unsubProducts();
      unsubDiscounts();
      unsubOrders();
      unsubLeads();
      unsubTheme();
      unsubSite();
    };
  }, []);

  const syncWithServer = async (
    nextProducts: Product[],
    nextDiscounts: Discount[],
    nextSite: SiteSettings,
    actionLabel: string
  ) => {
    try {
      await fetch('/api/admin/sync-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: nextProducts,
          discounts: nextDiscounts,
          siteSettings: nextSite,
          actorEmail: user?.email || 'owner',
          actionLabel,
        }),
      });
      await refreshPricing({
        products: nextProducts,
        discounts: nextDiscounts,
        deliveryZones: nextSite.deliveryZones,
      });
    } catch {
      // Offline fallback
    }
  };

  const saveProduct = async (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    const nextProducts = exists
      ? products.map((p) => (p.id === product.id ? product : p))
      : [product, ...products];

    setProducts(nextProducts);
    persistLocalSnapshot({ products: nextProducts });
    await syncWithServer(
      nextProducts,
      discounts,
      siteSettings,
      exists ? `product.update:${product.slug}` : `product.create:${product.slug}`
    );

    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch {
      // Stored locally + server if offline
    }
  };

  const deleteProduct = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const nextProducts = products.map((p) =>
      p.id === productId ? { ...p, status: 'archived' as const } : p
    );
    setProducts(nextProducts);
    persistLocalSnapshot({ products: nextProducts });
    await syncWithServer(nextProducts, discounts, siteSettings, `product.archive:${productId}`);
    if (target) {
      try {
        await setDoc(doc(db, 'products', productId), {
          ...target,
          status: 'archived',
        });
      } catch {
        // Ignore offline error
      }
    }
  };

  const saveCategory = async (category: Category) => {
    const exists = categories.some((c) => c.id === category.id);
    const nextCategories = exists
      ? categories.map((c) => (c.id === category.id ? category : c))
      : [...categories, category];
    nextCategories.sort((a, b) => a.order - b.order);
    setCategories(nextCategories);
    persistLocalSnapshot({ categories: nextCategories });
    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch {
      // Ignore offline error
    }
  };

  const saveDiscount = async (discount: Discount) => {
    const exists = discounts.some((d) => d.id === discount.id);
    const nextDiscounts = exists
      ? discounts.map((d) => (d.id === discount.id ? discount : d))
      : [discount, ...discounts];
    setDiscounts(nextDiscounts);
    persistLocalSnapshot({ discounts: nextDiscounts });
    await syncWithServer(
      products,
      nextDiscounts,
      siteSettings,
      `discount.save:${discount.code || discount.id}`
    );
    try {
      await setDoc(doc(db, 'discounts', discount.id), discount);
    } catch {
      // Ignore offline error
    }
  };

  const saveOrder = async (order: Order) => {
    const exists = orders.some((o) => o.orderRef === order.orderRef);
    const nextOrders = exists
      ? orders.map((o) => (o.orderRef === order.orderRef ? order : o))
      : [order, ...orders];
    setOrders(nextOrders);
    persistLocalSnapshot({ orders: nextOrders });
    try {
      const firestoreOrder = {
        ...order,
        status:
          order.status === 'pending_whatsapp' ? 'whatsapp_initiated' : order.status,
      };
      await setDoc(doc(db, 'orders', order.orderRef), firestoreOrder);
    } catch {
      // Ignore offline error
    }
  };

  const updateOrderStatus = async (orderRef: string, status: OrderStatus) => {
    const target = orders.find((o) => o.orderRef === orderRef);
    if (target) {
      const updated: Order = {
        ...target,
        status,
        updatedAt: new Date().toISOString(),
      };
      const nextOrders = orders.map((o) => (o.orderRef === orderRef ? updated : o));
      setOrders(nextOrders);
      persistLocalSnapshot({ orders: nextOrders });
      try {
        await setDoc(doc(db, 'orders', orderRef), {
          ...updated,
          status: status === 'pending_whatsapp' ? 'whatsapp_initiated' : status,
        });
      } catch {
        // Ignore offline error
      }
    }
    try {
      await fetch('/api/admin/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef,
          status,
          actorEmail: user?.email || 'owner',
        }),
      });
    } catch {
      // Ignore offline error
    }
  };

  const updateThemeSettings = async (nextTheme: ThemeSettings) => {
    const bumped: ThemeSettings = {
      ...nextTheme,
      version: (nextTheme.version || 1) + 1,
    };
    setThemeSettings(bumped);
    applyThemeTokens(bumped);
    persistLocalSnapshot({ themeSettings: bumped });

    try {
      await setDoc(doc(db, 'settings', 'theme'), {
        ...bumped,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Ignore offline error
    }
  };

  const updateSiteSettings = async (nextSite: SiteSettings) => {
    setSiteSettings(nextSite);
    persistLocalSnapshot({ siteSettings: nextSite });
    await syncWithServer(products, discounts, nextSite, 'settings.site.update');
    try {
      await setDoc(doc(db, 'settings', 'site'), nextSite);
    } catch {
      // Ignore offline error
    }
  };

  const updateHomeContent = async (nextHome: HomeContentMap) => {
    setHomeContent(nextHome);
    persistLocalSnapshot({ homeContent: nextHome });
    try {
      await setDoc(doc(db, 'settings', 'content'), nextHome);
    } catch {
      // Ignore offline error
    }
  };

  const updatePolicy = async (policy: PolicyDoc) => {
    const nextPolicies = { ...policies, [policy.slug]: policy };
    setPolicies(nextPolicies);
    persistLocalSnapshot({ policies: nextPolicies });
    try {
      await setDoc(doc(db, 'settings', 'policies'), nextPolicies);
    } catch {
      // Ignore offline error
    }
  };

  const submitSegmentLead = async (
    leadInput: Omit<SegmentLead, 'id' | 'createdAt'>
  ): Promise<SegmentLead> => {
    const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newLead: SegmentLead = {
      ...leadInput,
      id,
      createdAt: new Date().toISOString(),
    };
    const nextLeads = [newLead, ...leads];
    setLeads(nextLeads);
    persistLocalSnapshot({ leads: nextLeads });

    try {
      await setDoc(doc(collection(db, 'leads'), id), {
        segment: newLead.segment,
        organizationName: newLead.organizationName || '',
        contactName: newLead.contactName,
        phone: newLead.phone,
        email: newLead.email || '',
        country: newLead.country || 'Nigeria',
        state: newLead.state || 'Lagos',
        quantities: newLead.quantities || '',
        requirements: newLead.requirements,
        createdAt: newLead.createdAt,
      });
    } catch {
      // Stored locally if Firestore write is offline
    }

    return newLead;
  };

  return (
    <AppDataContext.Provider
      value={{
        user,
        authReady,
        firebaseConnected,
        products,
        categories,
        specSchemas,
        discounts,
        orders,
        siteSettings,
        themeSettings,
        homeContent,
        policies,
        leads,
        saveProduct,
        deleteProduct,
        saveCategory,
        saveDiscount,
        saveOrder,
        updateOrderStatus,
        updateThemeSettings,
        updateSiteSettings,
        updateHomeContent,
        updatePolicy,
        submitSegmentLead,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
}
