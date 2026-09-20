'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

export default function Filters({ sort, onSortChange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value) => {
    if (typeof onSortChange === 'function') {
      onSortChange(value);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', value);
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div
      className="flex items-center justify-end py-3 px-1"
      style={{ background: PAPER, borderBottom: `1px solid ${LINE}` }}
    >
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          className="text-[11px] font-normal tracking-[1.5px] uppercase"
          style={{ color: INK_SOFT }}
        >
          Sort
        </span>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => handleChange(e.target.value)}
            className="appearance-none bg-transparent outline-none text-[12px] tracking-wide pr-6 py-1"
            style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = GOLD)}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = LINE)}
          >
            {/* <option value="newest">Newest</option> */}
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="newarrival">New Arrival</option>
            <option value="bestselling">Best Selling</option>
          </select>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: INK_SOFT }}
          />
        </div>
      </div>
    </div>
  );
}