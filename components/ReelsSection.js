'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Instagram, ShoppingBag } from 'lucide-react';

export default function ReelsSection({ reels }) {
  if (!reels?.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      {/* Section heading */}
      <div className="text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-pink-500">
          Watch &amp; Shop
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3 text-neutral-900">
          Shop by Reels
        </h2>

        <a
          href="https://instagram.com/ssrkcollections"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
        >
          <Instagram size={15} /> Follow us on Instagram
        </a>
      </div>

      {/* Reels scroll row */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {reels.map((reel) => (
          <div
            key={reel._id}
            className="relative min-w-[145px] sm:min-w-[175px] aspect-[9/16] shrink-0 group rounded-xl overflow-hidden border border-neutral-100"
          >
            <Image
              src={reel.thumbnail || '/placeholder.png'}
              alt={reel.title || 'Reel'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />

            {/* Play button */}
            <a
              href={reel.instagramLink || '#'}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/95 group-hover:scale-110 transition-transform">
                <Play size={16} fill="#DB2777" color="#DB2777" className="ml-0.5" />
              </div>
            </a>

            {/* Bottom info + CTA */}
            <div className="absolute bottom-0 inset-x-0 p-2.5">
              {reel.product?.name && (
                <p className="text-[11px] font-medium line-clamp-1 mb-1.5 text-white">
                  {reel.product.name}
                </p>
              )}
              {reel.product?.slug && (
                <Link
                  href={`/product/${reel.product.slug}`}
                  className="flex items-center justify-center gap-1 w-full text-[11px] font-medium py-1.5 rounded-lg transition-colors bg-white text-pink-600 hover:bg-pink-50"
                >
                  <ShoppingBag size={11} /> Shop Now
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}