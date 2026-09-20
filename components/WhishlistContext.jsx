'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'lb_wishlist_v1';

// Black / white / gold theme — same toast look as the cart.
const GOLD = '#C9A227';
const INK = '#000000';
const INK_SOFT = '#6B6B6B';

const toastStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: INK,
  background: '#FFFFFF',
  borderRadius: '4px',
  padding: '10px 14px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  borderLeft: `3px solid ${GOLD}`,
};

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWishlist(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist, loaded]);

  const addToWishlist = useCallback((productId) => {
    setWishlist((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    toast.success('Added to wishlist', {
      style: toastStyle,
      // Default success icon is green — make it gold to match the theme
      iconTheme: { primary: GOLD, secondary: '#FFFFFF' },
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
    toast('Removed from wishlist', {
      icon: '✕',
      style: { ...toastStyle, borderLeftColor: INK_SOFT },
    });
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const isWishlisted = useCallback((productId) => wishlist.includes(productId), [wishlist]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}