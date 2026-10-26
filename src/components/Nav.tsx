import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAppData } from '../app/storeProvider';
import { useCartStore } from '../features/cart/cartStore';

export const Nav: React.FC = () => {
  const { siteSettings } = useAppData();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const whatsappNum = siteSettings.whatsappNumber || '2347061766728';
  const whatsappDisplay = siteSettings.whatsappDisplay || '0706 176 6728';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleAnchorNav = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <div className="nav-bar-row">
        <Link
          className="brand"
          to="/"
          onClick={() => {
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }}
        >
          <img
            src="/assets/aistudio/image_c7059637.png"
            alt="ILLAI-RHASAK Nig. Enterprises Logo"
            className="brand-logo"
          />
          <span className="brand-wordmark-full">
            {siteSettings.wordmark || 'ILLAI-RHASAK NIG. ENTERPRISES'}
          </span>
          <span className="brand-wordmark-short">ILLAI-RHASAK</span>
        </Link>

        <div className="navlinks">
          <a href="#categories" onClick={(e) => handleAnchorNav(e, '#categories')}>
            Categories
          </a>
          <a href="#storefront" onClick={(e) => handleAnchorNav(e, '#storefront')}>
            Shop
          </a>
          <a href="#servicing" onClick={(e) => handleAnchorNav(e, '#servicing')}>
            Servicing
          </a>
          <a href="#built-for" onClick={(e) => handleAnchorNav(e, '#built-for')}>
            Who we serve
          </a>
          <Link to="/shop" className={location.pathname === '/shop' ? 'active' : ''}>
            Full Catalogue
          </Link>
          <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
            Admin
          </Link>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open shopping cart (${totalQty} items)`}
            className="btn btn-ghost nav-cart-btn"
          >
            <span>Cart</span>
            <span style={{ color: 'var(--blue2)', fontWeight: 700 }}>({totalQty})</span>
          </button>

          <a
            className="btn btn-primary nav-wa-btn"
            href={`https://wa.me/${whatsappNum}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Speak to a Specialist: {whatsappDisplay}
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="region" aria-label="Mobile navigation">
          <div className="wrap mobile-nav-inner">
            <a href="#categories" onClick={(e) => handleAnchorNav(e, '#categories')}>
              Product Categories (New, UK Used, Copiers, UPS)
            </a>
            <a href="#storefront" onClick={(e) => handleAnchorNav(e, '#storefront')}>
              Live Storefront &amp; Consumables
            </a>
            <a href="#servicing" onClick={(e) => handleAnchorNav(e, '#servicing')}>
              General Servicing &amp; Maintenance
            </a>
            <a href="#built-for" onClick={(e) => handleAnchorNav(e, '#built-for')}>
              Who We Serve (Schools, Bulk &amp; Delivery)
            </a>
            <a href="#warranty" onClick={(e) => handleAnchorNav(e, '#warranty')}>
              Warranty &amp; Returns
            </a>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>
              Full Hardware Catalogue
            </Link>
            <Link to="/schools" onClick={() => setMobileMenuOpen(false)}>
              Schools &amp; ICT Labs
            </Link>
            <Link to="/bulk" onClick={() => setMobileMenuOpen(false)}>
              Bulk &amp; Corporate Supply
            </Link>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
              Admin Console
            </Link>
            <div className="pt-3 flex flex-col gap-2">
              <a
                className="btn btn-primary w-full"
                style={{ padding: '13px 18px', fontSize: '14px' }}
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Speak to a Specialist: {whatsappDisplay}
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
