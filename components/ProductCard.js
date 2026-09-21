'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/utils';
import { getVariantTotalStock } from '@/lib/stock';
import { useWishlist } from '@/components/WhishlistContext'; // adjust path as needed
import { useCart } from '@/components/CartContext';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const GOLD_WASH = '#F6EFD9';
const LINE = '#E8E8E8';
const DISABLED = '#BDBDBD';
const PAPER = '#FFFFFF';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Products with a sleeve or zip choice can't be added straight from the card,
// so those cards send the shopper to the product page instead.
// Adjust these field names if your Product model calls them something else.
const OPTION_FIELDS = ['sleeveOptions', 'zipOptions'];

// ---------------------------------------------------------------------------
// Action buttons
// Mobile (< md):  [ 🛍 ] [        Buy now        ]   -> square cart icon + wide buy button
// Desktop (md+):  [ 🛍 Add to cart ] [ Buy now ]     -> two equal buttons with labels
// 44px tall on mobile for easy tapping, 40px on desktop.
// ---------------------------------------------------------------------------
const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 h-11 md:h-10 rounded-md text-[12px] sm:text-[13px] font-medium tracking-wide whitespace-nowrap transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';

const BTN_CART = `${BTN_BASE} w-11 shrink-0 md:w-auto md:flex-1 md:px-3 bg-white text-black border border-[#C9A227] hover:bg-[#F6EFD9]`;
const BTN_CART_ADDED = `${BTN_BASE} w-11 shrink-0 md:w-auto md:flex-1 md:px-3 bg-[#F6EFD9] text-black border border-[#C9A227]`;
const BTN_BUY = `${BTN_BASE} flex-1 px-3 bg-black text-[#C9A227] border border-[#C9A227] hover:bg-[#C9A227] hover:text-black`;
const BTN_FULL = `${BTN_BASE} w-full px-3 bg-black text-[#C9A227] border border-[#C9A227] hover:bg-[#C9A227] hover:text-black`;

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const variant = product.variants?.[0];
  const image = variant?.images?.[0] || '/placeholder.png';
  const price = product.basePrice || variant?.price || 0;
  const compareAt = variant?.compareAtPrice || 0;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  const sizes = variant?.sizes || [];
  const hasSizes = sizes.length > 0;

  const totalStock = getVariantTotalStock(variant);
  const outOfStock = totalStock <= 0;
  const lowStock = !outOfStock && totalStock <= 5;

  // If the product only comes in one size, pick it automatically.
  const [selectedSize, setSelectedSize] = useState(() =>
    sizes.length === 1 && sizes[0].stock > 0 ? sizes[0].size : ''
  );
  const [added, setAdded] = useState(false);
  const selectedStock = sizes.find((s) => s.size === selectedSize)?.stock ?? 0;

  // Brief "Added" confirmation on the cart button
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const needsProductPage = OPTION_FIELDS.some((k) => product[k]?.length > 0) || !hasSizes;

  const wishlistId = product.id ?? product._id ?? product.slug;
  const wishlisted = isWishlisted(wishlistId);
  const href = `/product/${product.slug}`;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(wishlistId);
  };

  function buildItem() {
    return {
      productId: product._id ?? product.id,
      slug: product.slug,
      variantId: variant?._id,
      name: product.name,
      image,
      color: variant?.color || '-',
      colorHex: variant?.colorHex,
      size: selectedSize,
      price,
      stock: selectedStock,
      qty: 1,
    };
  }

  function requireSize() {
    if (!selectedSize) {
      toast.error('Please select a size');
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!requireSize()) return;
    addItem(buildItem());
    setAdded(true);
  }

  function handleBuyNow() {
    if (!requireSize()) return;
    addItem(buildItem());
    router.push('/checkout');
  }

  return (
    <div style={{ background: PAPER, fontFamily: FONT_SANS }}>
      {/* Image */}
      <div className="relative">
        <Link href={href} className="block" aria-label={product.name}>
          <div className="relative aspect-[3/4] overflow-hidden" style={{ background: GOLD_WASH }}>
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover ${outOfStock ? 'grayscale opacity-70' : ''}`}
            />
          </div>
        </Link>

        {/* Status badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          {outOfStock ? (
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: PAPER, background: INK_SOFT, padding: '5px 12px', borderRadius: '999px' }}
            >
              Out of stock
            </span>
          ) : lowStock ? (
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: PAPER, background: INK, padding: '5px 12px', borderRadius: '999px' }}
            >
              {totalStock} left
            </span>
          ) : discountPct > 0 ? (
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: INK, background: GOLD, padding: '5px 12px', borderRadius: '999px' }}
            >
              Sale
            </span>
          ) : null}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full transition-transform active:scale-90"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(2px)' }}
        >
          <Heart
            className="w-4 h-4"
            strokeWidth={2}
            style={{ color: wishlisted ? GOLD : INK }}
            fill={wishlisted ? GOLD : 'none'}
          />
        </button>
      </div>

      {/* Title + price */}
      <Link href={href} className="block pt-3">
        <h3
          className="text-[13px] sm:text-sm font-medium line-clamp-2"
          style={{ color: INK, lineHeight: 1.375, minHeight: '2.75em' }}
        >
          {product.name}
        </h3>

        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-base sm:text-lg" style={{ color: INK }}>
            {formatINR(price)}
          </span>
          {compareAt > price && (
            <span className="text-xs sm:text-sm line-through font-light" style={{ color: INK_SOFT }}>
              {formatINR(compareAt)}
            </span>
          )}
          {discountPct > 0 && (
            <span className="text-xs font-medium" style={{ color: INK }}>
              {discountPct}% off
            </span>
          )}
        </div>
      </Link>

      {/* Size chips — only when the card can add straight to cart */}
      {!outOfStock && !needsProductPage && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Select size">
          {sizes.map((s) => {
            const soldOut = s.stock <= 0;
            const active = selectedSize === s.size;
            return (
              <button
                key={s.size}
                type="button"
                disabled={soldOut}
                onClick={() => setSelectedSize(s.size)}
                aria-pressed={active}
                className="min-w-[30px] h-7 px-2 text-[11px] font-medium transition-colors"
                style={{
                  borderRadius: '4px',
                  border: `1px solid ${active ? INK : LINE}`,
                  background: active ? INK : PAPER,
                  color: soldOut ? DISABLED : active ? PAPER : INK,
                  textDecoration: soldOut ? 'line-through' : 'none',
                  cursor: soldOut ? 'not-allowed' : 'pointer',
                }}
              >
                {s.size}
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-stretch gap-2">
        {outOfStock ? (
          <button
            type="button"
            disabled
            className={`${BTN_BASE} w-full`}
            style={{ background: LINE, color: INK_SOFT }}
          >
            Out of stock
          </button>
        ) : needsProductPage ? (
          <Link href={href} className={BTN_FULL}>
            Choose options
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAddToCart}
              className={added ? BTN_CART_ADDED : BTN_CART}
              aria-label="Add to cart"
              title="Add to cart"
            >
              {added ? (
                <Check size={16} strokeWidth={2} />
              ) : (
                <ShoppingBag size={16} strokeWidth={1.5} />
              )}
              <span className="hidden md:inline">{added ? 'Added' : 'Add to cart'}</span>
            </button>

            <button type="button" onClick={handleBuyNow} className={BTN_BUY}>
              Buy now
            </button>
          </>
        )}
      </div>
    </div>
  );
}