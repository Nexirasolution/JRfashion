'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import Filters from '@/components/Filters';

// White / black / gold theme
// black  #0A0A0A   gold  #C9A227   deep gold #A8861A
// gold wash #F7F0D8   line #E8E2D0   muted #5A5A5A
const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

function flagToSortValue(flag) {
  if (flag === 'bestseller') return 'bestselling';
  if (flag === 'newarrival') return 'newarrival';
  return 'newest';
}

function sortToApiSort(sort) {
  if (sort === 'newarrival') return 'newest';
  if (sort === 'bestselling') return 'popular';
  return sort;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const urlFlag = searchParams.get('flag');

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState(flagToSortValue(urlFlag));
  const [flag, setFlag] = useState(urlFlag);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSort(flagToSortValue(urlFlag));
    setFlag(urlFlag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, urlFlag]);

  function handleSortChange(value) {
    setSort(value);
    if (value === 'newarrival') setFlag('newarrival');
    else if (value === 'bestselling') setFlag('bestseller');
    else setFlag(null);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const catRes = await fetch(`/api/categories/${slug}`);
    const catData = await catRes.json();
    setCategory(catData.category);
    setSubcategories(catData.subcategories || []);

    const params = new URLSearchParams({
      category: slug,
      sort: sortToApiSort(sort),
      limit: '1000',
    });
    if (flag) params.set('flag', flag);

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.products || []);

    setLoading(false);
  }, [slug, sort, flag]);

  useEffect(() => {
    load();
  }, [load]);

  const heading =
    flag === 'bestseller' ? `Best Sellers${category?.name ? ` in ${category.name}` : ''}` :
    flag === 'topseller' ? `Top Sellers${category?.name ? ` in ${category.name}` : ''}` :
    flag === 'newarrival' ? `New Arrivals${category?.name ? ` in ${category.name}` : ''}` :
    category?.name || 'Products';

  return (
    <div className="bg-white text-[#0A0A0A]">

      {/* ── Header band ─────────────────────────────────────────── */}
      <header className="bg-[#0A0A0A] border-b-2 border-[#C9A227]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-8 sm:pb-10">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs text-white/60">
            <Link href="/" className="hover:text-[#C9A227] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A227]">
              Home
            </Link>
            {category?.parent && (
              <>
                <ChevronRight size={12} aria-hidden="true" />
                <Link
                  href={`/category/${category.parent.slug}`}
                  className="hover:text-[#C9A227] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A227]"
                >
                  {category.parent.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-white/90">{category?.name || 'Products'}</span>
          </nav>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="max-w-2xl">
              <h1
                className="text-[28px] sm:text-4xl leading-tight text-white"
                style={{ fontFamily: FONT_SERIF }}
              >
                {heading}
              </h1>
              {category?.description && (
                <p className="text-sm mt-2 text-white/65 leading-relaxed">{category.description}</p>
              )}
            </div>

            {!loading && (
              <p className="text-sm text-[#C9A227] shrink-0">
                {products.length} {products.length === 1 ? 'style' : 'styles'}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Subcategories: arched tiles ───────────────────────── */}
        {subcategories.length > 0 && (
          <section aria-label="Subcategories" className="pt-8">
            <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 -mx-1 px-1">
              {subcategories.map((sub) => (
                <Link
                  key={sub._id}
                  href={`/category/${sub.slug}`}
                  className="group flex-shrink-0 w-24 sm:w-28 flex flex-col items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A227]"
                >
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-t-full bg-[#F7F0D8] border border-[#E8E2D0] group-hover:border-[#C9A227]">
                    {sub.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight text-[#0A0A0A] group-hover:text-[#A8861A]">
                    {sub.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Toolbar: sort/filter ──────────────────────────────── */}
        <div className="mt-6 py-3 border-y border-[#E8E2D0]">
          <Filters sort={sort} onSortChange={handleSortChange} />
        </div>

        {/* ── Product grid ──────────────────────────────────────── */}
        <div className="py-8 sm:py-10">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-[#F7F0D8]/60 border border-[#E8E2D0] animate-pulse" />
                  <div className="mt-3 h-3 w-3/4 bg-[#F7F0D8]/60 animate-pulse" />
                  <div className="mt-2 h-3 w-1/3 bg-[#F7F0D8]/60 animate-pulse" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 sm:py-24 max-w-sm mx-auto">
              <ShoppingBag size={30} strokeWidth={1.5} className="mx-auto mb-4 text-[#C9A227]" />
              <p className="text-lg" style={{ fontFamily: FONT_SERIF }}>
                No products in this category yet
              </p>
              <p className="text-sm mt-1.5 text-[#5A5A5A]">
                New styles arrive every week. Browse the rest of the collection in the meantime.
              </p>
              <Link
                href="/"
                className="inline-block mt-6 px-6 py-3 text-sm font-medium bg-[#0A0A0A] text-white rounded-[4px] transition-colors hover:bg-[#C9A227] hover:text-[#0A0A0A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}