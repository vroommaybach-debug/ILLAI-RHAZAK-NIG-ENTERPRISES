export interface SegmentBundle {
  name: string;
  composition: string;
  idealFor: string;
  tierNote: string;
  discountCodeHint?: string;
}

export interface SegmentPageConfig {
  id: 'schools' | 'bulk' | 'delivery' | 'international';
  eyebrow: string;
  title: string;
  subtitle: string;
  proofHeadline: string;
  proofNote: string;
  primaryCtaLabel: string;
  whatsappSegment: 'schools' | 'bulk' | 'lagos' | 'nationwide' | 'international';
  highlights: {
    label: string;
    value: string;
    detail: string;
  }[];
  bundlesOrTiers: SegmentBundle[];
  formTitle: string;
  formSubtitle: string;
}

export const SEGMENT_CONFIGS: Record<
  'schools' | 'bulk' | 'delivery' | 'international',
  SegmentPageConfig
> = {
  schools: {
    id: 'schools',
    eyebrow: 'Education & Institutional Supply · Ikeja, Lagos',
    title: 'Turnkey ICT Labs & Examination Hardware for Schools and Colleges.',
    subtitle:
      'Equip computer labs, WAEC/JAMB CBT halls, and bursary offices with brand-new laptops, desktops, duplex laser printers, and optical sheet scanners—backed by per-unit serial warranty and term-aligned staged delivery.',
    proofHeadline: 'Trusted by Schools, Colleges & Training Academies (Client Partner Logos Slot)',
    proofNote:
      'Use code SCHOOL10 at checkout on orders above ₦800,000 for an immediate 10% institutional discount, or request a formal pro-forma invoice below.',
    primaryCtaLabel: 'Message Education Desk on WhatsApp',
    whatsappSegment: 'schools',
    highlights: [
      {
        label: 'Starter Lab Composition',
        value: '10–30 Laptops + 1 Desktop + 1 Printer + 1 Scanner',
        detail: 'Matched model batches for uniform classroom maintenance',
      },
      {
        label: 'Institutional Discount',
        value: 'Code: SCHOOL10 (10% Off)',
        detail: 'Automatically validated on qualifying cart subtotals >= ₦800,000',
      },
      {
        label: 'Warranty & Documentation',
        value: 'Per-Serial Warranty Schedule',
        detail: 'Every machine serial number listed on your school invoice',
      },
    ],
    bundlesOrTiers: [
      {
        name: 'Primary / Junior ICT Starter Kit (10 Seats)',
        composition:
          '10× Lenovo ThinkPad E14 Gen 5 Laptops + 1× Dell OptiPlex 7010 Teacher Desktop + 1× HP LaserJet Pro 4003dn Printer',
        idealFor: 'Growing private schools and coding clubs launching a modern ICT room',
        tierNote: 'Eligible for SCHOOL10 discount + staged Lagos or inter-state delivery',
        discountCodeHint: 'SCHOOL10',
      },
      {
        name: 'Secondary & CBT Examination Hall Pack (25 Seats)',
        composition:
          '20× Lenovo ThinkPad E14 Laptops + 5× Dell OptiPlex 7010 Tower Bundles + 1× HP LaserJet 4003dn + 1× Canon DR-C240 Duplex Exam Scanner',
        idealFor: 'Secondary schools, polytechnics, and accredited CBT centres',
        tierNote: 'Includes consolidated serial warranty ledger & board pro-forma invoice',
        discountCodeHint: 'SCHOOL10',
      },
    ],
    formTitle: 'Request a School Pro-Forma Invoice or Lab Quote',
    formSubtitle:
      'Submit your term hardware requirements below. Your inquiry is saved directly for our institutional desk and can also be sent via WhatsApp immediately.',
  },
  bulk: {
    id: 'bulk',
    eyebrow: 'Corporate & Enterprise Procurement',
    title: 'Volume Hardware Supply with VAT-Compliant Corporate Invoicing.',
    subtitle:
      'Source matched-batch laptops, office workstations, workgroup printers, and registry scanners for new staff onboarding, branch rollouts, and enterprise upgrades.',
    proofHeadline: 'Structured Volume Pricing & Dedicated Account Fulfilment',
    proofNote:
      'All listed prices include 7.5% VAT with a clear VAT breakdown line on every invoice—ready for corporate finance and audit teams.',
    primaryCtaLabel: 'Get a Bulk Price on WhatsApp',
    whatsappSegment: 'bulk',
    highlights: [
      {
        label: 'Tier 1 Volume (5 – 14 Units)',
        value: 'Instant Rebate + Priority Dispatch',
        detail: 'Apply LAGOS50K or request custom SKU quotation',
      },
      {
        label: 'Tier 2 Volume (15 – 49 Units)',
        value: 'Up to 10% Corporate Rebate',
        detail: 'Matched BIOS/hardware batches + consolidated serial manifest',
      },
      {
        label: 'Tier 3 Enterprise (50+ Units)',
        value: 'Custom Contract Allocation',
        detail: 'Staged warehouse allocation from Ikeja, Lagos',
      },
    ],
    bundlesOrTiers: [
      {
        name: 'Executive Onboarding Batch (5 – 14 Machines)',
        composition: 'HP EliteBook 840 G10 or Dell XPS 15 9530 + HP LaserJet Pro 4003dn',
        idealFor: 'Consulting firms, fintech teams, and executive suites',
        tierNote: 'Same-day Ikeja pickup or insured Lagos corporate delivery',
        discountCodeHint: 'LAGOS50K',
      },
      {
        name: 'Branch Office & Registry Rollout (15+ Machines)',
        composition: 'Dell OptiPlex 7010 Desktop Bundles + Canon imageFORMULA DR-C240 Scanners',
        idealFor: 'Commercial banks, HMO branches, hospitals, and logistics hubs',
        tierNote: 'Formal pro-forma invoice with 7.5% VAT component breakdown',
      },
    ],
    formTitle: 'Request Corporate Volume Pricing & Account Setup',
    formSubtitle:
      'Tell us the models and approximate quantities your organization requires.',
  },
  delivery: {
    id: 'delivery',
    eyebrow: 'Ikeja Pickup · Lagos Dispatch · 36 States Cargo',
    title: 'Transparent Delivery Fees & ETAs Powered Directly by Store Settings.',
    subtitle:
      'We never invent hidden shipping charges at the final step. Every delivery zone fee and estimated timeline below comes straight from our live store configuration.',
    proofHeadline: 'Factory-Sealed Dispatch from Computer Village, Ikeja, Lagos',
    proofNote:
      'Prefer to inspect your machine in person? Select "Pickup at Ikeja Showroom (Lagos)" at checkout for ₦0 delivery fee.',
    primaryCtaLabel: 'Confirm Dispatch on WhatsApp',
    whatsappSegment: 'lagos',
    highlights: [
      {
        label: 'Ikeja Showroom Pickup',
        value: '₦0 (Same Day)',
        detail: 'Verify factory seal and serial number in person in Ikeja',
      },
      {
        label: 'Lagos Mainland & Island',
        value: 'Same Day / Next Business Day',
        detail: 'Direct insured rider or vehicle dispatch across Lagos',
      },
      {
        label: 'Nationwide Inter-State',
        value: '1 – 4 Business Days',
        detail: 'Protective double-boxed cargo to Abuja, PH, Ibadan & all 36 states',
      },
    ],
    bundlesOrTiers: [],
    formTitle: 'Special Delivery or Multi-Location Dispatch Inquiry',
    formSubtitle:
      'Need coordinated delivery across multiple branches or states? Send your schedule below.',
  },
  international: {
    id: 'international',
    eyebrow: 'Cross-Border & Regional Export',
    title: 'International Hardware Supply from Lagos to West Africa & Beyond.',
    subtitle:
      'Ordering brand-new laptops, desktops, printers, or scanners for delivery outside Nigeria? Request a customized air or sea freight quotation based on exact destination weight and customs documentation.',
    proofHeadline: 'Export-Packed Commercial Hardware with Serial Manifests',
    proofNote:
      'International shipping rates depend on destination country, gross parcel weight, and lithium-ion battery air-cargo regulations—quoted accurately on request.',
    primaryCtaLabel: 'Request International Quote on WhatsApp',
    whatsappSegment: 'international',
    highlights: [
      {
        label: 'ECOWAS & West Africa',
        value: 'Benin, Ghana, Côte d’Ivoire, Senegal, Togo',
        detail: 'Air cargo or overland commercial waybill options',
      },
      {
        label: 'Air Freight Compliance',
        value: 'UN3481 Battery Documentation',
        detail: 'Properly declared laptop shipments with commercial invoice',
      },
      {
        label: 'Quote Turnaround',
        value: 'Within 4 Business Hours',
        detail: 'Direct response via WhatsApp (+234 706 176 6728) or Email',
      },
    ],
    bundlesOrTiers: [],
    formTitle: 'International Shipping Quote Request',
    formSubtitle:
      'Specify your destination country, required machines, and approximate quantities.',
  },
};
