import { PolicyDoc } from '../types';

export const SEED_POLICIES: Record<PolicyDoc['slug'], PolicyDoc> = {
  warranty: {
    slug: 'warranty',
    title: 'Per-Product Hardware Warranty Policy',
    lastUpdated: 'October 2026',
    isDraft: false,
    summary:
      'Every machine sold by ILLAI-RHASAK Nig. Enterprises is brand new and carries an individual warranty duration and terms attached to that specific product and serial number.',
    sections: [
      {
        heading: '1. Product-Specific Warranty Attachment',
        body: 'ILLAI-RHASAK Nig. Enterprises does not issue a generic blanket brand warranty. Instead, warranty coverage is attached to each individual product sold, as explicitly stated on that product’s specification sheet and recorded alongside the machine’s factory serial number on your official receipt.',
      },
      {
        heading: '2. What the Product Warranty Covers',
        body: 'During the stated warranty period for your specific product (typically 12 to 24 months depending on the machine), coverage applies to internal manufacturing defects in the mainboard, processor, factory-installed memory/SSD, optical scanner sensor, or display panel under normal operational use.',
      },
      {
        heading: '3. Exclusions & Conditions That Void Warranty',
        body: 'Warranty does not cover physical screen breakage, liquid spill damage, power surge/inverter burn marks caused by unstabilized mains voltage, unauthorized third-party disassembly, broken warranty seals, or expendable consumables (such as toner cartridges, ink bottles, paper rollers, and batteries beyond their rated cycle life).',
      },
      {
        heading: '4. How to Initiate a Warranty Claim',
        body: 'Present your original ILLAI-RHASAK order reference (IR-XXXXXX) and the unit matching the recorded serial number at our Computer Village, Ikeja, Lagos showroom, or contact 0706 176 6728 / illairhasakng@gmail.com prior to shipping an out-of-state machine for diagnostic assessment.',
      },
    ],
  },
  returns: {
    slug: 'returns',
    title: 'Returns, Inspection & Brand-New Verification Policy',
    lastUpdated: 'October 2026',
    isDraft: false,
    summary:
      'Because ILLAI-RHASAK Nig. Enterprises sells strictly brand-new factory-sealed hardware, return eligibility depends on seal integrity and verified Dead-on-Arrival (DOA) inspection timelines.',
    sections: [
      {
        heading: '1. Brand-New Only Sales Standard',
        body: 'Every laptop, desktop, printer, and scanner sold by ILLAI-RHASAK Nig. Enterprises is supplied brand new. Customers picking up in Ikeja or receiving delivery are encouraged to verify the model number and factory seal upon handover.',
      },
      {
        heading: '2. Dead-on-Arrival (DOA) Hardware Reporting Window',
        body: 'If a machine exhibits a verifiable out-of-the-box hardware defect upon initial boot, notify us within 48 hours of receipt with your order reference (IR-XXXXXX), serial number, and clear video/photo evidence.',
      },
      {
        heading: '3. Condition Required for Returns or Exchanges',
        body: 'To qualify for return or exchange, the machine must be returned with all original factory packaging, inner protective foam, power adapters, manuals, unused starter toners/inks, and matching serial numbers free of physical damage or password/BitLocker locks.',
      },
      {
        heading: '4. Non-Returnable Items',
        body: 'Unsealed printer consumables (opened toner cartridges or filled ink tanks), custom-configured corporate orders once unboxed, and units damaged by external power surges cannot be returned for refund.',
      },
    ],
  },
  shipping: {
    slug: 'shipping',
    title: 'Lagos Dispatch, Ikeja Pickup & Nationwide Shipping Policy',
    lastUpdated: 'October 2026',
    isDraft: false,
    summary:
      'Delivery fees and estimated transit timelines are calculated transparently by delivery zone and displayed clearly before payment.',
    sections: [
      {
        heading: '1. Ikeja Showroom Pickup (₦0 Fee)',
        body: 'Customers may select Ikeja Showroom Pickup at checkout at zero delivery cost. Bring your order reference (IR-XXXXXX) and valid identification or payment confirmation to collect your hardware in Ikeja, Lagos.',
      },
      {
        heading: '2. Lagos Mainland & Island Delivery',
        body: 'Orders confirmed before 2:00 PM WAT on business days are scheduled for same-day or next-business-day insured dispatch across Lagos Mainland, Victoria Island, Ikoyi, and Lekki according to the selected zone fee.',
      },
      {
        heading: '3. Nationwide Inter-State & International Shipping',
        body: 'Inter-state orders are double-packed and dispatched via tracked road/air cargo partners. International orders are quoted on request based on destination country, weight, and customs/battery regulations.',
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy & Data Protection Notice (NDPA Compliant)',
    lastUpdated: 'October 2026',
    isDraft: false,
    summary:
      'How ILLAI-RHASAK Nig. Enterprises collects, uses, and safeguards customer order and inquiry information.',
    sections: [
      {
        heading: '1. Information We Collect at Checkout',
        body: 'We collect only the details necessary to fulfill your hardware order and register your product warranty: name, phone number, email address, and delivery address. You do not need to create a permanent password account to buy from us.',
      },
      {
        heading: '2. Payment Security via Paystack',
        body: 'Online card and bank payments are processed directly by Paystack. ILLAI-RHASAK Nig. Enterprises never stores or accesses raw payment card numbers.',
      },
      {
        heading: '3. Order Receipt Protection',
        body: 'Order receipts are linked to your unique order reference (IR-XXXXXX) and the contact details provided at checkout.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Sale & Commercial Supply',
    lastUpdated: 'October 2026',
    isDraft: false,
    summary:
      'Commercial terms governing retail, school, and corporate purchases from ILLAI-RHASAK Nig. Enterprises.',
    sections: [
      {
        heading: '1. Pricing & 7.5% VAT Inclusion',
        body: 'All prices are stated in Nigerian Naira (NGN) and are inclusive of Value Added Tax (VAT) at 7.5%. The embedded VAT component is itemized on your checkout summary and order receipt.',
      },
      {
        heading: '2. Order Confirmation & Stock Allocation',
        body: 'All cart totals, discount codes, and stock quantities are verified at checkout. An order is binding once payment is confirmed via Paystack or verified in writing by our sales desk on WhatsApp.',
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookies & Browser Storage Policy',
    lastUpdated: 'October 2026',
    isDraft: false,
    summary:
      'We use strictly functional browser storage to keep your shopping cart and delivery preferences intact.',
    sections: [
      {
        heading: '1. Shopping Cart Persistence',
        body: 'We store your selected cart items and delivery zone preference in your browser so your selections stay intact when you navigate between pages.',
      },
      {
        heading: '2. Security & Session Integrity',
        body: 'Authentication sessions are used strictly for authorized store personnel managing inventory and orders.',
      },
    ],
  },
};
