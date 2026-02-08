import React, { memo } from 'react';
import { useApp } from '../context/AppContext';

const Footer = memo(function Footer() {
  const { t } = useApp();

  const links = [
    { key: 'companyInfo', href: '#' },
    { key: 'customerCenter', href: '#' },
    { key: 'terms', href: '#' },
    { key: 'privacy', href: '#' },
    { key: 'youthProtection', href: '#' },
  ];

  return (
    <footer className="bg-[rgba(20,18,15,0.95)] border-t border-coral/10 py-12 px-8 mt-16">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between flex-wrap gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-display text-coral mb-4">{t.companyName}</h3>
            {(t.ceo || t.phone) && (
              <p className="my-1 text-sm text-cream/60">
                {[t.ceo, t.phone].filter(Boolean).join(' | ')}
              </p>
            )}
            {t.businessNumber && <p className="my-1 text-sm text-cream/60">{t.businessNumber}</p>}
            {t.address && <p className="my-1 text-sm text-cream/60">{t.address}</p>}
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm flex-wrap">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="text-cream/70 no-underline hover:text-coral transition-colors"
              >
                {t[link.key]}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-coral/10 text-center text-cream/40 text-sm">
          {t.copyright}
        </div>
      </div>
    </footer>
  );
});

export default Footer;
