import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppData } from '../../app/storeProvider';
import { ProductImageStage } from '../../components/ui';
import { calculateVatComponentKobo, formatNgnFromKobo } from '../../lib/money';
import { registerGsapPluginsOnce, shouldReduceMotion } from '../../lib/motion';
import { useCartStore } from '../cart/cartStore';

export const HomePage: React.FC = () => {
  const {
    products,
    siteSettings,
    themeSettings,
    submitSegmentLead,
  } = useAppData();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const pricing = useCartStore((s) => s.pricing);
  const navigate = useNavigate();

  const rootRef = useRef<HTMLDivElement>(null);
  const storefrontRef = useRef<HTMLElement>(null);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [specProductId, setSpecProductId] = useState<string>(
    () => publishedProducts[0]?.id || ''
  );

  // Quick Quote state beneath template
  const [quoteSegment, setQuoteSegment] = useState<
    'schools' | 'bulk' | 'delivery' | 'international'
  >('schools');
  const [quoteOrg, setQuoteOrg] = useState('');
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteReq, setQuoteReq] = useState('');
  const [quoteSavedId, setQuoteSavedId] = useState<string | null>(null);

  const activeSpecProduct = useMemo(
    () =>
      publishedProducts.find((p) => p.id === specProductId) ||
      publishedProducts[0],
    [publishedProducts, specProductId]
  );

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    publishedProducts.forEach((p) => {
      if (selectedCat === 'all' || p.categoryId === selectedCat) {
        set.add(p.brand);
      }
    });
    return Array.from(set).sort();
  }, [publishedProducts, selectedCat]);

  const filteredProducts = useMemo(() => {
    return publishedProducts.filter((p) => {
      if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.name} ${p.brand} ${p.shortDescription} ${Object.values(
          p.specs
        ).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [publishedProducts, selectedCat, selectedBrand, searchQuery]);

  // Exact GSAP animations from ILLAI-RHASAK_Homepage__Proposal_Draft__08d9c060.html
  useEffect(() => {
    registerGsapPluginsOnce();
    const reduce = shouldReduceMotion(themeSettings.motion.level);
    const scope = rootRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      // Hero intro
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo(
        '.hero h1 .split span',
        { yPercent: reduce ? 0 : 110 },
        { yPercent: 0, duration: reduce ? 0.01 : 1.2, stagger: 0.15 }
      ).fromTo(
        '.hero .lead, .hero-ctas, .stats, .hero .eyebrow',
        { y: reduce ? 0 : 30, opacity: 0 },
        { y: 0, opacity: 1, duration: reduce ? 0.01 : 1, stagger: 0.1 },
        '-=0.8'
      );

      if (!reduce) {
        gsap.to('.orb.a', {
          x: 80,
          y: 60,
          scrollTrigger: { trigger: '.hero', scrub: 1 },
        });
        gsap.to('.orb.b', {
          x: -60,
          y: -80,
          scrollTrigger: { trigger: '.hero', scrub: 1 },
        });
      }

      // Spec rows build on scroll
      gsap.fromTo(
        '#specRows .row',
        { opacity: 0, y: reduce ? 0 : 14 },
        {
          opacity: 1,
          y: 0,
          duration: reduce ? 0.01 : 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: '#specRows', start: 'top 85%' },
        }
      );

      // Counters
      scope.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count || '0');
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            if (reduce) {
              el.innerText = String(target);
              return;
            }
            gsap.fromTo(
              el,
              { innerText: 0 },
              {
                innerText: target,
                duration: 1.6,
                snap: { innerText: 1 },
                ease: 'power2.out',
              }
            );
          },
        });
      });
    }, scope);

    // Category 3D tilt on mousemove
    const cards = Array.from(scope.querySelectorAll<HTMLElement>('.cat'));
    const moveHandlers = new Map<HTMLElement, (e: MouseEvent) => void>();
    const leaveHandlers = new Map<HTMLElement, () => void>();

    if (!reduce) {
      cards.forEach((card) => {
        const onMove = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, {
            rotateX: -y * 8,
            rotateY: x * 8,
            transformPerspective: 900,
            duration: 0.4,
            ease: 'power2.out',
          });
        };
        const onLeave = () => {
          gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6 });
        };
        moveHandlers.set(card, onMove);
        leaveHandlers.set(card, onLeave);
        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);
      });
    }

    return () => {
      ctx.revert();
      cards.forEach((card) => {
        const m = moveHandlers.get(card);
        const l = leaveHandlers.get(card);
        if (m) card.removeEventListener('mousemove', m);
        if (l) card.removeEventListener('mouseleave', l);
      });
    };
  }, [themeSettings.motion.level]);

  const handleSelectCategoryCard = (catSlug: string) => {
    setSelectedCat(catSlug);
    setSelectedBrand('all');
    if (storefrontRef.current) {
      storefrontRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteName.trim() || !quotePhone.trim() || !quoteReq.trim()) return;
    const saved = await submitSegmentLead({
      segment: quoteSegment,
      organizationName: quoteOrg.trim(),
      contactName: quoteName.trim(),
      phone: quotePhone.trim(),
      email: '',
      country: quoteSegment === 'international' ? 'International' : 'Nigeria',
      state: 'Lagos',
      quantities: '',
      requirements: quoteReq.trim(),
    });
    setQuoteSavedId(saved.id);
    setQuoteOrg('');
    setQuoteName('');
    setQuotePhone('');
    setQuoteReq('');
  };

  const whatsappNum = siteSettings.whatsappNumber || '2349046453977';

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ComputerStore',
    name: siteSettings.legalName,
    description: siteSettings.footerCopy,
    telephone: `+${whatsappNum}`,
    email: siteSettings.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ikeja',
      addressLocality: 'Ikeja',
      addressRegion: 'Lagos',
      addressCountry: 'NG',
    },
    priceRange: '₦₦₦',
    currenciesAccepted: 'NGN',
  };

  return (
    <div ref={rootRef}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* =====================================================================
          PART 1: EXACT PROPOSAL DRAFT HTML TEMPLATE
         ===================================================================== */}
      <header className="hero" id="top">
        <div className="orb a" />
        <div className="orb b" />
        <div className="orb c" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="eyebrow">
            Ikeja, Lagos &middot; Brand new &middot; Warranty on every unit
          </div>
          <h1>
            <span className="split">
              <span>Machines built</span>
            </span>
            <span className="split">
              <span className="grad">for serious work.</span>
            </span>
          </h1>
          <p className="lead">
            Laptops, desktops, printers and scanners, every one brand new and
            covered by warranty. Shop for yourself, equip a school, or stock an
            office across Nigeria and abroad.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#categories">
              Shop the range
            </a>
            <a
              className="btn btn-ghost"
              href={`https://wa.me/${whatsappNum}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Talk to a specialist
            </a>
          </div>
          <div className="stats">
            <div className="stat">
              <b data-count="100">100</b>
              <span>% brand new stock</span>
            </div>
            <div className="stat">
              <b data-count="1">1</b>
              <span>warranty per unit</span>
            </div>
            <div className="stat">
              <b>NG + Intl</b>
              <span>delivery</span>
            </div>
          </div>
        </div>
        <div className="scroll-cue" />
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="track">
          <span>Laptops</span>
          <i>&bull;</i>
          <span>Desktops</span>
          <i>&bull;</i>
          <span>Printers</span>
          <i>&bull;</i>
          <span>Scanners</span>
          <i>&bull;</i>
          <span>Brand new only</span>
          <i>&bull;</i>
          <span>Warranty on every unit</span>
          <i>&bull;</i>
          <span>Laptops</span>
          <i>&bull;</i>
          <span>Desktops</span>
          <i>&bull;</i>
          <span>Printers</span>
          <i>&bull;</i>
          <span>Scanners</span>
          <i>&bull;</i>
          <span>Brand new only</span>
          <i>&bull;</i>
          <span>Warranty on every unit</span>
          <i>&bull;</i>
        </div>
      </div>

      <section id="categories" className="home-section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">The range</div>
              <h2>
                Four categories.
                <br />
                One standard.
              </h2>
            </div>
            <p className="lead">
              Every product is verified brand new, specified in full, and sold
              with warranty.
            </p>
          </div>
          <div className="cats">
            <a
              className="cat"
              href="#storefront"
              onClick={(e) => {
                e.preventDefault();
                handleSelectCategoryCard('laptops');
              }}
              style={{ ['--c' as string]: '#2563ff' }}
            >
              <div className="stage" />
              <span className="num">01</span>
              <div>
                <h3>Laptops</h3>
                <p>
                  Business, creator and student machines, from everyday work to
                  heavy design.
                </p>
                <span className="go">Explore &rarr;</span>
              </div>
            </a>
            <a
              className="cat"
              href="#storefront"
              onClick={(e) => {
                e.preventDefault();
                handleSelectCategoryCard('desktops');
              }}
              style={{ ['--c' as string]: '#38bdf8' }}
            >
              <div className="stage" />
              <span className="num">02</span>
              <div>
                <h3>Desktops</h3>
                <p>
                  Towers and all-in-ones built for offices, studios and labs.
                </p>
                <span className="go">Explore &rarr;</span>
              </div>
            </a>
            <a
              className="cat"
              href="#storefront"
              onClick={(e) => {
                e.preventDefault();
                handleSelectCategoryCard('printers');
              }}
              style={{ ['--c' as string]: '#ef2b3a' }}
            >
              <div className="stage" />
              <span className="num">03</span>
              <div>
                <h3>Printers</h3>
                <p>
                  Office, photo and high-volume printers, with consumables
                  supply.
                </p>
                <span className="go">Explore &rarr;</span>
              </div>
            </a>
            <a
              className="cat"
              href="#storefront"
              onClick={(e) => {
                e.preventDefault();
                handleSelectCategoryCard('scanners');
              }}
              style={{ ['--c' as string]: '#f5b93a' }}
            >
              <div className="stage" />
              <span className="num">04</span>
              <div>
                <h3>Scanners</h3>
                <p>
                  Document and archive scanners for schools, clinics and
                  offices.
                </p>
                <span className="go">Explore &rarr;</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="segments home-section" id="built-for">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Who we serve</div>
              <h2>
                Built for how
                <br />
                you buy.
              </h2>
            </div>
            <p className="lead">
              Whether you are buying one machine or a hundred, there is a clear
              path for you.
            </p>
          </div>
          <div className="seg-grid">
            <div className="seg wide">
              <span className="tag">Schools &amp; education</span>
              <h3>Equip the whole classroom, lab or library.</h3>
              <p>
                Term-ready bundles of laptops, desktops and scanners for
                schools, colleges and training centres, with staged delivery and
                invoicing.
              </p>
              <a
                className="btn btn-primary"
                href={`https://wa.me/${whatsappNum}?text=Hello%2C%20I%27m%20from%20a%20school%20and%20would%20like%20an%20education%20quote.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Request an education quote
              </a>
            </div>
            <div className="seg wide">
              <span className="tag">Bulk &amp; corporate</span>
              <h3>Stock your office. Scale your team.</h3>
              <p>
                Volume pricing for offices, agencies and businesses buying in
                batches, with account support and tailored warranty handling.
              </p>
              <a
                className="btn btn-primary"
                href={`https://wa.me/${whatsappNum}?text=Hello%2C%20I%20need%20a%20bulk%20price%20quote.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get a bulk price
              </a>
            </div>
            <div className="seg" id="delivery">
              <span className="tag">Lagos</span>
              <h3>Delivered in Lagos.</h3>
              <p>
                Pick up at our Ikeja showroom or have it delivered across Lagos.
              </p>
              <a
                className="btn btn-ghost"
                href={`https://wa.me/${whatsappNum}?text=Hello%2C%20I%27d%20like%20delivery%20in%20Lagos.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask about delivery
              </a>
            </div>
            <div className="seg">
              <span className="tag">Across Nigeria</span>
              <h3>Anywhere in the country.</h3>
              <p>
                Trusted delivery to every state, packed and insured for the
                road.
              </p>
              <a
                className="btn btn-ghost"
                href={`https://wa.me/${whatsappNum}?text=Hello%2C%20I%27d%20like%20delivery%20outside%20Lagos.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ship to my state
              </a>
            </div>
            <div className="seg">
              <span className="tag">International</span>
              <h3>Shipping abroad.</h3>
              <p>
                We regularly ship internationally. Tell us where and we will
                quote it.
              </p>
              <a
                className="btn btn-ghost"
                href={`https://wa.me/${whatsappNum}?text=Hello%2C%20I%27d%20like%20an%20international%20shipping%20quote.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get an export quote
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="spec" className="home-section">
        <div className="wrap spec">
          <div className="spec-visual">
            <div className="lbl">
              {activeSpecProduct ? activeSpecProduct.name : 'Pro 14'}
              <small>
                {activeSpecProduct
                  ? `${activeSpecProduct.brand} · ${formatNgnFromKobo(
                      activeSpecProduct.priceKobo
                    )}`
                  : 'Sample product'}
              </small>
            </div>
          </div>
          <div>
            <div className="eyebrow">The spec card</div>
            <h2 style={{ margin: '16px 0 26px' }}>
              Every detail,
              <br />
              in plain sight.
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {publishedProducts.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSpecProductId(p.id)}
                  className={`btn ${
                    activeSpecProduct?.id === p.id ? 'btn-primary' : 'btn-ghost'
                  }`}
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  {p.brand} {p.name.split(' ').slice(1, 3).join(' ')}
                </button>
              ))}
            </div>

            <div className="specs" id="specRows">
              <div className="row">
                <span>Processor</span>
                <span>
                  {String(
                    activeSpecProduct?.specs.processor ||
                      activeSpecProduct?.specs.printTechnology ||
                      activeSpecProduct?.specs.scannerType ||
                      'Sample CPU'
                  )}
                </span>
              </div>
              <div className="row">
                <span>Memory</span>
                <span>
                  {activeSpecProduct?.specs.ramGb
                    ? `${activeSpecProduct.specs.ramGb} GB`
                    : '16 GB'}
                </span>
              </div>
              <div className="row">
                <span>Storage</span>
                <span>
                  {activeSpecProduct?.specs.storageGb
                    ? `${activeSpecProduct.specs.storageGb} GB SSD`
                    : '512 GB SSD'}
                </span>
              </div>
              <div className="row">
                <span>Display</span>
                <span>
                  {String(
                    activeSpecProduct?.specs.display ||
                      activeSpecProduct?.specs.maxResolutionDpi ||
                      activeSpecProduct?.specs.opticalResolutionDpi ||
                      '14" sample panel'
                  )}
                </span>
              </div>
              <div className="row">
                <span>Graphics</span>
                <span>
                  {String(
                    activeSpecProduct?.specs.graphics ||
                      activeSpecProduct?.specs.connectivity ||
                      'Integrated'
                  )}
                </span>
              </div>
              <div className="row">
                <span>Warranty</span>
                <span>
                  {activeSpecProduct
                    ? `${activeSpecProduct.warrantyMonths} months included with purchase`
                    : 'Included with purchase'}
                </span>
              </div>
            </div>
            <p className="spec-note">
              Live specs come from the Firebase product catalogue.
            </p>
          </div>
        </div>
      </section>

      <section id="warranty" className="home-section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Our promise</div>
              <h2>
                Brand new.
                <br />
                Covered.
              </h2>
            </div>
          </div>
          <div className="trust">
            <div className="tcard">
              <div className="big">100%</div>
              <h3>Brand new only</h3>
              <p>
                Every unit we sell is new and sealed. No refurbished stock sold
                as new.
              </p>
            </div>
            <div className="tcard">
              <div className="big">Per unit</div>
              <h3>Warranty on each product</h3>
              <p>
                Warranty comes with each brand new product you buy. Terms are
                listed on every product page and in our policies.
              </p>
            </div>
            <div className="tcard">
              <div className="big">Clear</div>
              <h3>Returns you can read</h3>
              <p>
                Our returns and exchange terms are published in full at{' '}
                <Link
                  to="/policies/returns"
                  style={{ color: 'var(--blue2)', textDecoration: 'underline' }}
                >
                  /policies/returns
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="band">
            <div className="eyebrow" style={{ color: '#fff' }}>
              Ready when you are
            </div>
            <h2 style={{ marginTop: '14px' }}>
              Get the right machine, today.
            </h2>
            <p>
              Speak to a specialist on WhatsApp for pricing, delivery, school
              and bulk orders.
            </p>
            <a
              className="btn"
              href={`https://wa.me/${whatsappNum}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
          PART 2: FULL FUNCTIONALITY BENEATH THE PROPOSAL DRAFT TEMPLATE
          (Live Firebase Product Catalogue, Cart & Checkout Bar, Quote Desk)
         ===================================================================== */}
      <section
        ref={storefrontRef}
        id="storefront"
        className="home-section"
        style={{ borderTop: '1px solid var(--line)', background: '#070a12' }}
      >
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">
                Live Showroom Storefront &middot; Synced with Firebase
              </div>
              <h2>
                Browse &amp; order
                <br />
                online.
              </h2>
            </div>
            <div className="space-y-3">
              <p className="lead">
                Every price is in Nigerian Naira (₦), inclusive of 7.5% VAT,
                with per-product warranty attached to each unit.
              </p>
              {pricing.items.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="btn btn-primary"
                    style={{ padding: '12px 22px', fontSize: '14px' }}
                  >
                    View Cart ({pricing.items.reduce((s, i) => s + i.qty, 0)}) &middot;{' '}
                    {formatNgnFromKobo(pricing.totalKobo)}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="btn btn-ghost"
                    style={{ padding: '12px 20px', fontSize: '14px' }}
                  >
                    Proceed to Checkout &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10 p-5 rounded-[22px] border border-[var(--line)] bg-[#0a0e18]">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: `All (${publishedProducts.length})` },
                  { id: 'laptops', label: 'Laptops' },
                  { id: 'desktops', label: 'Desktops' },
                  { id: 'printers', label: 'Printers' },
                  { id: 'scanners', label: 'Scanners' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCat(tab.id);
                    setSelectedBrand('all');
                  }}
                  className={`btn ${
                    selectedCat === tab.id ? 'btn-primary' : 'btn-ghost'
                  }`}
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Filter by brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="rounded-full border border-[var(--line)] bg-[#05070d] px-4 py-2.5 text-sm text-[var(--ink)] focus:border-[var(--blue2)] focus:outline-none"
              >
                <option value="all">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search model, CPU, RAM..."
                aria-label="Search hardware catalogue"
                className="rounded-full border border-[var(--line)] bg-[#05070d] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--blue2)] focus:outline-none"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="catalog-grid">
            {filteredProducts.map((product) => {
              const vatKobo = calculateVatComponentKobo(product.priceKobo);
              return (
                <article key={product.id} className="pcard group">
                  <div className="space-y-4">
                    <Link to={`/product/${product.slug}`} className="block">
                      <ProductImageStage
                        src={product.images[0]?.path}
                        alt={product.name}
                        categoryId={product.categoryId}
                        className="h-52 w-full"
                      />
                    </Link>

                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span
                        style={{
                          color: 'var(--blue2)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {product.brand} &middot; {product.categoryId}
                      </span>
                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                        {product.warrantyMonths}-Month Warranty
                      </span>
                    </div>

                    <Link
                      to={`/product/${product.slug}`}
                      className="block text-xl font-bold font-display hover:text-[var(--blue2)] transition-colors"
                    >
                      {product.name}
                    </Link>

                    <p className="text-sm text-[var(--muted)] line-clamp-2">
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--line)] space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-bold font-display">
                          {formatNgnFromKobo(product.priceKobo)}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          Incl. {formatNgnFromKobo(vatKobo)} 7.5% VAT
                        </div>
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {product.stockQty > 0
                          ? `${product.stockQty} in stock`
                          : 'Out of stock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={product.stockQty <= 0}
                        onClick={() => {
                          addItem(product, 1, products);
                          openDrawer();
                        }}
                        className="btn btn-primary flex-1"
                        style={{ padding: '12px 18px', fontSize: '14px' }}
                      >
                        Add to cart
                      </button>
                      <Link
                        to={`/product/${product.slug}`}
                        className="btn btn-ghost"
                        style={{ padding: '12px 16px', fontSize: '13px' }}
                      >
                        Specs
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Institutional & Export Quote Desk + Quick Store Links beneath Catalogue */}
          <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 p-8 rounded-[22px] border border-[var(--line)] bg-[#0a0e18] space-y-5">
              <div className="eyebrow">Institutional &amp; Bulk Procurement Desk</div>
              <h3 className="text-2xl sm:text-3xl font-bold font-display">
                Request a formal quote or pro-forma invoice.
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Saved directly to Firebase Firestore (`leads` collection) for our Ikeja sales team.
              </p>

              {quoteSavedId && (
                <div
                  role="status"
                  className="rounded-xl border border-[#38bdf8]/40 bg-[#2563ff]/15 p-4 text-sm text-[var(--ink)]"
                >
                  Quote request logged in Firebase ({quoteSavedId}). Our specialist team will reach out shortly.
                </div>
              )}

              <form onSubmit={handleQuickQuoteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    aria-label="Inquiry segment"
                    value={quoteSegment}
                    onChange={(e) =>
                      setQuoteSegment(
                        e.target.value as
                          | 'schools'
                          | 'bulk'
                          | 'delivery'
                          | 'international'
                      )
                    }
                    className="rounded-xl border border-[var(--line)] bg-[#05070d] px-4 py-3 text-sm text-[var(--ink)]"
                  >
                    <option value="schools">Schools &amp; Education Quote</option>
                    <option value="bulk">Bulk &amp; Corporate Supply</option>
                    <option value="delivery">Lagos &amp; Nationwide Delivery</option>
                    <option value="international">International Export Quote</option>
                  </select>

                  <input
                    type="text"
                    value={quoteOrg}
                    onChange={(e) => setQuoteOrg(e.target.value)}
                    placeholder="School or Company Name"
                    className="rounded-xl border border-[var(--line)] bg-[#05070d] px-4 py-3 text-sm text-[var(--ink)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="Contact Person Name *"
                    className="rounded-xl border border-[var(--line)] bg-[#05070d] px-4 py-3 text-sm text-[var(--ink)]"
                  />
                  <input
                    type="tel"
                    required
                    value={quotePhone}
                    onChange={(e) => setQuotePhone(e.target.value)}
                    placeholder="WhatsApp / Phone Number *"
                    className="rounded-xl border border-[var(--line)] bg-[#05070d] px-4 py-3 text-sm text-[var(--ink)]"
                  />
                </div>

                <textarea
                  rows={2}
                  required
                  value={quoteReq}
                  onChange={(e) => setQuoteReq(e.target.value)}
                  placeholder="Required models and quantities (e.g. 20x HP ProBook 14, 2x LaserJet Printers) *"
                  className="w-full rounded-xl border border-[var(--line)] bg-[#05070d] px-4 py-3 text-sm text-[var(--ink)]"
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '14px 24px', fontSize: '14px' }}
                >
                  Submit Quote Request
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 p-8 rounded-[22px] border border-[var(--line)] bg-[#0a0e18] space-y-5">
              <div className="eyebrow">Direct Store &amp; Admin Portals</div>
              <h3 className="text-2xl font-bold font-display">
                Everything at your fingertips.
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Access dedicated buyer portals, instant order receipts, and the live Firebase Admin &amp; CMS control panel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  to="/shop"
                  className="btn btn-ghost justify-start"
                  style={{ padding: '12px 18px', fontSize: '14px' }}
                >
                  Full Catalogue &rarr;
                </Link>
                <Link
                  to="/checkout"
                  className="btn btn-ghost justify-start"
                  style={{ padding: '12px 18px', fontSize: '14px' }}
                >
                  Checkout Desk &rarr;
                </Link>
                <Link
                  to="/order/IR-7K4M9P"
                  className="btn btn-ghost justify-start"
                  style={{ padding: '12px 18px', fontSize: '14px' }}
                >
                  Order Receipts &rarr;
                </Link>
                <Link
                  to="/admin"
                  className="btn btn-ghost justify-start"
                  style={{ padding: '12px 18px', fontSize: '14px' }}
                >
                  Admin &amp; CMS &rarr;
                </Link>
                <Link
                  to="/schools"
                  className="btn btn-ghost justify-start"
                  style={{ padding: '12px 18px', fontSize: '14px' }}
                >
                  Schools Supply &rarr;
                </Link>
                <Link
                  to="/bulk"
                  className="btn btn-ghost justify-start"
                  style={{ padding: '12px 18px', fontSize: '14px' }}
                >
                  Bulk &amp; Corporate &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
