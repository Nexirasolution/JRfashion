'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart, cartKey } from '@/components/CartContext';
import { formatINR } from '@/lib/utils';
import { Trash2, ShoppingBag } from 'lucide-react';

// White / black / gold theme
const INK = '#0A0A0A';
const INK_SOFT = '#5A5A5A';
const GOLD = '#C9A227';
const GOLD_DEEP = '#A8861A'; // darker gold for text on white (better readability)
const GOLD_WASH = '#F7F0D8';
const LINE = '#E8E2D0';
const PAPER = '#FFFFFF';
const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center" style={{ background: PAPER }}>
        <ShoppingBag size={28} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: GOLD }} />
        <p className="text-[15px] mb-1" style={{ color: INK, fontFamily: FONT_SERIF }}>Your cart is empty</p>
        <p className="text-sm mb-7" style={{ color: INK_SOFT }}>Add something beautiful from our collection.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 text-sm font-medium transition-colors hover:bg-[#C9A227] hover:text-[#0A0A0A] active:opacity-80"
          style={{ background: INK, color: PAPER, borderRadius: '4px' }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14" style={{ background: PAPER }}>
      <h1 className="text-[24px] sm:text-[28px]" style={{ fontFamily: FONT_SERIF, color: INK }}>
        Your Cart
      </h1>
      <div className="mt-3 mb-8 h-[2px] w-12" style={{ background: GOLD }} />

      <div className="space-y-0">
        {items.map((item, idx) => {
          const key = cartKey(item);
          return (
            <div
              key={key}
              className="flex gap-4 py-5"
              style={{ borderTop: idx === 0 ? `1px solid ${LINE}` : 'none', borderBottom: `1px solid ${LINE}` }}
            >
              {/* Product image */}
              <div
                className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden"
                style={{ background: GOLD_WASH, border: `1px solid ${LINE}`, borderRadius: '3px' }}
              >
                <Image src={item.image || '/placeholder.png'} alt={item.name} fill className="object-cover" />
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1" style={{ color: INK }}>{item.name}</p>
                <p className="text-xs mt-1" style={{ color: INK_SOFT }}>
                  Color: {item.color} &nbsp;·&nbsp; Size: {item.size}
                </p>
                <p className="text-sm mt-1.5 font-medium" style={{ color: GOLD_DEEP }}>{formatINR(item.price)}</p>

                {/* Qty controls + remove */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center" style={{ border: `1px solid ${LINE}`, borderRadius: '3px' }}>
                    <button
                      onClick={() => updateQty(key, item.qty - 1)}
                      className="px-2.5 py-1 text-sm transition-colors hover:bg-[#F7F0D8] active:opacity-60"
                      style={{ color: INK }}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-sm" style={{ color: INK, borderLeft: `1px solid ${LINE}`, borderRight: `1px solid ${LINE}` }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(key, item.qty + 1)}
                      className="px-2.5 py-1 text-sm transition-colors hover:bg-[#F7F0D8] active:opacity-60"
                      style={{ color: INK }}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(key)}
                    className="transition-colors hover:text-[#0A0A0A] active:opacity-60"
                    style={{ color: INK_SOFT }}
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Line total */}
              <p className="text-sm shrink-0 self-start pt-0.5 font-medium" style={{ color: INK }}>
                {formatINR(item.price * item.qty)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between pt-6 mt-2">
        <span className="text-sm" style={{ color: INK_SOFT }}>Subtotal</span>
        <span className="text-lg" style={{ color: INK, fontFamily: FONT_SERIF }}>{formatINR(subtotal)}</span>
      </div>

      {/* Checkout CTA */}
      <Link
        href="/checkout"
        className="block w-full text-center mt-6 py-3.5 text-sm font-medium transition-colors hover:bg-[#C9A227] hover:text-[#0A0A0A] active:opacity-80"
        style={{ background: INK, color: PAPER, borderRadius: '4px', border: `1px solid ${INK}` }}
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}