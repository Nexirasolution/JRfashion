export const dynamic = 'force-dynamic';
import { dbConnect } from '@/lib/mongodb';
import Combo from '@/models/Combo';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import { Tag } from 'lucide-react';

// White / black / gold theme
const INK = '#0A0A0A';
const INK_SOFT = '#5A5A5A';
const GOLD = '#C9A227';
const GOLD_DEEP = '#A8861A'; // darker gold for text/icons on white
const GOLD_WASH = '#F7F0D8';
const LINE = '#E8E2D0';
const PAPER = '#FFFFFF';
const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

async function getCombos() {
  await dbConnect();
  const combos = await Combo.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(combos));
}

export default async function CombosPage() {
  const combos = await getCombos();

  return (
    <div className="min-h-[60vh]" style={{ background: PAPER }}>

      {/* Header band */}
      <header style={{ background: INK, borderBottom: `2px solid ${GOLD}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1
              className="text-[28px] sm:text-4xl leading-tight text-white"
              style={{ fontFamily: FONT_SERIF }}
            >
              Combo Offers
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Buy together, save together</p>
          </div>
          {combos.length > 0 && (
            <p className="text-sm shrink-0" style={{ color: GOLD }}>
              {combos.length} {combos.length === 1 ? 'combo' : 'combos'} available
            </p>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {combos.length === 0 ? (
          <div className="text-center py-20" style={{ color: INK_SOFT }}>
            <Tag size={32} className="mx-auto mb-3" style={{ color: GOLD }} strokeWidth={1.5} />
            <p className="text-base" style={{ color: INK, fontFamily: FONT_SERIF }}>No combo offers right now</p>
            <p className="text-sm mt-1.5">New bundles are added regularly. Please check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {combos.map((c) => {
              const isColorPack = c.type === 'color-pack';
              const cheapestPack = isColorPack && c.packOptions?.length
                ? c.packOptions.reduce((min, p) => (p.price < min.price ? p : min), c.packOptions[0])
                : null;

              const displayPrice = isColorPack ? cheapestPack?.price ?? 0 : c.comboPrice;
              const displayOriginal = isColorPack ? cheapestPack?.originalPrice ?? 0 : c.originalPrice;
              const savings = displayOriginal > displayPrice ? displayOriginal - displayPrice : 0;
              const pct = displayOriginal > 0 ? Math.round((savings / displayOriginal) * 100) : 0;

              return (
                <Link
                  key={c._id}
                  href={`/combo/${c.slug}`}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A227]"
                >
                  <div
                    className="relative w-full aspect-[4/5] overflow-hidden transition-colors group-hover:border-[#C9A227]"
                    style={{ background: GOLD_WASH, border: `1px solid ${LINE}`, borderRadius: '2px' }}
                  >
                    {c.images?.[0] && (
                      <img
                        src={c.images[0]}
                        alt={c.name}
                        className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                    {pct > 0 && (
                      <div
                        className="absolute top-2 left-2 text-[10px] sm:text-[11px] font-medium px-2 py-1 flex items-center gap-1"
                        style={{ background: GOLD, color: INK, borderRadius: '2px' }}
                      >
                        <Tag size={10} strokeWidth={2} /> {pct}% off
                      </div>
                    )}
                    {isColorPack && (
                      <div
                        className="absolute top-2 right-2 text-[10px] sm:text-[11px] font-medium px-2 py-1"
                        style={{ background: INK, color: PAPER, borderRadius: '2px' }}
                      >
                        Color pack
                      </div>
                    )}
                  </div>

                  <div className="pt-3">
                    <p className="text-[13px] sm:text-sm leading-snug line-clamp-1" style={{ color: INK }}>{c.name}</p>
                    <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: INK }}>
                        {isColorPack && 'From '}{formatINR(displayPrice)}
                      </span>
                      {savings > 0 && (
                        <span className="text-[11px] line-through" style={{ color: INK_SOFT, opacity: 0.7 }}>{formatINR(displayOriginal)}</span>
                      )}
                    </div>
                    {savings > 0 && (
                      <p className="text-[11px] mt-0.5 font-medium" style={{ color: GOLD_DEEP }}>
                        Save {formatINR(savings)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}