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
      <div className="wrap">
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
          <span className="brand-wordmark">
            {siteSettings.wordmark || 'ILLAI-RHASAK NIG. ENTERPRISES'}
          </span>
        </Link>

        <div className="navlinks">
          <a href="#categories" onClick={(e) => handleAnchorNav(e, '#categories')}>
            Shop
          </a>
          <a href="#built-for" onClick={(e) => handleAnchorNav(e, '#built-for')}>
            Who we serve
          </a>
          <a href="#spec" onClick={(e) => handleAnchorNav(e, '#spec')}>
            Spec card
          </a>
          <a href="#warranty" onClick={(e) => handleAnchorNav(e, '#warranty')}>
            Warranty
          </a>
          <a href="#delivery" onClick={(e) => handleAnchorNav(e, '#delivery')}>
            Delivery
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
            href={`https://wa.me/${siteSettings.whatsappNumber || '2349046453977'}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp us
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
              Shop Categories
            </a>
            <a href="#built-for" onClick={(e) => handleAnchorNav(e, '#built-for')}>
              Who we serve
            </a>
            <a href="#spec" onClick={(e) => handleAnchorNav(e, '#spec')}>
              Spec card
            </a>
            <a href="#warranty" onClick={(e) => handleAnchorNav(e, '#warranty')}>
              Warranty
            </a>
            <a href="#delivery" onClick={(e) => handleAnchorNav(e, '#delivery')}>
              Delivery
            </a>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>
              Full Catalogue
            </Link>
            <Link to="/schools" onClick={() => setMobileMenuOpen(false)}>
              Schools &amp; Education
            </Link>
            <Link to="/bulk" onClick={() => setMobileMenuOpen(false)}>
              Bulk &amp; Corporate
            </Link>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
              Admin
            </Link>
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
              <a
                className="btn btn-primary w-full"
                style={{ padding: '12px 18px', fontSize: '14px' }}
                href={`https://wa.me/${siteSettings.whatsappNumber || '2349046453977'}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp ({siteSettings.whatsappDisplay || '0904 645 3977'})
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
