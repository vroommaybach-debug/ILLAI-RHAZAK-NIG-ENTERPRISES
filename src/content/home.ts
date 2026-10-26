export interface HomeSectionOrderItem {
  id:
    | 'hero'
    | 'marquee'
    | 'categories'
    | 'audiences'
    | 'specSpotlight'
    | 'warrantyPromise'
    | 'ctaBand';
  label: string;
  visible: boolean;
}

export interface HomeContentMap {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    trustPoints: string[];
    featuredMachineSlug: string;
    featuredCallout: string;
  };
  marqueeItems: string[];
  categoriesHeader: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  audiencesHeader: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  audiences: {
    id: 'schools' | 'bulk' | 'lagos' | 'nationwide' | 'international';
    eyebrow: string;
    title: string;
    description: string;
    route: string;
    ctaLabel: string;
    whatsappSegment: 'schools' | 'bulk' | 'lagos' | 'nationwide' | 'international';
    highlightMetric: string;
  }[];
  specSpotlight: {
    eyebrow: string;
    title: string;
    subtitle: string;
    machineName: string;
    machineCategory: string;
    priceKobo: number;
    warrantyBadge: string;
    productSlug: string;
    rows: {
      group: string;
      label: string;
      value: string;
      note: string;
    }[];
  };
  warrantyPromise: {
    eyebrow: string;
    title: string;
    subtitle: string;
    pillars: {
      number: string;
      title: string;
      body: string;
      linkLabel: string;
      linkHref: string;
    }[];
  };
  ctaBand: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  sectionOrder: HomeSectionOrderItem[];
}

