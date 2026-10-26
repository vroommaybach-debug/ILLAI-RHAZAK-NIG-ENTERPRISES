import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RotateCcw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import {
  Button,
  Card,
  Eyebrow,
  ProductImageStage,
  Section,
} from '../../components/ui';
import { calculateVatComponentKobo, formatNgnFromKobo } from '../../lib/money';
import { useCartStore } from '../cart/cartStore';

export const ShopPage: React.FC = () => {
  const { products, categories, specSchemas } = useAppData();
  const addItem = useCartStore((s) => s.addItem);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced filters per Phase 3
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedBrand = searchParams.get('brand') || 'all';
  const maxPriceKoboParam = searchParams.get('maxPriceKobo');
  const maxPriceKobo = maxPriceKoboParam ? Number(maxPriceKoboParam) : 0;
  const selectedRam = searchParams.get('ramGb') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    for (const p of publishedProducts) {
      if (selectedCategory === 'all' || p.categoryId === selectedCategory) {
        set.add(p.brand);
      }
    }
    return Array.from(set).sort();
  }, [publishedProducts, selectedCategory]);

  const activeSpecSchema =
    selectedCategory !== 'all' ? specSchemas[selectedCategory] : undefined;

  const filteredProducts = useMemo(() => {
    return publishedProducts.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }
      if (maxPriceKobo > 0 && p.priceKobo > maxPriceKobo) {
        return false;
      }
      if (selectedRam !== 'all' && String(p.specs.ramGb) !== selectedRam) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.name} ${p.brand} ${p.shortDescription} ${Object.values(
          p.specs
        ).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    publishedProducts,
    selectedCategory,
    selectedBrand,
    maxPriceKobo,
    selectedRam,
    searchQuery,
  ]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === '0') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <Section>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <Eyebrow>Brand-New Catalog · 7.5% VAT Inclusive</Eyebrow>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F4F6FB]">
              Hardware Storefront
            </h1>
            <p className="text-sm text-[#9AA3B8] max-w-2xl">
              Every machine is supplied brand new with its own per-product warranty duration and VAT-inclusive NGN price.
            </p>
          </div>

          {/* Interactive Category Segmented Filter Buttons */}
          <div
            role="group"
            aria-label="Filter by hardware category"
            className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0A0E18] p-1.5"
          >
            <button
              type="button"
              onClick={() => updateFilter('category', 'all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#2563FF] text-white'
                  : 'text-[#9AA3B8] hover:text-white'
              }`}
            >
              All Hardware ({publishedProducts.length})
            </button>
            {categories
              .filter((c) => c.visible)
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilter('category', cat.slug)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-[#2563FF] text-white'
                      : 'text-[#9AA3B8] hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </div>

        {/* URL-Synced Filter Toolbar */}
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label
                htmlFor="filter-search"
                className="block text-xs font-medium text-[#9AA3B8] mb-1.5"
              >
                Search Model or Spec
              </label>
              <input
                id="filter-search"
                type="search"
                value={searchQuery}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="e.g. EliteBook, Core i7, Duplex..."
                className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="filter-brand"
                className="block text-xs font-medium text-[#9AA3B8] mb-1.5"
              >
                Manufacturer Brand
              </label>
              <select
                id="filter-brand"
                value={selectedBrand}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
              >
                <option value="all">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-price"
                className="block text-xs font-medium text-[#9AA3B8] mb-1.5"
              >
                Max Price Ceiling (NGN)
              </label>
              <select
                id="filter-price"
                value={String(maxPriceKobo)}
                onChange={(e) => updateFilter('maxPriceKobo', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
              >
                <option value="0">Any Price</option>
                <option value="75000000">Up to ₦750,000</option>
                <option value="120000000">Up to ₦1,200,000</option>
                <option value="180000000">Up to ₦1,800,000</option>
                <option value="300000000">Up to ₦3,000,000</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-ram"
                className="block text-xs font-medium text-[#9AA3B8] mb-1.5"
              >
                {activeSpecSchema ? 'Schema Memory (RAM)' : 'Memory (Laptops/Desktops)'}
              </label>
              <select
                id="filter-ram"
                value={selectedRam}
                onChange={(e) => updateFilter('ramGb', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
              >
                <option value="all">All Configurations</option>
                <option value="16">16 GB RAM</option>
                <option value="32">32 GB RAM</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2 text-xs font-medium text-[#9AA3B8] hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
              <span className="font-mono-tabular text-xs text-[#38BDF8]">
                {filteredProducts.length} shown
              </span>
            </div>
          </div>
        </Card>

        {/* Product Grid: 3-column desktop per E-Commerce Reference */}
        {filteredProducts.length === 0 ? (
          <Card className="py-16 text-center space-y-4">
            <SlidersHorizontal className="h-8 w-8 text-[#38BDF8] mx-auto" />
            <h2 className="font-display text-xl font-bold">
              No machines match those exact filter criteria
            </h2>
            <p className="text-sm text-[#9AA3B8] max-w-md mx-auto">
              Clear your active filters or contact our Ikeja desk on WhatsApp if you need a custom configuration sourced.
            </p>
            <Button variant="primary" size="sm" onClick={resetFilters}>
              Show All Published Machines
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const vatComponent = calculateVatComponentKobo(product.priceKobo);
              return (
                <article
                  key={product.id}
                  className="group ir-card-surface p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#38BDF8]/40"
                >
                  <div className="space-y-4">
                    <Link to={`/product/${product.slug}`} className="block">
                      <ProductImageStage
                        src={product.images[0]?.path}
                        alt={product.images[0]?.alt || product.name}
                        categoryId={product.categoryId}
                        isPlaceholder={product.images[0]?.isPlaceholder}
                        className="h-56 w-full"
                      />
                    </Link>

                    <div className="space-y-2">
                      {/* Clean unboxed metadata line */}
                      <div className="flex items-center justify-between text-xs text-[#9AA3B8]">
                        <span className="uppercase tracking-wider font-semibold text-[#38BDF8]">
                          {product.brand} · {product.categoryId}
                        </span>
                        <span className="font-mono-tabular text-[#F5B93A]">
                          {product.warrantyMonths}m Warranty
                        </span>
                      </div>

                      <Link
                        to={`/product/${product.slug}`}
                        className="block font-display text-lg font-bold text-[#F4F6FB] group-hover:text-[#38BDF8] transition-colors"
                      >
                        {product.name}
                      </Link>

                      <p className="text-xs text-[#9AA3B8] line-clamp-2 leading-relaxed">
                        {product.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-5 border-t border-white/10 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="font-mono-tabular text-xl font-bold text-[#F4F6FB]">
                          {formatNgnFromKobo(product.priceKobo)}
                        </p>
                        <p className="text-[11px] text-[#9AA3B8] font-mono-tabular">
                          Incl. {formatNgnFromKobo(vatComponent)} VAT (7.5%)
                        </p>
                      </div>
                      <span className="text-xs text-[#9AA3B8] flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8]" />
                        <span>
                          {product.stockStatus === 'out'
                            ? 'Out of Stock'
                            : product.stockStatus === 'low'
                            ? `Only ${product.stockQty} left`
                            : `In Stock (${product.stockQty})`}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        disabled={product.stockQty <= 0}
                        onClick={() => addItem(product, 1, products)}
                      >
                        Add to Cart
                      </Button>
                      <Link
                        to={`/product/${product.slug}`}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#F4F6FB] hover:border-[#38BDF8] whitespace-nowrap shrink-0"
                      >
                        Full Specs
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
};
