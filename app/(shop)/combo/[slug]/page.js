export const dynamic = 'force-dynamic';
import { dbConnect } from '@/lib/mongodb';
import Combo from '@/models/Combo';
import { formatINR } from '@/lib/utils';
import AddComboButton from '@/components/AddComboButton';
import ColorPackSelector from '@/components/ColorPackSelector';
import ComboImageGallery from '@/components/ComboImageGallery';
import { Package, Tag, CheckCircle2, RotateCcw, Shield, Truck } from 'lucide-react';

// White / black / gold theme
const INK = '#0A0A0A';
const INK_SOFT = '#5A5A5A';
const GOLD = '#C9A227';
const GOLD_DEEP = '#A8861A'; // darker gold for text/icons on white
const GOLD_WASH = '#F7F0D8';
const SURFACE = '#FAF8F3';
const LINE = '#E8E2D0';
const PAPER = '#FFFFFF';
const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

export default async function ComboPage({ params }) {
  await dbConnect();
  const combo = await Combo.findOne({ slug: params.slug, isActive: true })
    .populate('products.product', 'name slug variants')
    .populate('baseProduct', 'name slug variants')
    .lean();

  if (!combo) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm" style={{ color: INK_SOFT }}>Combo not found.</div>;
  }

  const plain = JSON.parse(JSON.stringify(combo));
  const isColorPack = plain.type === 'color-pack';

  const cheapestPack = isColorPack && plain.packOptions?.length
    ? plain.packOptions.reduce((min, p) => (p.price < min.price ? p : min), plain.packOptions[0])
    : null;

  const bannerSavings = isColorPack
    ? Math.max((cheapestPack?.originalPrice || 0) - (cheapestPack?.price || 0), 0)
    : Math.max((plain.originalPrice || 0) - (plain.comboPrice || 0), 0);
  const bannerOriginal = isColorPack ? cheapestPack?.originalPrice || 0 : plain.originalPrice || 0;
  const savingsPct = bannerOriginal > 0 ? Math.round((bannerSavings / bannerOriginal) * 100) : 0;

  return (
    <div style={{ background: PAPER }}>

      {/* Offer strip */}
      {savingsPct > 0 && (
        <div
          className="text-center text-xs sm:text-sm py-2.5 px-4"
          style={{ background: INK, color: GOLD, borderBottom: `2px solid ${GOLD}` }}
        >
          Limited combo offer — save {savingsPct}% when you bundle
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10">

        {isColorPack ? (
          <ColorPackSelector combo={plain} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-12 sm:items-start">

            {/* Gallery (stays in view on desktop while details scroll) */}
            <div className="sm:sticky sm:top-6">
              <ComboImageGallery
                images={plain.images}
                alt={plain.name}
                peachLight={GOLD_WASH}
                line={LINE}
                badge={
                  savingsPct > 0 && (
                    <div
                      className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1"
                      style={{ background: GOLD, color: INK, borderRadius: '2px' }}
                    >
                      {savingsPct}% off
                    </div>
                  )
                }
              />
            </div>

            <div className="flex flex-col">
              <span
                className="self-start text-xs px-2.5 py-1 mb-3"
                style={{ background: GOLD_WASH, color: GOLD_DEEP, border: `1px solid ${LINE}`, borderRadius: '2px' }}
              >
                Exclusive bundle
              </span>
              <h1
                className="text-[26px] sm:text-[34px] leading-[1.15]"
                style={{ color: INK, fontFamily: FONT_SERIF }}
              >
                {plain.name}
              </h1>
              <div className="mt-3 h-[2px] w-12" style={{ background: GOLD }} />
              {plain.description && (
                <p className="text-sm mt-4 leading-relaxed max-w-[46ch]" style={{ color: INK_SOFT }}>{plain.description}</p>
              )}

              {/* Price block */}
              <div className="mt-6 p-4" style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: '3px' }}>
                <div className="flex items-baseline gap-3">
                  <span className="text-[28px] font-semibold" style={{ color: INK, fontFamily: FONT_SERIF }}>{formatINR(plain.comboPrice)}</span>
                  {plain.originalPrice > plain.comboPrice && (
                    <span className="line-through text-base" style={{ color: INK_SOFT, opacity: 0.7 }}>{formatINR(plain.originalPrice)}</span>
                  )}
                </div>
                {plain.originalPrice - plain.comboPrice > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Tag size={13} style={{ color: GOLD_DEEP }} strokeWidth={2} />
                    <p className="text-sm font-medium" style={{ color: GOLD_DEEP }}>You save {formatINR(plain.originalPrice - plain.comboPrice)} with this combo</p>
                  </div>
                )}
              </div>

              {/* What's included */}
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={16} style={{ color: GOLD_DEEP }} strokeWidth={1.75} />
                  <h3 className="text-base" style={{ color: INK, fontFamily: FONT_SERIF }}>
                    What&rsquo;s included <span className="text-sm" style={{ color: INK_SOFT, fontFamily: 'inherit' }}>({plain.products?.length})</span>
                  </h3>
                </div>
                <div className="space-y-2">
                  {plain.products?.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2.5"
                      style={{ background: PAPER, border: `1px solid ${LINE}`, borderLeft: `3px solid ${GOLD}`, borderRadius: '2px' }}
                    >
                      <CheckCircle2 size={15} style={{ color: GOLD_DEEP }} className="shrink-0" strokeWidth={1.75} />
                      <span className="text-sm" style={{ color: INK }}>{p.product?.name || 'Product unavailable'}</span>
                      {p.size && (
                        <span
                          className="ml-auto text-xs px-2 py-0.5 shrink-0"
                          style={{ background: GOLD_WASH, color: INK, borderRadius: '2px' }}
                        >
                          Size {p.size}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop / tablet inline CTA */}
              <div className="hidden sm:block mt-8">
                <AddComboButton combo={plain} />
                <p className="text-xs text-center mt-2.5" style={{ color: INK_SOFT }}>
                  Combo price applies automatically at checkout
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trust row */}
        <div
          className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-5 sm:p-6"
          style={{ background: SURFACE, borderTop: `2px solid ${GOLD}`, border: `1px solid ${LINE}`, borderTopWidth: '2px', borderTopColor: GOLD }}
        >
          <div className="flex gap-3 items-start">
            <Truck size={18} style={{ color: GOLD_DEEP }} className="shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium" style={{ color: INK }}>Free delivery</p>
              <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>Free shipping on all combo orders across India.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <RotateCcw size={18} style={{ color: GOLD_DEEP }} className="shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium" style={{ color: INK }}>7-day returns</p>
              <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>Not satisfied? Return within 7 days for a full refund.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Shield size={18} style={{ color: GOLD_DEEP }} className="shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium" style={{ color: INK }}>100% genuine</p>
              <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>Every piece is quality-checked before dispatch.</p>
            </div>
          </div>
        </div>

        {!isColorPack && plain.originalPrice > plain.comboPrice && (
          <div className="mt-8 sm:mt-10 pt-6 text-center" style={{ borderTop: `1px solid ${LINE}` }}>
            <p className="text-sm" style={{ color: INK_SOFT }}>
              Buying individually would cost{' '}
              <span className="line-through">{formatINR(plain.originalPrice)}</span> — get this combo for just{' '}
              <span className="font-semibold" style={{ color: INK }}>{formatINR(plain.comboPrice)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {!isColorPack && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
          style={{ background: PAPER, borderTop: `2px solid ${GOLD}` }}
        >
          <AddComboButton combo={plain} />
        </div>
      )}

    </div>
  );
}