/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppDataProvider } from './app/storeProvider';
import { Footer } from './components/Footer';
import { Nav } from './components/Nav';
import { GrainOverlay } from './components/ui';
import { AdminPage } from './features/admin/AdminPage';
import { CartDrawer } from './features/cart/CartDrawer';
import { CartPage } from './features/cart/CartPage';
import { ShopPage } from './features/catalog/ShopPage';
import { CheckoutPage } from './features/checkout/CheckoutPage';
import { OrderReceiptPage } from './features/checkout/OrderReceiptPage';
import { HomePage } from './features/home/HomePage';
import { PolicyPage } from './features/policies/PolicyPage';
import { ProductPage } from './features/product/ProductPage';
import { SegmentPage } from './features/segments/SegmentPage';
import { StyleguidePage } from './features/styleguide/StyleguidePage';

const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
};

const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-ink)] text-[var(--color-text)] selection:bg-[#2563FF] selection:text-white">
      <GrainOverlay />
      <Nav />
      <CartDrawer />
      <main className={`flex-1 ${isHome ? '' : 'pt-20 sm:pt-24'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:ref" element={<OrderReceiptPage />} />
          <Route path="/schools" element={<SegmentPage segmentId="schools" />} />
          <Route path="/bulk" element={<SegmentPage segmentId="bulk" />} />
          <Route path="/delivery" element={<SegmentPage segmentId="delivery" />} />
          <Route
            path="/international"
            element={<SegmentPage segmentId="international" />}
          />
          <Route path="/policies/:slug" element={<PolicyPage />} />
          <Route path="/styleguide" element={<StyleguidePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/cms" element={<AdminPage forceCmsRoute />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <ScrollToTop />
        <MainLayout />
      </BrowserRouter>
    </AppDataProvider>
  );
}
