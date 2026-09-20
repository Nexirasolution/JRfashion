'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const STORAGE_KEY = 'lb_cart_v1';

// ── Brand tokens — black / white / gold minimalist theme ────
const GOLD      = '#C9A227';
const INK       = '#000000';
const INK_SOFT  = '#6B6B6B';
const RUST      = '#B0503A'; // status color for out-of-stock errors — kept red on purpose

const toastBase = {
  duration: 2500,
  style: {
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    color: INK,
    background: '#FFFFFF',
    borderRadius: '4px',
    padding: '10px 14px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    borderLeft: `3px solid ${GOLD}`,
  },
};

function brandToast(message, opts = {}) {
  return toast(
    (t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span>{message}</span>
        <span style={{ fontSize: 9, color: INK_SOFT, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
         Tirupur Clothing Hub
        </span>
      </div>
    ),
    { ...toastBase, ...opts }
  );
}

// A cart/order line is unique per product+variant+size AND per sleeve/zip/
// pant/shawl selection now — e.g. the same size in "Full Sleeve" and "Half
// Sleeve", or with vs without a pant add-on, are separate lines, not merged.
function sameLine(a, b) {
  return (
    a.productId === b.productId &&
    a.variantId === b.variantId &&
    a.size === b.size &&
    a.comboId === b.comboId &&
    (a.sleeveType || '') === (b.sleeveType || '') &&
    (a.zipType || '') === (b.zipType || '') &&
    (a.pantOption?.id || '') === (b.pantOption?.id || '') &&
    (a.shawlOption?.id || '') === (b.shawlOption?.id || '')
  );
}
// ───────────────────────────────────────────────────────────────

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem = useCallback((item) => {
    let blocked = false;
    let clamped = false;

    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLine(i, item));

      const stockLimit = typeof item.stock === 'number' ? item.stock : Infinity;

      if (idx > -1) {
        const currentQty = prev[idx].qty;

        if (currentQty >= stockLimit) {
          blocked = true;
          return prev;
        }

        const desiredQty = currentQty + item.qty;
        const finalQty = Math.min(desiredQty, stockLimit);
        if (finalQty < desiredQty) clamped = true;

        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: finalQty, stock: stockLimit };
        return copy;
      }

      if (stockLimit <= 0) {
        blocked = true;
        return prev;
      }

      const finalQty = Math.min(item.qty, stockLimit);
      if (finalQty < item.qty) clamped = true;
      return [...prev, { ...item, qty: finalQty }];
    });

    if (blocked) {
      brandToast('Sorry, this item is out of stock', {
        icon: '⚠️',
        style: { ...toastBase.style, borderLeftColor: RUST },
      });
      return;
    }

    if (clamped) {
      brandToast('Only limited stock available — quantity adjusted', {
        icon: '⚠️',
        style: { ...toastBase.style, borderLeftColor: INK },
      });
      return;
    }

    brandToast('Added to cart', {
      icon: '✓',
      style: { ...toastBase.style, borderLeftColor: GOLD },
    });
  }, []);

  // Adds several lines at once (e.g. all colors of a color-pack combo) as a
  // single state update, with one summary toast instead of one per line.
  const addItems = useCallback((newItems) => {
    let blockedCount = 0;
    let clampedCount = 0;
    let addedCount = 0;

    setItems((prev) => {
      let next = [...prev];

      for (const item of newItems) {
        const idx = next.findIndex((i) => sameLine(i, item));
        const stockLimit = typeof item.stock === 'number' ? item.stock : Infinity;

        if (idx > -1) {
          const currentQty = next[idx].qty;
          if (currentQty >= stockLimit) {
            blockedCount++;
            continue;
          }
          const desiredQty = currentQty + item.qty;
          const finalQty = Math.min(desiredQty, stockLimit);
          if (finalQty < desiredQty) clampedCount++;
          next[idx] = { ...next[idx], qty: finalQty, stock: stockLimit };
          addedCount++;
          continue;
        }

        if (stockLimit <= 0) {
          blockedCount++;
          continue;
        }

        const finalQty = Math.min(item.qty, stockLimit);
        if (finalQty < item.qty) clampedCount++;
        next = [...next, { ...item, qty: finalQty }];
        addedCount++;
      }

      return next;
    });

    if (addedCount === 0 && blockedCount > 0) {
      brandToast('Sorry, those items are out of stock', {
        icon: '⚠️',
        style: { ...toastBase.style, borderLeftColor: RUST },
      });
      return;
    }

    if (clampedCount > 0 || blockedCount > 0) {
      brandToast('Added to cart — some quantities were limited by stock', {
        icon: '⚠️',
        style: { ...toastBase.style, borderLeftColor: INK },
      });
      return;
    }

    brandToast('Added to cart', {
      icon: '✓',
      style: { ...toastBase.style, borderLeftColor: GOLD },
    });
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) =>
      prev.map((i) => {
        if (cartKey(i) !== key) return i;
        const max = typeof i.stock === 'number' ? i.stock : Infinity;
        const nextQty = Math.max(1, Math.min(qty, max));
        if (qty > max) {
          brandToast(`Only ${max} left in stock`, {
            icon: '⚠️',
            style: { ...toastBase.style, borderLeftColor: INK },
          });
        }
        return { ...i, qty: nextQty };
      })
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => cartKey(i) !== key));
    brandToast('Removed from cart', {
      icon: '🗑️',
      style: { ...toastBase.style, borderLeftColor: INK_SOFT },
    });
  }, []);

  const setItemStock = useCallback((key, stock) => {
    setItems((prev) =>
      prev.map((i) => {
        if (cartKey(i) !== key) return i;
        const nextQty = Math.max(1, Math.min(i.qty, stock));
        return { ...i, stock, qty: nextQty };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    brandToast('Cart cleared', {
      icon: '✕',
      style: { ...toastBase.style, borderLeftColor: INK_SOFT },
    });
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count    = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItems,
        updateQty,
        removeItem,
        setItemStock,
        clearCart,
        subtotal,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function cartKey(i) {
  return [
    i.productId,
    i.variantId,
    i.size,
    i.comboId,
    i.sleeveType,
    i.zipType,
    i.pantOption?.id,
    i.shawlOption?.id,
  ].filter(Boolean).join('-');
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}