'use client';

import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap } from 'lucide-react';

const INK = '#000000';
const GOLD = '#C9A227';
const PAPER = '#FFFFFF';

export default function AddComboButton({ combo }) {
  const { addItem } = useCart();
  const router = useRouter();

  const item = {
    productId: combo._id,
    variantId: 'combo',
    comboId: combo._id,
    name: combo.name,
    image: combo.images?.[0],
    color: '-',
    size: 'Combo',
    price: combo.comboPrice,
    qty: 1,
  };

  function handleAddToCart() {
    addItem(item);
  }

  function handleBuyNow() {
    addItem(item);
    router.push('/checkout');
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={handleAddToCart}
        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full active:scale-[0.98] transition-transform"
        style={{ border: `1px solid ${GOLD}`, color: INK, background: PAPER }}
      >
        <ShoppingBag size={16} strokeWidth={1.75} />
        Add to cart
      </button>
      <button
        onClick={handleBuyNow}
        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full transition-colors active:scale-[0.98]"
        style={{ background: INK, color: GOLD, border: `1px solid ${GOLD}` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = GOLD;
          e.currentTarget.style.color = INK;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = INK;
          e.currentTarget.style.color = GOLD;
        }}
      >
        <Zap size={16} fill="currentColor" strokeWidth={0} />
        Buy now
      </button>
    </div>
  );
}