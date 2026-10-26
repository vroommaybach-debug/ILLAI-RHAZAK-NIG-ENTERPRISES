import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../app/storeProvider';

export const Footer: React.FC = () => {
  const { siteSettings } = useAppData();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="flex justify-center mb-6">
          <img
            src="/assets/aistudio/image_c7059637.png"
            alt="ILLAI-RHASAK Nig. Enterprises Logo"
            className="h-16 w-16 rounded-2xl object-contain border border-white/10 bg-[#080c16] p-1.5 shadow-xl"
          />
        </div>
        <div className="f-mark">ILLAI-RHASAK</div>
        <div className="f-sub">
          Nig. Enterprises &middot; Laptops &middot; Desktops &middot; Printers &middot; Scanners
        </div>

        <div className="f-cols">
          <div>
            <h4>Visit</h4>
            <p>Ikeja, Lagos, Nigeria</p>
            <p>WhatsApp: {siteSettings.whatsappDisplay || '0904 645 3977'}</p>
            <a href={`mailto:${siteSettings.email || 'illairhasakng@gmail.com'}`}>
              {siteSettings.email || 'illairhasakng@gmail.com'}
            </a>
          </div>

          <div>
            <h4>Shop</h4>
            <Link to="/shop?category=laptops">Laptops</Link>
            <Link to="/shop?category=desktops">Desktops</Link>
            <Link to="/shop?category=printers">Printers</Link>
            <Link to="/shop?category=scanners">Scanners</Link>
            <Link to="/cart">Shopping Cart</Link>
          </div>

          <div>
            <h4>Serve</h4>
            <Link to="/schools">Schools</Link>
            <Link to="/bulk">Bulk &amp; corporate</Link>
            <Link to="/delivery">Delivery</Link>
            <Link to="/international">International</Link>
            <Link to="/admin">Admin Portal</Link>
          </div>

          <div>
            <h4>Policies</h4>
            <Link to="/policies/privacy">Privacy</Link>
            <Link to="/policies/terms">Terms</Link>
            <Link to="/policies/returns">Returns</Link>
            <Link to="/policies/warranty">Warranty</Link>
            <Link to="/policies/shipping">Shipping</Link>
            <Link to="/policies/cookies">Cookies</Link>
          </div>
        </div>

        <div className="f-bottom">
          <span>&copy; 2026 ILLAI-RHASAK Nig. Enterprises. All rights reserved.</span>
          <span className="june">
            Imagined by <b>June Studio</b>
          </span>
        </div>
      </div>
    </footer>
  );
};
