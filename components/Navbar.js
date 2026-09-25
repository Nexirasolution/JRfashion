'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Menu, X, ChevronDown, ClipboardList, Heart } from 'lucide-react';
import { useCart } from './CartContext';
import { useWishlist } from './WhishlistContext';
import CouponMarquee from './CouponMarquee';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

// Gold text is hard to read on white, so hover/active states use a gold
// underline instead of a gold text color.
function underlineOn(el) {
  el.style.textDecoration = 'underline';
  el.style.textDecorationColor = GOLD;
  el.style.textUnderlineOffset = '4px';
}
function underlineOff(el) {
  el.style.textDecoration = 'none';
}

export default function Navbar() {
  // Main categories only, each carrying its own `subcategories` array
  // (as returned by /api/categories' `topLevel` field), so the Shop menu
  // can nest subcategories under their parent instead of listing every
  // category flat.
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(null); // category id of the expanded subcategory list

  const closeTimer = useRef(null);

  const router = useRouter();
  const { count } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist?.length || 0;

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.topLevel || []))
      .catch(() => {});
  }, []);

  // Lock background scroll while the full-screen mobile menu is open,
  // so the homepage doesn't scroll/run underneath it.
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [menuOpen]);

  function onSearch(e) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  function openShop() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
  }
  function scheduleCloseShop() {
    closeTimer.current = setTimeout(() => setShopOpen(false), 150);
  }

  function categoryHref(slug) {
    return `/category/${slug}`;
  }

  function closeMobileMenu() {
    setMenuOpen(false);
    setMobileShopOpen(false);
    setMobileCatOpen(null);
  }

  return (
    <>
      <CouponMarquee />

      <header className="sticky top-0 z-50" style={{ background: PAPER, borderBottom: `1px solid ${LINE}` }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-3 items-center">
            {/* Left: mobile toggle + primary links */}
            <div className="flex items-center gap-1 justify-self-start">
              <button
                className="md:hidden p-1.5 -ml-1 sm:p-2 sm:-ml-2"
                style={{ color: INK }}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                {menuOpen ? <X size={18} strokeWidth={1.5} className="sm:w-5 sm:h-5" /> : <Menu size={18} strokeWidth={1.5} className="sm:w-5 sm:h-5" />}
              </button>

              <nav className="hidden md:flex items-center gap-8">
                <Link
                  href="/"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                >
                  Home
                </Link>

                <div className="relative" onMouseEnter={openShop} onMouseLeave={scheduleCloseShop}>
                  <button
                    className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                    style={{
                      color: INK,
                      textDecoration: shopOpen ? 'underline' : 'none',
                      textDecorationColor: GOLD,
                      textDecorationThickness: '2px',
                      textUnderlineOffset: '6px',
                    }}
                  >
                    Shop
                  </button>

                  {shopOpen && categories.length > 0 && (
                    <div className="absolute left-0 top-full pt-5" style={{ width: '560px' }}>
                      <div
                        style={{ background: PAPER, borderTop: `1px solid ${GOLD}` }}
                        className="py-6 px-6 max-h-[70vh] overflow-y-auto"
                      >
                        <div className="[column-count:3] gap-8">
                          {categories.map((c) => (
                            <div key={c._id} className="break-inside-avoid mb-6">
                              <Link
                                href={categoryHref(c.slug)}
                                onClick={() => setShopOpen(false)}
                                className="py-0.5 text-[13px] font-semibold tracking-wide transition-colors block w-fit"
                                style={{ color: INK }}
                                onMouseEnter={(e) => underlineOn(e.currentTarget)}
                                onMouseLeave={(e) => underlineOff(e.currentTarget)}
                              >
                                {c.name}
                              </Link>

                              {c.subcategories?.length > 0 && (
                                <div className="flex flex-col mt-1.5 pl-3" style={{ borderLeft: `1px solid ${LINE}` }}>
                                  {c.subcategories.map((sub) => (
                                    <Link
                                      key={sub._id}
                                      href={categoryHref(sub.slug)}
                                      onClick={() => setShopOpen(false)}
                                      className="py-1 text-[12px] tracking-wide transition-colors"
                                      style={{ color: INK_SOFT }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = INK_SOFT)}
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/orders"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                >
                  Orders
                </Link>
              </nav>
            </div>

            {/* Center: logo (scales down on small screens) */}
            <Link href="/" className="flex items-center justify-self-center">
              <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24">
                <Image src="/logo.png" alt="Tirupur Clothing Hub" fill className="object-contain" priority />
              </div>
            </Link>

            {/* Right: wishlist + search + cart */}
            <div className="flex items-center gap-1 sm:gap-2.5 justify-self-end">
              <Link
                href="/wishlist"
                className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors"
                style={{ color: INK, border: `1px solid ${LINE}` }}
                aria-label="Wishlist"
              >
                <Heart size={14} strokeWidth={1.5} className="sm:w-4 sm:h-4" />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-[8px] sm:text-[9px] font-semibold rounded-full w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] flex items-center justify-center"
                    style={{ background: GOLD, color: INK }}
                  >
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <button
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors"
                style={{ color: INK, border: `1px solid ${LINE}` }}
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <Search size={14} strokeWidth={1.5} className="sm:w-4 sm:h-4" />
              </button>

              <Link
                href="/cart"
                className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors"
                style={{ color: INK, border: `1px solid ${LINE}` }}
                aria-label="Cart"
              >
                <ShoppingBag size={14} strokeWidth={1.5} className="sm:w-4 sm:h-4" />
                {count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-[8px] sm:text-[9px] font-semibold rounded-full w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] flex items-center justify-center"
                    style={{ background: GOLD, color: INK }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {searchOpen && (
            <form
              onSubmit={onSearch}
              className="flex items-center gap-2 py-3 mb-1"
              style={{ borderTop: `1px solid ${LINE}` }}
            >
              <Search size={15} strokeWidth={1.5} style={{ color: INK_SOFT }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kurtis, nighties, innerwear..."
                className="bg-transparent outline-none w-full text-sm"
                style={{ color: INK }}
              />
            </form>
          )}
        </div>
      </header>

      {/* Mobile menu — full-screen overlay, not inline, so the homepage
          doesn't sit (or scroll) behind it while open. */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col"
          style={{ background: PAPER }}
        >
          {/* Overlay header: logo + close button */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{ borderBottom: `1px solid ${LINE}` }}
          >
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="Tirupur Clothing Hub" fill className="object-contain" />
            </div>
            <button
              className="p-2 -mr-2"
              style={{ color: INK }}
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* Scrollable menu body — only this area scrolls, page behind stays fixed */}
          <nav className="flex-1 overflow-y-auto flex flex-col px-6 py-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              Home
            </Link>

            <div style={{ borderBottom: `1px solid ${LINE}` }}>
              <button
                className="w-full flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
                style={{ color: INK }}
                onClick={() => setMobileShopOpen((v) => !v)}
              >
                Shop
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  style={{
                    transform: mobileShopOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              </button>

              {mobileShopOpen && (
                <div className="flex flex-col pb-3">
                  {categories.map((c) => {
                    const hasSubs = c.subcategories?.length > 0;
                    const isCatOpen = mobileCatOpen === c._id;
                    return (
                      <div key={c._id} className="flex flex-col">
                        <div className="flex items-center">
                          <Link
                            href={categoryHref(c.slug)}
                            onClick={closeMobileMenu}
                            className="flex-1 py-2.5 pl-3 text-[13px] tracking-wide"
                            style={{ color: INK_SOFT }}
                          >
                            {c.name}
                          </Link>
                          {hasSubs && (
                            <button
                              onClick={() => setMobileCatOpen((v) => (v === c._id ? null : c._id))}
                              className="px-3 py-2.5"
                              aria-label={`Toggle ${c.name} subcategories`}
                            >
                              <ChevronDown
                                size={12}
                                strokeWidth={1.5}
                                style={{
                                  color: INK_SOFT,
                                  transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 150ms ease',
                                }}
                              />
                            </button>
                          )}
                        </div>

                        {hasSubs && isCatOpen && (
                          <div className="flex flex-col pb-1.5">
                            {c.subcategories.map((sub) => (
                              <Link
                                key={sub._id}
                                href={categoryHref(sub.slug)}
                                onClick={closeMobileMenu}
                                className="py-2 pl-7 text-[12.5px] tracking-wide"
                                style={{ color: INK_SOFT }}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/orders"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <ClipboardList size={16} strokeWidth={1.5} />
                Orders
              </span>
            </Link>

            <Link
              href="/wishlist"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <Heart size={16} strokeWidth={1.5} />
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span
                  className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ background: GOLD, color: INK }}
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag size={16} strokeWidth={1.5} />
                Cart
              </span>
              {count > 0 && (
                <span
                  className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ background: GOLD, color: INK }}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}