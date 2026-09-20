'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fraunces, Inter } from 'next/font/google';
import { Star, ShoppingBag, Zap, Heart, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { getSizeStock, getCombinedStock } from '@/lib/stock';
import { useCart } from '@/components/CartContext';
import ColorSizeSelector from '@/components/ColorSizeSelector';
import ProductCard from '@/components/ProductCard';
import toast from 'react-hot-toast';

// Typography — a deliberate pairing instead of system defaults: Fraunces
// for anything read as a headline, Inter for everything functional/UI.
const display = Fraunces({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

// Design tokens — white, black and gold. Black carries text and primary
// actions, gold is the single accent, and one hairline tone separates
// sections. No pills or drop shadows.
const PAPER = '#FFFFFF';
const BLACK = '#000000';
const GREY = '#5E5E5E';          // secondary text on white
const NEUTRAL = '#8A8A8A';       // struck-through prices, verified label
const LINE = '#E7E2D6';          // hairlines
const GOLD = '#C9A24B';          // stars, underlines, decorative accents
const GOLD_DEEP = '#8C6A12';     // gold text on white (readable contrast)
const GOLD_BRIGHT = '#E0BC5F';   // gold on black
const GOLD_LIGHT = '#FBF6E9';    // very light gold surface (image wells)

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeSize, setActiveSize] = useState('');
  const [activeSleeve, setActiveSleeve] = useState('');
  const [activeZip, setActiveZip] = useState('');
  const [activePantId, setActivePantId] = useState('');
  const [activeShawlId, setActiveShawlId] = useState('');
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Size chart carousel modal
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [sizeChartIndex, setSizeChartIndex] = useState(0);

  const { addItem } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setActiveVariant(d.product?.variants?.[0]);
      });
  }, [slug]);

  if (!data?.product) {
    return (
      <div className={`${body.className} min-h-screen flex items-center justify-center`} style={{ background: PAPER }}>
        <div className="flex flex-col items-center gap-3" style={{ color: GREY }}>
          <div className="w-6 h-6 border rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: GOLD }} />
          <p className="text-sm">Loading product…</p>
        </div>
      </div>
    );
  }

  const { product, reviews, related } = data;
  const images = activeVariant?.images || [];
  const discount = activeVariant?.compareAtPrice > activeVariant?.price
    ? Math.round(((activeVariant.compareAtPrice - activeVariant.price) / activeVariant.compareAtPrice) * 100)
    : 0;

  // Product's own size chart images win; otherwise fall back to the
  // category's. Requires GET /api/products/[slug] to populate
  // category with `sizeChart`.
  const sizeChartImages = product.sizeChart?.length ? product.sizeChart : (product.category?.sizeChart || []);

  const selectedSizeStock = getSizeStock(activeVariant, activeSize);
  const sizeOutOfStock = !!activeSize && selectedSizeStock <= 0;

  // Pant/shawl selections and the combined, add-on-inclusive unit price.
  const selectedPant = product.pantOptions?.find((p) => p._id === activePantId) || null;
  const selectedShawl = product.shawlOptions?.find((s) => s._id === activeShawlId) || null;
  const addonTotal = (selectedPant?.price || 0) + (selectedShawl?.price || 0);
  const unitPrice = (activeVariant?.price || 0) + addonTotal;
  const unitCompareAtPrice = activeVariant?.compareAtPrice > activeVariant?.price
    ? activeVariant.compareAtPrice + addonTotal
    : 0;

  function stockCap() {
    return getCombinedStock(activeVariant, activeSize, {
      pantOptions: product.pantOptions,
      pantOptionId: activePantId,
      shawlOptions: product.shawlOptions,
      shawlOptionId: activeShawlId,
    });
  }

  function prevImage() { setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1)); }
  function nextImage() { setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1)); }

  function prevSizeChart() { setSizeChartIndex((i) => (i === 0 ? sizeChartImages.length - 1 : i - 1)); }
  function nextSizeChart() { setSizeChartIndex((i) => (i === sizeChartImages.length - 1 ? 0 : i + 1)); }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  }

  function handleColorChange(v) {
    setActiveVariant(v);
    setActiveImage(0);
    setActiveSize('');
    setQty(1);
  }

  function handleSizeChange(size) {
    setActiveSize(size);
    const stock = getCombinedStock(activeVariant, size, {
      pantOptions: product.pantOptions,
      pantOptionId: activePantId,
      shawlOptions: product.shawlOptions,
      shawlOptionId: activeShawlId,
    });
    setQty((q) => (stock > 0 && stock !== Infinity ? Math.min(q, stock) : 1));
  }

  function handlePantChange(id) {
    setActivePantId(id);
    const stock = getCombinedStock(activeVariant, activeSize, {
      pantOptions: product.pantOptions,
      pantOptionId: id,
      shawlOptions: product.shawlOptions,
      shawlOptionId: activeShawlId,
    });
    if (stock !== Infinity) setQty((q) => Math.min(q, Math.max(stock, 1)));
  }

  function handleShawlChange(id) {
    setActiveShawlId(id);
    const stock = getCombinedStock(activeVariant, activeSize, {
      pantOptions: product.pantOptions,
      pantOptionId: activePantId,
      shawlOptions: product.shawlOptions,
      shawlOptionId: id,
    });
    if (stock !== Infinity) setQty((q) => Math.min(q, Math.max(stock, 1)));
  }

  function buildCartPayload() {
    const stock = stockCap();
    return {
      productId: product._id,
      variantId: activeVariant._id,
      comboId: null,
      name: product.name,
      image: activeVariant.images?.[0],
      color: activeVariant.color,
      size: activeSize,
      sleeveType: activeSleeve,
      zipType: activeZip,
      pantOption: selectedPant
        ? { id: selectedPant._id, name: selectedPant.name, price: selectedPant.price, image: selectedPant.image, sku: selectedPant.sku }
        : null,
      shawlOption: selectedShawl
        ? { id: selectedShawl._id, name: selectedShawl.name, price: selectedShawl.price, image: selectedShawl.image, sku: selectedShawl.sku }
        : null,
      price: unitPrice,
      qty,
      stock,
    };
  }

  function handleAddToCart() {
    if (!activeSize) { toast.error('Please select a size'); return; }
    if (product.sleeveOptions?.length && !activeSleeve) { toast.error('Please select a sleeve type'); return; }
    if (product.zipOptions?.length && !activeZip) { toast.error('Please select a zip type'); return; }
    const stock = stockCap();
    if (stock <= 0) { toast.error('This combination is out of stock'); return; }
    if (qty > stock) {
      toast.error(`Only ${stock} left in stock`);
      setQty(stock);
      return;
    }

    addItem(buildCartPayload());
  }

  function handleBuyNow() {
    if (!activeSize) { toast.error('Please select a size'); return; }
    if (product.sleeveOptions?.length && !activeSleeve) { toast.error('Please select a sleeve type'); return; }
    if (product.zipOptions?.length && !activeZip) { toast.error('Please select a zip type'); return; }
    const stock = stockCap();
    if (stock <= 0) { toast.error('This combination is out of stock'); return; }
    if (qty > stock) {
      toast.error(`Only ${stock} left in stock`);
      setQty(stock);
      return;
    }

    addItem(buildCartPayload());
    router.push('/checkout');
  }

  return (
    <div className={`${body.className} ${display.variable}`} style={{ background: PAPER }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-4 sm:pt-16 pb-24 sm:pb-20">

        {/* Even two-column split, generous gap, no sticky spine or gallery
            chrome — the image and the details carry equal quiet weight. */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-16">

          {/* ── Gallery ── */}
          <div className="sm:sticky sm:top-10 sm:self-start">
            {/* Mobile: fixed viewport-relative height so the fold clears the
                gallery quickly. Desktop: original aspect-ratio box. */}
            <div className="relative w-full h-[38vh] sm:h-auto sm:aspect-[4/5] overflow-hidden" style={{ background: GOLD_LIGHT, borderRadius: '4px' }}>
              {images[activeImage] && (
                <Image
                  src={images[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width:640px) 100vw, 48vw"
                  className="object-cover"
                  priority
                />
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} strokeWidth={1.5} style={{ color: BLACK }} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} strokeWidth={1.5} style={{ color: BLACK }} />
                  </button>

                  {/* Plain numeric counter instead of dots or a pill */}
                  <div
                    className="absolute bottom-3 right-3 text-[11px] font-medium tracking-wide"
                    style={{ color: BLACK }}
                  >
                    {String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails — hidden on mobile to save above-the-fold space;
                a thin gold underline marks the active one on desktop instead
                of a ring/shadow */}
            {images.length > 1 && (
              <div className="hidden sm:flex gap-3 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="relative w-12 h-[60px] overflow-hidden shrink-0 transition-opacity"
                    style={{
                      opacity: i === activeImage ? 1 : 0.45,
                      borderRadius: '3px',
                      boxShadow: i === activeImage ? `inset 0 -2px 0 ${GOLD}` : 'none',
                    }}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Wishlist / share — hidden on mobile (sticky bar covers the
                key actions there); a plain text row under the image on
                desktop, not floating chrome on top of it */}
            <div className="hidden sm:flex items-center gap-5 mt-4">
              <button
                onClick={() => { setWished((w) => !w); toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist'); }}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: wished ? GOLD_DEEP : GREY }}
              >
                <Heart size={14} strokeWidth={1.5} fill={wished ? GOLD : 'none'} style={{ color: wished ? GOLD : undefined }} />
                {wished ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: GREY }}>
                <Share2 size={14} strokeWidth={1.5} />
                Share
              </button>
            </div>
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col">
            {product.category?.name && (
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-1.5 sm:mb-2" style={{ color: GOLD_DEEP }}>
                {product.category.name}
              </p>
            )}

            <h1
              className={`${display.className} text-[20px] sm:text-[32px] leading-[1.15]`}
              style={{ color: BLACK, fontWeight: 400, letterSpacing: '-0.01em' }}
            >
              {product.name}
            </h1>

            {/* Ready to Ship badge — highlighted, sits just under the title */}
            {product.isReadyToShip && (
              <span
                className="inline-block mt-2 sm:mt-2.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide w-fit"
                style={{ background: BLACK, color: GOLD_BRIGHT, borderRadius: '4px' }}
              >
                Ready to Ship
              </span>
            )}

            <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2.5 text-sm" style={{ color: GREY }}>
              <Star size={13} strokeWidth={1.5} style={{ fill: GOLD, color: GOLD }} />
              <span style={{ color: BLACK }}>{product.rating?.toFixed?.(1) ?? product.rating}</span>
              <span>· {product.reviewCount} reviews</span>
            </div>

            {/* Price now reflects the base variant price PLUS whichever
                pant/shawl add-ons are currently selected, so it updates
                live as the customer changes those selectors below. */}
            <div className="flex items-baseline gap-3 mt-3 sm:mt-6">
              <span className={`${display.className} text-[22px] sm:text-[26px]`} style={{ color: BLACK, fontWeight: 500 }}>
                {formatINR(unitPrice)}
              </span>
              {unitCompareAtPrice > unitPrice && (
                <span className="line-through text-sm" style={{ color: NEUTRAL }}>
                  {formatINR(unitCompareAtPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-medium" style={{ color: GOLD_DEEP }}>
                  {discount}% off
                </span>
              )}
            </div>
            {addonTotal > 0 && (
              <p className="text-xs mt-1" style={{ color: GREY }}>
                Includes {formatINR(addonTotal)} for selected add-ons
              </p>
            )}

            {/* Fabric line — hidden on mobile above-the-fold view, still
                shown on desktop where vertical space isn't at a premium */}
            {product.fabric && (
              <p className="hidden sm:block text-sm mt-3" style={{ color: GREY }}>
                Fabric <span style={{ color: BLACK }}>— {product.fabric}</span>
              </p>
            )}

            <div className="mt-4 pt-4 sm:mt-8 sm:pt-8" style={{ borderTop: `1px solid ${GOLD}` }}>
              <ColorSizeSelector
                variants={product.variants}
                activeVariant={activeVariant}
                onColorChange={handleColorChange}
                activeSize={activeSize}
                onSizeChange={handleSizeChange}
                categoryType={product.category?.type}
                sizeChartImages={sizeChartImages}
                onViewSizeChart={() => { setSizeChartIndex(0); setSizeChartOpen(true); }}
                sleeveOptions={product.sleeveOptions}
                zipOptions={product.zipOptions}
                activeSleeve={activeSleeve}
                onSleeveChange={setActiveSleeve}
                activeZip={activeZip}
                onZipChange={setActiveZip}
                pantOptions={product.pantOptions}
                activePantId={activePantId}
                onPantChange={handlePantChange}
                shawlOptions={product.shawlOptions}
                activeShawlId={activeShawlId}
                onShawlChange={handleShawlChange}
                formatINR={formatINR}
              />
            </div>

            <div className="flex items-center gap-4 mt-4 sm:mt-6">
              <p className="text-sm" style={{ color: GREY }}>Qty</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="text-base leading-none"
                  style={{ color: BLACK }}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-sm font-medium w-4 text-center" style={{ color: BLACK }}>{qty}</span>
                <button
                  onClick={() => setQty((q) => {
                    const cap = stockCap();
                    return cap > 0 && cap !== Infinity ? Math.min(cap, q + 1) : q + 1;
                  })}
                  disabled={(() => { const cap = stockCap(); return !!activeSize && cap !== Infinity && qty >= cap; })()}
                  className="text-base leading-none disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: BLACK }}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {(() => {
                const cap = stockCap();
                return !!activeSize && cap !== Infinity && cap > 0 && cap <= 5 && (
                  <span className="text-xs font-medium" style={{ color: GOLD_DEEP }}>Only {cap} left</span>
                );
              })()}
              {sizeOutOfStock && (
                <span className="text-xs" style={{ color: GREY }}>Out of stock</span>
              )}
            </div>

            {/* CTAs — hidden on mobile in favor of the sticky bar below */}
            <div className="hidden sm:flex flex-col gap-2.5 mt-8">
              <button
                onClick={handleBuyNow}
                disabled={sizeOutOfStock}
                className="w-full flex items-center justify-center gap-2 font-medium py-3.5 transition-opacity active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: BLACK, color: GOLD_BRIGHT, border: `1px solid ${BLACK}`, borderRadius: '4px' }}
              >
                <Zap size={16} fill={GOLD_BRIGHT} /> {sizeOutOfStock ? 'Out of Stock' : 'Buy Now'}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={sizeOutOfStock}
                className="w-full flex items-center justify-center gap-2 font-medium py-3.5 transition-opacity active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: `1px solid ${BLACK}`, color: BLACK, background: PAPER, borderRadius: '4px' }}
              >
                <ShoppingBag size={15} /> {sizeOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {product.description && (
              <div className="mt-6 pt-6 sm:mt-8 sm:pt-8 text-sm leading-relaxed" style={{ color: GREY, borderTop: `1px solid ${LINE}` }}>
                <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] mb-3" style={{ color: BLACK }}>
                  Description
                </h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className="h-4 sm:h-0" />
          </div>
        </div>

        {/* Reviews */}
        {reviews?.length > 0 && (
          <div className="mt-20 sm:mt-28">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] mb-8 pb-3" style={{ color: BLACK, borderBottom: `1px solid ${GOLD}` }}>
              Customer Reviews
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
              {reviews.map((r) => (
                <div key={r._id} className="pt-5" style={{ borderTop: `1px solid ${LINE}` }}>
                  <div className="flex items-center gap-1 mb-2 text-xs" style={{ color: GREY }}>
                    <Star size={12} strokeWidth={1.5} style={{ fill: GOLD, color: GOLD }} />
                    <span style={{ color: BLACK }}>{r.rating}</span>
                    {r.isVerifiedPurchase && (
                      <span className="ml-1" style={{ color: NEUTRAL }}>· Verified purchase</span>
                    )}
                  </div>

                  <p className={`${display.className} text-sm leading-relaxed`} style={{ color: BLACK }}>
                    {r.comment}
                  </p>

                  {/* Review images — only rendered when present */}
                  {r.images?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {r.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxImg(img)}
                          className="relative w-14 h-14 overflow-hidden shrink-0"
                          style={{ borderRadius: '3px', background: GOLD_LIGHT }}
                        >
                          <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs mt-3" style={{ color: GREY }}>{r.customerName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {related?.length > 0 && (
          <div className="mt-20 sm:mt-28">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] mb-8 pb-3" style={{ color: BLACK, borderBottom: `1px solid ${GOLD}` }}>
              You may also like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile buy bar — portaled directly to <body> so no ancestor
          can break its fixed positioning. */}
      {mounted && data?.product && createPortal(
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-3"
          style={{ background: PAPER, borderTop: `1px solid ${GOLD}`, zIndex: 9999 }}
        >
          <div className="shrink-0">
            <p className="text-base font-medium leading-none" style={{ color: BLACK }}>
              {formatINR(unitPrice)}
            </p>
            {unitCompareAtPrice > unitPrice && (
              <p className="text-[11px] line-through leading-none mt-1" style={{ color: NEUTRAL }}>
                {formatINR(unitCompareAtPrice)}
              </p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={sizeOutOfStock}
            className="flex-1 flex items-center justify-center gap-1.5 font-medium py-2.5 text-sm disabled:opacity-40"
            style={{ border: `1px solid ${BLACK}`, color: BLACK, background: PAPER, borderRadius: '4px' }}
          >
            <ShoppingBag size={15} /> Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={sizeOutOfStock}
            className="flex-1 flex items-center justify-center gap-1.5 font-medium py-2.5 text-sm disabled:opacity-40"
            style={{ background: BLACK, color: GOLD_BRIGHT, border: `1px solid ${BLACK}`, borderRadius: '4px' }}
          >
            <Zap size={15} fill={GOLD_BRIGHT} /> {sizeOutOfStock ? 'Sold out' : 'Buy now'}
          </button>
        </div>,
        document.body
      )}

      {/* Review-image lightbox — single image, closes on backdrop click or the ✕ button */}
      {mounted && lightboxImg && createPortal(
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.88)', zIndex: 10000 }}
        >
          <div className="relative w-full max-w-md aspect-square" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-11 right-0 sm:-top-2 sm:-right-11 w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: PAPER }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <Image src={lightboxImg} alt="Review image" fill className="object-contain" sizes="90vw" />
          </div>
        </div>,
        document.body
      )}

      {/* Size chart modal — swipeable carousel when there's more than one
          image, closes on backdrop click or the ✕ button */}
      {mounted && sizeChartOpen && sizeChartImages.length > 0 && createPortal(
        <div
          onClick={() => setSizeChartOpen(false)}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.88)', zIndex: 10000 }}
        >
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSizeChartOpen(false)}
              className="absolute -top-11 right-0 sm:-top-2 sm:-right-11 w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: PAPER }}
              aria-label="Close size chart"
            >
              <X size={20} />
            </button>

            <div className="relative w-full aspect-square" style={{ background: PAPER, borderRadius: '4px', overflow: 'hidden' }}>
              <Image
                src={sizeChartImages[sizeChartIndex]}
                alt={`Size chart ${sizeChartIndex + 1} of ${sizeChartImages.length}`}
                fill
                className="object-contain"
                sizes="90vw"
              />

              {sizeChartImages.length > 1 && (
                <>
                  <button
                    onClick={prevSizeChart}
                    className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2"
                    aria-label="Previous size chart image"
                  >
                    <ChevronLeft size={22} strokeWidth={1.5} style={{ color: BLACK }} />
                  </button>
                  <button
                    onClick={nextSizeChart}
                    className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2"
                    aria-label="Next size chart image"
                  >
                    <ChevronRight size={22} strokeWidth={1.5} style={{ color: BLACK }} />
                  </button>

                  <div
                    className="absolute bottom-3 right-3 text-[11px] font-medium tracking-wide"
                    style={{ color: BLACK }}
                  >
                    {String(sizeChartIndex + 1).padStart(2, '0')} / {String(sizeChartImages.length).padStart(2, '0')}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}