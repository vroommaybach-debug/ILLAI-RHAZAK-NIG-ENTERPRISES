import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../app/storeProvider';

export const Footer: React.FC = () => {
  const { siteSettings } = useAppData();
  const whatsappDisplay = siteSettings.whatsappDisplay || '0706 176 6728';
  const whatsappNum = siteSettings.whatsappNumber || '2347061766728';

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
          Nig. Enterprises &middot; Brand-New &amp; UK Used Laptops &middot; Desktops &middot; Printers &middot; Photocopiers &middot; Scanners &middot; UPS &middot; Consumables &middot; General Servicing
        </div>

        <div className="f-cols">
          <div>
            <h4>Showroom &amp; Servicing</h4>
            <p>Computer Village, Ikeja, Lagos, Nigeria</p>
            <a
              href={`https://wa.me/${whatsappNum}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Speak to a Specialist: {whatsappDisplay}
            </a>
            <a href={`mailto:${siteSettings.email || 'illairhasakng@gmail.com'}`}>
              {siteSettings.email || 'illairhasakng@gmail.com'}
            </a>
          </div>

          <div>
            <h4>Shop Hardware</h4>
            <Link to="/shop?category=laptops">Brand-New Laptops</Link>
            <Link to="/shop?category=uk-used">UK Used Laptops</Link>
            <Link to="/shop?category=desktops">Desktops</Link>
            <Link to="/shop?category=printers">Printers</Link>
            <Link to="/shop?category=photocopiers">Photocopier Machines</Link>
            <Link to="/shop?category=scanners">Scanners</Link>
            <Link to="/shop?category=ups">UPS &amp; Power Backup</Link>
            <Link to="/shop?category=consumables">Consumables &amp; Extras</Link>
          </div>

          <div>
            <h4>Serve &amp; Support</h4>
            <a href="/#servicing">General Servicing &amp; Repairs</a>
            <Link to="/schools">Schools &amp; ICT Labs</Link>
            <Link to="/bulk">Bulk &amp; Corporate</Link>
            <Link to="/delivery">Lagos &amp; Nationwide Delivery</Link>
            <Link to="/international">International Export</Link>
            <Link to="/admin">Admin Console</Link>
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
          <span>&copy; 2026 ILLAI-RHASAK Nig. Enterprises · Computer Village, Ikeja, Lagos. All rights reserved.</span>
          <span className="june">
            Imagined by <b>June Studio</b>
          </span>
        </div>
      </div>
    </footer>
  );
};
