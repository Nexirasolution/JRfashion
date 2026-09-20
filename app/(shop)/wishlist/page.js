'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/components/WhishlistContext';
import ProductCard from '@/components/ProductCard';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const GOLD_WASH = '#F6EFD9';
const PAPER = '#FFFFFF';
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      if (!wishlist?.length) {
        if (active) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: wishlist })
        });
        const data = await res.json();
        if (active) setProducts(data.products || []);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      active = false;
    };
  }, [wishlist]);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16 min-h-[60vh]" style={{ background: PAPER }}>
      <div className="mb-10">
        <h1 className="text-[24px] sm:text-[28px]" style={{ fontFamily: FONT_SERIF, color: INK }}>
          My Wishlist
        </h1>
        <p className="text-sm mt-1.5" style={{ color: INK_SOFT }}>
          {products.length > 0
            ? `${products.length} item${products.length > 1 ? 's' : ''} saved`
            : 'Items you save will show up here'}
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4]" style={{ background: GOLD_WASH, borderRadius: '4px' }} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20">
          <Heart size={28} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: GOLD }} />
          <p className="text-sm mb-5" style={{ color: INK_SOFT }}>Your wishlist is empty</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium transition-opacity active:opacity-80"
            style={{ background: INK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: '4px' }}
          >
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}