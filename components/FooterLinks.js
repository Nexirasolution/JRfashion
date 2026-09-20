'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instagram, ChevronDown } from 'lucide-react';

const GOLD = '#C9A227';
const INK = '#000000';
const INK_SOFT = 'rgba(0,0,0,0.65)';
const LINE = 'rgba(0,0,0,0.12)';

// Actual WhatsApp glyph (brand mark) — lucide's MessageCircle is a generic
// chat bubble, not the real logo, so this is an inline SVG instead.
function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.943c0 2.105.549 4.16 1.595 5.974L0 24l6.223-1.633a11.9 11.9 0 005.822 1.485h.005c6.582 0 11.94-5.36 11.943-11.943a11.87 11.87 0 00-3.473-8.46" />
    </svg>
  );
}

function AccordionSection({ id, title, openSection, onToggle, children }) {
  const isOpen = openSection === id;
  return (
    <div className="border-b sm:border-0" style={{ borderColor: LINE }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between py-3.5 sm:py-0 sm:mb-4 sm:pointer-events-none sm:cursor-default"
      >
        <span className="font-medium text-[11px] tracking-wide uppercase" style={{ color: INK_SOFT }}>
          {title}
        </span>
        <ChevronDown
          size={14}
          className="sm:hidden transition-transform duration-200"
          style={{ color: INK_SOFT, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} sm:!block pb-4 sm:pb-0`}>
        {children}
      </div>
    </div>
  );
}

export default function FooterLinks({ categories, quickLinks, whatsapp, instagram }) {
  const [openSection, setOpenSection] = useState(null);
  const toggle = (id) => setOpenSection((prev) => (prev === id ? null : id));

  return (
    <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-8 gap-0 sm:gap-8">
      {/* Shop links */}
      <div className="sm:col-span-2">
        <AccordionSection id="shop" title="Shop" openSection={openSection} onToggle={toggle}>
          <ul className="space-y-2.5">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`} className="text-[13px] transition-colors" style={{ color: INK }}>
                  <span className="hover:opacity-70 transition-opacity">{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </AccordionSection>
      </div>

      {/* Quick links */}
      <div className="sm:col-span-3">
        <AccordionSection id="quicklinks" title="Quick Links" openSection={openSection} onToggle={toggle}>
          <ul className="space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[13px] transition-colors" style={{ color: INK }}>
                  <span className="hover:opacity-70 transition-opacity">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </AccordionSection>
      </div>

      {/* Connect */}
      <div className="sm:col-span-3">
        <AccordionSection id="connect" title="Connect" openSection={openSection} onToggle={toggle}>
          <div className="flex gap-2 mb-5">
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-75"
              style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: INK }}
            >
              <WhatsAppIcon size={16} />
            </a>

            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-75"
              style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: INK }}
            >
              <Instagram size={16} strokeWidth={1.75} />
            </a>
          </div>

          <div className="text-xs space-y-3 leading-relaxed" style={{ color: INK_SOFT }}>
            <p>
              <span className="font-semibold" style={{ color: INK }}>WhatsApp</span><br />
              +91 93444 30878
            </p>
            <p>
              <span className="font-semibold" style={{ color: INK }}>Email</span><br />
              jrfashiontirupur7@gmail.com
            </p>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}