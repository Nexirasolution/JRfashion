import { MapPin } from 'lucide-react';
import { Fraunces, Inter } from 'next/font/google';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import FooterLinks from './FooterLinks';

const display = Fraunces({ subsets: ['latin'], weight: ['400'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-body' });

// Black / white / gold palette — white footer with a gold top rule and black text.
const PAPER = '#FFFFFF';
const GOLD = '#C9A227';
const INK = '#000000';
const INK_SOFT = 'rgba(0,0,0,0.65)';
const LINE = 'rgba(0,0,0,0.12)';

async function getCategories() {
  await dbConnect();
  const categories = await Category.find({}).select('name slug').lean();
  return JSON.parse(JSON.stringify(categories));
}

export default async function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '919344430878';
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM ||
    'https://www.instagram.com/tirupur_clothing_hub?utm_source=qr&igsi=ZTk1em9obGZtajMx';
  const categories = await getCategories();

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <footer
      className={`${body.className} mt-16`}
      style={{ background: PAPER, borderTop: `1px solid ${GOLD}` }}
    >
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-12 gap-10 sm:gap-8">

        {/* Brand column */}
        <div className="sm:col-span-4">
          <h3 className={`${display.className} text-2xl leading-tight`} style={{ color: INK, fontWeight: 400 }}>
            Tirupur Clothing Hub
          </h3>
          <p className="text-[11px] font-medium tracking-wide mb-4" style={{ color: INK }}>
            Wholesale &amp; Retail
          </p>

          <p className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: INK_SOFT }}>
            <MapPin size={13} className="shrink-0 mt-0.5" style={{ color: GOLD }} />
            63/29 Nesavalar Colony 2nd Street, P.N Road,<br />
            Near New Bus Stand, Tiruppur 641602
          </p>

          <p className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-normal tracking-wide" style={{ color: INK_SOFT }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
            Online sales only
          </p>
        </div>

        {/* Shop / Quick Links / Connect — accordion on mobile, columns on desktop */}
        <FooterLinks categories={categories} quickLinks={quickLinks} whatsapp={whatsapp} instagram={instagram} />
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: `1px solid ${LINE}` }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px]" style={{ color: INK_SOFT }}>
            © {new Date().getFullYear()} Tirupur Clothing Hub. All rights reserved.
          </p>

          <a
            href="https://www.nexirasolution.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] transition-opacity hover:opacity-75"
            style={{ color: INK_SOFT }}
          >
            Designed and developed by
            <span className="font-medium text-[11px] tracking-wide" style={{ color: INK }}>
              Nexira Solution
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}