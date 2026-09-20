'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import ComboImageGallery from './ComboImageGallery';
import { ShoppingBag, Zap, Ruler, Minus, Plus, PackageCheck, AlertCircle, ChevronDown } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const GOLD_WASH = '#F6EFD9';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

const GENERIC_SIZE_CHART = [
  { size: 'S', chest: '34-36', waist: '28-30', length: '27' },
  { size: 'M', chest: '38-40', waist: '32-34', length: '28' },
  { size: 'L', chest: '42-44', waist: '36-38', length: '29' },
  { size: 'XL', chest: '46-48', waist: '40-42', length: '30' },
  { size: 'XXL', chest: '50-52', waist: '44-46', length: '31' },
];

export default function ColorPackSelector({ combo }) {
  const { addItem } = useCart();
  const router = useRouter();

  const baseProduct = combo.baseProduct;
  const variants = baseProduct?.variants || [];

  const colorOptions = useMemo(
    () =>
      (combo.colors || []).map((c) => {
        const variant =
          variants.find((v) => v._id === c.variantId) ||
          variants.find((v) => v.color?.toLowerCase().trim() === c.name?.toLowerCase().trim());
        return { ...c, variant };
      }),
    [combo.colors, variants]
  );

  // Sizes normally come from the matched product variants. If none of the
  // saved colors resolved a variant, fall back to the combo's own size
  // chart so the selector isn't left permanently empty.
  const allSizes = useMemo(() => {
    const set = new Set();
    colorOptions.forEach((c) => c.variant?.sizes?.forEach((s) => set.add(s.size)));
    if (set.size === 0 && combo.sizeChart?.length) {
      combo.sizeChart.forEach((row) => row.size && set.add(row.size));
    }
    return Array.from(set);
  }, [colorOptions, combo.sizeChart]);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedPackIdx, setSelectedPackIdx] = useState(0);
  const [colorQty, setColorQty] = useState({});
  const [activeColor, setActiveColor] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(false);

  useEffect(() => {
    if (!selectedSize && allSizes.length) setSelectedSize(allSizes[0]);
  }, [allSizes, selectedSize]);

  useEffect(() => {
    if (!activeColor && colorOptions.length) setActiveColor(colorOptions[0].name);
  }, [colorOptions, activeColor]);

  const pack = combo.packOptions?.[selectedPackIdx];
  const packSize = pack?.size || 0;
  const totalSelected = Object.values(colorQty).reduce((a, b) => a + b, 0);
  const remaining = packSize - totalSelected;
  const savings = pack ? Math.max((pack.originalPrice || 0) - pack.price, 0) : 0;
  const savingsPct = pack?.originalPrice > 0 ? Math.round((savings / pack.originalPrice) * 100) : 0;

  // Admin-set combo stock takes priority when present; live variant/size
  // stock is only a fallback when the admin hasn't set a number.
  function stockFor(colorOpt) {
    if (colorOpt?.stock != null) return colorOpt.stock;
    if (!colorOpt?.variant || !selectedSize) return null;
    const s = colorOpt.variant.sizes?.find((s) => s.size === selectedSize);
    return s ? s.stock : 0;
  }

  function handleSizeChange(size) {
    setSelectedSize(size);
    setColorQty({});
  }
  function handlePackChange(idx) {
    setSelectedPackIdx(idx);
    setColorQty({});
  }

  function updateQty(colorName, delta) {
    setColorQty((prev) => {
      const cur = prev[colorName] || 0;
      const opt = colorOptions.find((c) => c.name === colorName);
      const stock = stockFor(opt);
      let next = cur + delta;
      if (next < 0) next = 0;
      if (stock != null && next > stock) next = stock;

      const othersTotal = Object.entries(prev).reduce(
        (sum, [k, v]) => (k === colorName ? sum : sum + v),
        0
      );
      if (othersTotal + next > packSize) next = Math.max(0, packSize - othersTotal);

      return { ...prev, [colorName]: next };
    });
  }

  const activeVariant =
    colorOptions.find((c) => c.name === activeColor)?.variant || colorOptions[0]?.variant;

  // Combo's own uploaded images take priority; variant images are only a
  // fallback for combos where the admin uploaded nothing.
  const images = combo.images?.length ? combo.images : activeVariant?.images?.length ? activeVariant.images : [];

  const canAdd = packSize > 0 && remaining === 0 && !!selectedSize;

  function buildItem() {
    const colorsBreakdown = Object.entries(colorQty)
      .filter(([, v]) => v > 0)
      .map(([name, qty]) => ({ name, qty }));
    return {
      productId: baseProduct?._id,
      comboId: combo._id,
      variantId: 'color-pack',
      name: `${combo.name} (Pack of ${packSize})`,
      image: images[0] || combo.images?.[0],
      color: colorsBreakdown.map((c) => `${c.name} x${c.qty}`).join(', '),
      size: selectedSize,
      price: pack?.price || 0,
      qty: 1,
      packDetails: { packSize, size: selectedSize, colors: colorsBreakdown },
    };
  }

  function handleAddToCart() {
    if (!canAdd) return;
    addItem(buildItem());
  }
  function handleBuyNow() {
    if (!canAdd) return;
    addItem(buildItem());
    router.push('/checkout');
  }

  const helperText = packSize === 0
    ? 'This combo has no pack options set up yet'
    : !selectedSize
    ? 'Select a size to continue'
    : remaining > 0
    ? `Pick ${remaining} more color${remaining === 1 ? '' : 's'} to continue`
    : '';

  const sizeChartRows = combo.sizeChart?.length ? combo.sizeChart : GENERIC_SIZE_CHART;

  return (
    <div className="grid sm:grid-cols-2 gap-6 sm:gap-10">
      {/* Gallery */}
      <ComboImageGallery
        images={images}
        alt={activeColor || combo.name}
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

      <div className="flex flex-col pb-24 sm:pb-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          <span className="text-xs" style={{ color: INK_SOFT }}>Exclusive bundle</span>
        </div>
        <h1
          className="text-[26px] sm:text-[34px] leading-[1.1]"
          style={{ color: INK, fontFamily: FONT_SERIF }}
        >
          {combo.name}
        </h1>
        {combo.description && (
          <p className="text-sm mt-3 leading-relaxed max-w-[42ch]" style={{ color: INK_SOFT }}>{combo.description}</p>
        )}

        {/* Price */}
        <div className="mt-5 py-4" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          {pack ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-[26px] font-semibold" style={{ color: INK }}>{formatINR(pack.price || 0)}</span>
                {pack.originalPrice > pack.price && (
                  <span className="line-through text-base" style={{ color: INK_SOFT, opacity: 0.6 }}>{formatINR(pack.originalPrice)}</span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-sm font-medium mt-1.5" style={{ color: INK }}>
                  You save {formatINR(savings)} ({savingsPct}% off)
                </p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: INK_SOFT }}>No pack options configured yet.</p>
          )}
        </div>

        {/* Size */}
        <div className="mt-6">
          <h3 className="text-sm mb-3" style={{ color: INK }}>Select size</h3>
          {allSizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allSizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => handleSizeChange(size)}
                    className="min-w-[44px] h-[44px] px-3 text-sm transition-colors"
                    style={{
                      borderRadius: '2px',
                      border: `1px solid ${active ? INK : LINE}`,
                      background: active ? INK : PAPER,
                      color: active ? PAPER : INK,
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: INK_SOFT }}>No sizes available for this combo yet.</p>
          )}

          {/* Size chart trigger — sits below the size buttons themselves */}
          <button
            onClick={() => setShowSizeChart((v) => !v)}
            className="flex items-center gap-1 text-xs mt-3 underline underline-offset-2"
            style={{ color: INK }}
          >
            <Ruler size={13} strokeWidth={1.75} /> Size chart
            <ChevronDown
              size={12}
              strokeWidth={2}
              style={{
                transform: showSizeChart ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
              }}
            />
          </button>

          {/* Inline size chart — expands directly below the trigger instead
              of a popup modal, so it reads in context with the size the
              shopper is picking. */}
          {showSizeChart && (
            <div className="mt-4 p-4" style={{ border: `1px solid ${LINE}`, borderRadius: '2px', background: GOLD_WASH }}>
              <p className="text-xs mb-3" style={{ color: INK_SOFT }}>All measurements in inches.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs" style={{ color: INK_SOFT, borderBottom: `1px solid ${LINE}` }}>
                    <th className="py-2 font-normal">Size</th>
                    <th className="py-2 font-normal">Chest</th>
                    <th className="py-2 font-normal">Waist</th>
                    <th className="py-2 font-normal">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChartRows.map((row) => (
                    <tr key={row.size} style={{ borderBottom: `1px solid ${LINE}` }}>
                      <td className="py-2" style={{ color: INK }}>{row.size}</td>
                      <td className="py-2" style={{ color: INK_SOFT }}>{row.chest}</td>
                      <td className="py-2" style={{ color: INK_SOFT }}>{row.waist}</td>
                      <td className="py-2" style={{ color: INK_SOFT }}>{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pack option */}
        <div className="mt-6">
          <h3 className="text-sm mb-3" style={{ color: INK }}>Choose pack</h3>
          {combo.packOptions?.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {combo.packOptions.map((p, i) => {
                const pctOff = p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                const active = selectedPackIdx === i;
                const outOfStock = p.stock != null && p.stock <= 0;
                return (
                  <button
                    key={i}
                    onClick={() => !outOfStock && handlePackChange(i)}
                    disabled={outOfStock}
                    className="p-3 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      borderRadius: '2px',
                      border: `1px solid ${active ? GOLD : LINE}`,
                      background: active ? GOLD_WASH : PAPER,
                    }}
                  >
                    <p className="text-sm" style={{ color: INK }}>Pack of {p.size}</p>
                    <p className="font-semibold text-sm mt-0.5" style={{ color: INK }}>{formatINR(p.price)}</p>
                    {outOfStock ? (
                      <p className="text-[11px] mt-0.5" style={{ color: INK_SOFT }}>Out of stock</p>
                    ) : (
                      pctOff > 0 && <p className="text-[11px] font-medium mt-0.5" style={{ color: INK }}>{pctOff}% off</p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: INK_SOFT }}>No pack sizes available yet.</p>
          )}
        </div>

        {/* Colors */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ color: INK }}>
              Choose colors <span style={{ color: INK_SOFT }}>({totalSelected}/{packSize})</span>
            </h3>
            {packSize > 0 && (
              remaining > 0 ? (
                <span className="text-xs flex items-center gap-1" style={{ color: INK }}>
                  <AlertCircle size={12} strokeWidth={2} style={{ color: GOLD }} /> {remaining} more
                </span>
              ) : (
                <span className="text-xs flex items-center gap-1" style={{ color: INK }}>
                  <PackageCheck size={12} strokeWidth={2} style={{ color: GOLD }} /> Complete
                </span>
              )
            )}
          </div>

          {colorOptions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {colorOptions.map((c) => {
                const stock = stockFor(c);
                const outOfStock = stock === 0;
                const qty = colorQty[c.name] || 0;
                const isActive = activeColor === c.name;
                return (
                  <div
                    key={c.name}
                    onMouseEnter={() => setActiveColor(c.name)}
                    onClick={() => setActiveColor(c.name)}
                    className="flex items-center gap-2 p-2.5 transition-colors"
                    style={{
                      borderRadius: '2px',
                      border: `1px solid ${isActive ? GOLD : LINE}`,
                      opacity: outOfStock ? 0.4 : 1,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full shrink-0"
                      style={{
                        backgroundColor: c.hex || '#ddd',
                        boxShadow: isActive ? `0 0 0 2px ${PAPER}, 0 0 0 3.5px ${GOLD}` : `0 0 0 1px ${LINE}`,
                      }}
                      title={c.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate" style={{ color: INK }}>{c.name}</p>
                      <p className="text-[10px]" style={{ color: INK_SOFT }}>
                        {outOfStock ? 'Out of stock' : stock != null ? `${stock} left` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={qty === 0}
                        onClick={() => updateQty(c.name, -1)}
                        aria-label={`Decrease ${c.name} quantity`}
                        className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                        style={{ border: `1px solid ${LINE}`, color: INK }}
                      >
                        <Minus size={12} strokeWidth={2} />
                      </button>
                      <span className="w-4 text-center text-xs font-medium" style={{ color: INK }}>{qty}</span>
                      <button
                        disabled={outOfStock || remaining === 0}
                        onClick={() => updateQty(c.name, 1)}
                        aria-label={`Increase ${c.name} quantity`}
                        className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                        style={{ border: `1px solid ${LINE}`, color: INK }}
                      >
                        <Plus size={12} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: INK_SOFT }}>No colors available for this combo yet.</p>
          )}
        </div>

        {/* Desktop inline CTA */}
        <div className="hidden sm:block mt-8">
          <div className="flex gap-2.5">
            <button
              onClick={handleAddToCart}
              disabled={!canAdd}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full active:scale-[0.98] transition-transform disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${canAdd ? GOLD : LINE}`,
                color: canAdd ? INK : INK_SOFT,
                background: PAPER,
              }}
            >
              <ShoppingBag size={16} strokeWidth={1.75} /> Add to cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!canAdd}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full transition-transform active:scale-[0.98] disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${canAdd ? GOLD : LINE}`,
                background: canAdd ? INK : LINE,
                color: canAdd ? GOLD : INK_SOFT,
              }}
            >
              <Zap size={16} fill="currentColor" strokeWidth={0} /> Buy now
            </button>
          </div>
          {helperText && (
            <p className="text-xs text-center mt-2.5" style={{ color: INK_SOFT }}>{helperText}</p>
          )}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{ background: PAPER, borderTop: `1px solid ${LINE}` }}
      >
        {helperText && (
          <p className="text-xs text-center mb-2" style={{ color: INK_SOFT }}>{helperText}</p>
        )}
        <div className="flex gap-2.5">
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full active:scale-[0.98] transition-transform disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${canAdd ? GOLD : LINE}`,
              color: canAdd ? INK : INK_SOFT,
              background: PAPER,
            }}
          >
            <ShoppingBag size={16} strokeWidth={1.75} /> Add
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!canAdd}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full transition-transform active:scale-[0.98] disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${canAdd ? GOLD : LINE}`,
              background: canAdd ? INK : LINE,
              color: canAdd ? GOLD : INK_SOFT,
            }}
          >
            <Zap size={16} fill="currentColor" strokeWidth={0} /> Buy now
          </button>
        </div>
      </div>
    </div>
  );
}