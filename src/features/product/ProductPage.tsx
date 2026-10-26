import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import {
  Button,
  Card,
  Eyebrow,
  ProductImageStage,
  Section,
} from '../../components/ui';
import {
  calculateNetComponentKobo,
  calculateVatComponentKobo,
  formatNgnFromKobo,
} from '../../lib/money';
import { shouldReduceMotion } from '../../lib/motion';
import { buildProductWhatsAppUrl } from '../../lib/whatsapp';
import { useCartStore } from '../cart/cartStore';
import { ProductViewer3D } from './ProductViewer3D';
import { resolveProductModelSource } from './templates3d';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, specSchemas, siteSettings, themeSettings } = useAppData();
  const addItem = useCartStore((s) => s.addItem);

  const product = products.find((p) => p.slug === slug) || products[0];
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [viewMode, setViewMode] = useState<'gallery' | '3d'>('gallery');

  useEffect(() => {
    setViewMode('gallery');
    setActiveImageIdx(0);
  }, [slug]);

  if (!product) {
    return (
      <Section>
        <Card className="py-12 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Product Not Found</h1>
          <Button onClick={() => navigate('/shop')}>Return to Catalog</Button>
        </Card>
      </Section>
    );
  }

  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            path: '/assets/products/laptop-pro.svg',
            alt: product.name,
            width: 800,
            height: 600,
            order: 1,
            isPlaceholder: true,
          },
        ];

  const currentImage = images[activeImageIdx] || images[0];
  const schema = specSchemas[product.categoryId];
  const vatKobo = calculateVatComponentKobo(product.priceKobo, siteSettings.vatRate);
  const netKobo = calculateNetComponentKobo(product.priceKobo, siteSettings.vatRate);
  const whatsappUrl = buildProductWhatsAppUrl(product, siteSettings.whatsappNumber);
  const modelSource = resolveProductModelSource(product);
  const reduceMotion = shouldReduceMotion(themeSettings.motion.level);

  // Product JSON-LD per A14 & Phase 3
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    description: product.shortDescription,
    sku: product.id,
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: (product.priceKobo / 100).toFixed(2),
      availability:
        product.stockQty > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteSettings.legalName,
      },
    },
  };

  const handleGalleryKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode !== 'gallery') return;
    if (e.key === 'ArrowRight') {
      setActiveImageIdx((prev) => (prev + 1) % images.length);
    } else if (e.key === 'ArrowLeft') {
      setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <Section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="space-y-12">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9AA3B8]">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 hover:text-[#F4F6FB] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Hardware Catalog</span>
          </Link>
          <span>
            {product.brand} · {product.categoryId.toUpperCase()} · Brand New
          </span>
        </div>

        {/* Contiguous Purchase Module (Sticky Left Gallery / 3D Viewer + Right Purchase Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Gallery + On-Demand 3D Viewer */}
          <div
            tabIndex={0}
            onKeyDown={handleGalleryKeyDown}
            aria-label="Product media stage"
            className="lg:col-span-7 space-y-4 focus-visible:outline-2 focus-visible:outline-[#38BDF8] rounded-2xl"
          >
            {/* Media Mode Toolbar: Loads 3D only when user taps "View in 3D" */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0A0E18] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  aria-pressed={viewMode === '3d'}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === '3d'
                      ? 'bg-[#2563FF] text-white shadow-lg'
                      : 'border border-[#38BDF8]/40 bg-[#05070D] text-[#38BDF8] hover:bg-[#2563FF] hover:text-white'
                  }`}
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>View in 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  aria-pressed={viewMode === 'gallery'}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'gallery'
                      ? 'bg-white/15 text-white'
                      : 'text-[#9AA3B8] hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Photo gallery</span>
                </button>
              </div>

              <span className="text-[11px] text-[#9AA3B8]">
                {viewMode === '3d'
                  ? `${modelSource.sourceLabel} · Interactive hotspots active`
                  : 'Tap "View in 3D" to inspect interactive parts & specs'}
              </span>
            </div>

            {viewMode === '3d' && modelSource.type !== 'gallery' ? (
              <ProductViewer3D
                product={product}
                reducedMotion={reduceMotion}
                onFallbackToGallery={() => setViewMode('gallery')}
              />
            ) : (
              <div className="relative">
                <ProductImageStage
                  src={currentImage.path}
                  alt={currentImage.alt}
                  categoryId={product.categoryId}
                  isPlaceholder={currentImage.isPlaceholder}
                  className="h-[340px] sm:h-[440px] w-full"
                />
                {images.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)
                      }
                      aria-label="Previous product image"
                      className="pointer-events-auto rounded-full bg-[#05070D]/80 p-2 text-white border border-white/15 hover:border-[#38BDF8]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) => (prev + 1) % images.length)
                      }
                      aria-label="Next product image"
                      className="pointer-events-auto rounded-full bg-[#05070D]/80 p-2 text-white border border-white/15 hover:border-[#38BDF8]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <Card className="p-5 space-y-2">
              <h2 className="font-display text-sm font-bold text-[#F4F6FB]">
                Machine Overview
              </h2>
              <p className="text-sm text-[#9AA3B8] leading-relaxed">
                {product.longDescription}
              </p>
            </Card>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-5 ir-card-elevated p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Eyebrow>
                {product.brand} · Brand-New Factory Sealed · {product.warrantyMonths}-Month Warranty
              </Eyebrow>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F6FB]">
                {product.name}
              </h1>
              <p className="text-sm text-[#9AA3B8]">{product.shortDescription}</p>
            </div>

            {/* Price & Explicit 7.5% VAT Breakdown Line per A1 & A6 */}
            <div className="rounded-2xl border border-white/10 bg-[#05070D] p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-[#9AA3B8]">
                  Unit Price (7.5% VAT Inclusive)
                </span>
                {product.compareAtKobo && product.compareAtKobo > product.priceKobo && (
                  <span className="font-mono-tabular text-xs text-[#9AA3B8] line-through">
                    {formatNgnFromKobo(product.compareAtKobo)}
                  </span>
                )}
              </div>
              <p className="font-mono-tabular text-3xl font-bold text-[#F4F6FB]">
                {formatNgnFromKobo(product.priceKobo)}
              </p>
              <div className="pt-2 border-t border-white/8 flex flex-wrap items-center justify-between text-xs text-[#9AA3B8] font-mono-tabular">
                <span>Net Hardware: {formatNgnFromKobo(netKobo)}</span>
                <span>·</span>
                <span className="text-[#38BDF8]">
                  Included 7.5% VAT: {formatNgnFromKobo(vatKobo)}
                </span>
              </div>
            </div>

            {/* Per-Product Warranty Card per A1 & A11 */}
            <div className="rounded-2xl border border-[#F5B93A]/30 bg-[#F5B93A]/5 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F5B93A] font-display">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  Per-Product Warranty: {product.warrantyMonths} Months Attached to This Unit
                </span>
              </div>
              <p className="text-xs text-[#9AA3B8] leading-relaxed">
                {product.warrantyTerms}
              </p>
            </div>

            {/* Quantity & Primary Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9AA3B8]">
                <label htmlFor="pdp-qty">Quantity (Available: {product.stockQty})</label>
                <span className="text-[#38BDF8] font-semibold">
                  {product.stockQty > 0 ? 'Ready in Ikeja Showroom' : 'Out of Stock'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="pdp-qty"
                  type="number"
                  min={1}
                  max={Math.max(1, product.stockQty)}
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.max(
                        1,
                        Math.min(product.stockQty, Number(e.target.value) || 1)
                      )
                    )
                  }
                  className="w-20 rounded-full border border-white/15 bg-[#05070D] px-4 py-3 text-center font-mono-tabular text-sm font-bold text-white"
                />

                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={product.stockQty <= 0}
                  onClick={() => addItem(product, qty, products)}
                >
                  Add to Cart — {formatNgnFromKobo(product.priceKobo * qty)}
                </Button>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#38BDF8]/40 bg-[#0A0E18] py-3.5 text-sm font-semibold text-[#38BDF8] hover:bg-[#2563FF] hover:text-white transition-colors"
              >
                Order This Machine on WhatsApp ({siteSettings.whatsappDisplay})
              </a>
            </div>

            {/* Delivery & Trust Summary */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-[#9AA3B8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#38BDF8] shrink-0" />
                <span>100% Brand New — Never refurbished or grey-market</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#38BDF8] shrink-0" />
                <span>Free Ikeja Showroom Pickup (₦0) or Insured Lagos/Nationwide Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schema-Driven Specification Table rendered in exact schema order per Phase 3 */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Eyebrow>Technical Breakdown</Eyebrow>
            <h2 className="font-display text-2xl font-bold text-[#F4F6FB]">
              Verified Hardware Specifications ({product.categoryId.toUpperCase()} Schema)
            </h2>
          </div>

          <div className="ir-card-elevated overflow-hidden divide-y divide-white/10">
            {(schema?.fields || []).map((field) => {
              const rawVal = product.specs[field.id];
              const formattedVal =
                typeof rawVal === 'boolean'
                  ? rawVal
                    ? 'Yes (Supported)'
                    : 'No'
                  : rawVal !== undefined && rawVal !== ''
                  ? `${rawVal}${field.unit ? ` ${field.unit}` : ''}`
                  : 'Standard Factory Spec';

              return (
                <div
                  key={field.id}
                  className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-4">
                    <span className="text-[11px] text-[#F5B93A] font-medium block">
                      {field.group}
                    </span>
                    <span className="text-xs font-semibold text-[#9AA3B8]">
                      {field.label}
                    </span>
                  </div>
                  <div className="sm:col-span-8 font-mono-tabular text-sm font-semibold text-[#F4F6FB]">
                    {formattedVal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
};
