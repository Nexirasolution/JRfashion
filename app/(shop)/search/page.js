'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

// White, black and gold palette (matches the other pages)
const PAPER = '#FFFFFF';
const BLACK = '#000000';
const GREY = '#5E5E5E';       // secondary text on white
const GOLD = '#C9A24B';       // rules and accents
const GOLD_DEEP = '#8C6A12';  // gold text on white (readable contrast)
const GOLD_LIGHT = '#FBF6E9'; // loading skeletons
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ background: PAPER }}>
      <div className="mb-6 pb-4" style={{ borderBottom: `1px solid ${GOLD}` }}>
        <h1
          className="text-2xl tracking-tight mb-1"
          style={{ fontFamily: FONT_SERIF, color: BLACK, fontWeight: 400 }}
        >
          Search results for &ldquo;{q}&rdquo;
        </h1>
        <p className="text-sm" style={{ color: GOLD_DEEP }}>
          {loading ? 'Searching…' : `${products.length} ${products.length === 1 ? 'product' : 'products'} found`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse"
              style={{ background: GOLD_LIGHT, borderRadius: '4px' }}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: GREY }}>
          No products matched your search.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm" style={{ color: GREY }}>
          Loading...
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}