export const DEFAULT_HOME_CONTENT: HomeContentMap = {
  hero: {
    eyebrow: 'Computer Village, Ikeja, Lagos · Brand-New & UK Used · General Servicing',
    headline: 'Serious Machines for Buyers Who Refuse Counterfeits.',
    subheadline:
      'Brand-new and Grade-A UK used laptops, tower desktops, LaserJet printers, photocopiers, ADF scanners, UPS units, consumables, and general servicing straight from Computer Village, Ikeja, Lagos.',
    primaryCtaLabel: 'Explore Hardware Catalog',
    secondaryCtaLabel: 'Speak to a Specialist (0706 176 6728)',
    trustPoints: [
      'Brand New & Grade-A UK Used Hardware',
      'Warranty Attached Per Individual Machine',
      'VAT 7.5% Included in Every Listed Price',
      'Computer Village, Ikeja Pickup & Nationwide Delivery',
    ],
    featuredMachineSlug: 'hp-elitebook-840-g10-i7-16gb-512gb',
    featuredCallout: 'HP EliteBook 840 G10 · Core i7 13th Gen · 12-Month Serial Warranty',
  },
  marqueeItems: [
    'BRAND-NEW LAPTOPS',
    'GRADE-A UK USED LAPTOPS',
    'TOWER & ALL-IN-ONE DESKTOPS',
    'PHOTOCOPIER MACHINES',
    'LASERJET PRINTERS & SCANNERS',
    'UPS & POWER BACKUP',
    'CONSUMABLES & EXTRAS',
    'GENERAL SERVICING & MAINTENANCE',
  ],
  categoriesHeader: {
    eyebrow: '01. Complete Hardware & Consumables Range',
    title: 'Eight Precision Categories. One Trusted Standard.',
    subtitle:
      'From brand-new and Grade-A UK used laptops to commercial photocopiers, UPS backup, consumables, and general servicing in Computer Village, Ikeja.',
  },
  audiencesHeader: {
    eyebrow: '02. Tailored Procurement & Servicing Paths',
    title: 'Built Around How You Buy and Maintain Your Machines.',
    subtitle:
      'From a single notebook delivered in Lagos today to a 40-seat school computer lab or routine fleet servicing.',
  },
  audiences: [
    {
      id: 'schools',
      eyebrow: 'Education & CBT Centres',
      title: 'Schools, Colleges & ICT Labs',
      description:
        'Term-ready starter bundles combining student laptops, a teacher desktop, duplex printer, photocopier, and optical exam scanner with staged delivery.',
      route: '/schools',
      ctaLabel: 'Configure School Bundle',
      whatsappSegment: 'schools',
      highlightMetric: 'Term-Based Lab Packages',
    },
    {
      id: 'bulk',
      eyebrow: 'Corporate & Institutional',
      title: 'Bulk & Enterprise Procurement',
      description:
        'Tiered volume discounts, VAT-compliant pro-forma invoices, matching serial batches, and dedicated account handling.',
      route: '/bulk',
      ctaLabel: 'Request Volume Quote',
      whatsappSegment: 'bulk',
      highlightMetric: '5+ to 100+ Unit Tiers',
    },
    {
      id: 'lagos',
      eyebrow: 'Computer Village, Ikeja & Greater Lagos',
      title: 'Same-Day Lagos Delivery & Pickup',
      description:
        'Collect in person at our Computer Village, Ikeja showroom for ₦0 fee or book insured dispatch across Lagos Mainland, VI, Ikoyi, and Lekki.',
      route: '/delivery',
      ctaLabel: 'View Lagos Zones',
      whatsappSegment: 'lagos',
      highlightMetric: '₦0 Ikeja Pickup Available',
    },
    {
      id: 'nationwide',
      eyebrow: 'All 36 States & FCT',
      title: 'Nationwide Inter-State Delivery',
      description:
        'Tamper-evident packaging and tracked air/road cargo to Abuja, Port Harcourt, Ibadan, Enugu, Kano, and across Nigeria.',
      route: '/delivery',
      ctaLabel: 'Check State Rates & ETAs',
      whatsappSegment: 'nationwide',
      highlightMetric: '1–4 Business Days',
    },
    {
      id: 'international',
      eyebrow: 'Cross-Border Supply',
      title: 'West Africa & International Shipping',
      description:
        'Export-packed hardware shipments for regional offices, schools, and NGOs across West Africa and international destinations.',
      route: '/international',
      ctaLabel: 'Request Export Quote',
      whatsappSegment: 'international',
      highlightMetric: 'Custom Freight Quotes',
    },
  ],
  specSpotlight: {
    eyebrow: '03. Schema-Verified Specifications',
    title: 'Every Spec Line Published. Nothing Hidden in Fine Print.',
    subtitle:
      'We document exact processor generations, memory channels, storage interfaces, and per-unit warranty terms on every product page.',
    machineName: 'HP EliteBook 840 G10 14" Executive Notebook',
    machineCategory: 'Executive Laptop · Factory Sealed',
    priceKobo: 158000000,
    warrantyBadge: '12-Month Serial-Linked Product Warranty',
    productSlug: 'hp-elitebook-840-g10-i7-16gb-512gb',
    rows: [
      {
        group: 'Compute',
        label: 'Processor Architecture',
        value: 'Intel Core i7-1355U (10 Cores, 12 Threads, up to 5.0 GHz)',
        note: '13th Gen Raptor Lake Enterprise Platform',
      },
      {
        group: 'Memory',
        label: 'Installed Memory (RAM)',
        value: '16 GB DDR5-5200 MHz (Upgradeable Dual-SODIMM)',
        note: 'Zero soldered-RAM bottlenecks',
      },
      {
        group: 'Storage',
        label: 'Primary Solid-State Drive',
        value: '512 GB PCIe Gen4×4 NVMe M.2 TLC SSD',
        note: 'Hardware encryption ready',
      },
      {
        group: 'Display',
        label: 'Panel & Luminance',
        value: '14.0" WUXGA (1920 × 1200) 16:10 Anti-Glare IPS · 400 nits',
        note: 'Low-blue-light comfort for 10+ hour workdays',
      },
      {
        group: 'Connectivity',
        label: 'Enterprise I/O Ports',
        value: '2× Thunderbolt 4 (USB4), 2× USB-A 3.2, HDMI 2.1, Wi-Fi 6E',
        note: 'Drives dual 4K external monitors effortlessly',
      },
      {
        group: 'Coverage',
        label: 'Attached Product Warranty',
        value: '12 Months Carry-In Hardware Warranty (Serial Recorded)',
        note: 'Printed directly on your ILLAI-RHASAK receipt',
      },
    ],
  },
  warrantyPromise: {
    eyebrow: '04. The ILLAI-RHASAK Trust Architecture',
    title: 'Clear Terms Before You Pay a Single Naira.',
    subtitle:
      'High-value hardware buyers deserve verifiable guarantees. Here is exactly how condition, warranty, servicing, and returns work on every transaction.',
    pillars: [
      {
        number: '01',
        title: 'Verified Hardware & Transparent Grading',
        body: 'Every machine is clearly designated as Factory-Sealed Brand New or Grade-A Direct UK Corporate Used—never misrepresented.',
        linkLabel: 'Inspect Catalog',
        linkHref: '/shop',
      },
      {
        number: '02',
        title: 'Warranty & General Servicing',
        body: 'Warranty is bound to each specific product and serial number on your receipt, backed by in-house general servicing for laptops, printers, copiers, and UPS in Computer Village, Ikeja.',
        linkLabel: 'Read Warranty Policy',
        linkHref: '/policies/warranty',
      },
      {
        number: '03',
        title: 'Published Returns & VAT Breakdown',
        body: 'All prices include 7.5% VAT shown clearly as a breakdown line—never added at the last step. Our DOA verification and return conditions are published openly.',
        linkLabel: 'Read Returns Policy',
        linkHref: '/policies/returns',
      },
    ],
  },
  ctaBand: {
    eyebrow: 'Ready When You Are · Computer Village, Ikeja, Lagos',
    title: 'Checkout Online with Paystack or Speak to a Specialist on WhatsApp.',
    subtitle:
      'Whether you prefer instant online card/bank transfer checkout or speaking with our Computer Village, Ikeja sales & servicing desk, both paths generate a verified ILLAI-RHASAK order receipt.',
    primaryCta: 'Shop All Hardware & Consumables',
    secondaryCta: 'Speak to a Specialist (0706 176 6728)',
  },
  sectionOrder: [
    { id: 'hero', label: 'Hero Showcase', visible: true },
    { id: 'marquee', label: 'Category Marquee', visible: true },
    { id: 'categories', label: 'Four Hardware Categories', visible: true },
    { id: 'audiences', label: 'Five Buyer Audience Paths', visible: true },
    { id: 'specSpotlight', label: 'Interactive Spec Card', visible: true },
    { id: 'warrantyPromise', label: 'Warranty & Trust Pillars', visible: true },
    { id: 'ctaBand', label: 'Closing Conversion Band', visible: true },
  ],
};
