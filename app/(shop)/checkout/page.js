'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import toast from 'react-hot-toast';
import { useCart, cartKey } from '@/components/CartContext';
import { formatINR } from '@/lib/utils';

// White / black / gold theme
const INK = '#0A0A0A';
const INK_SOFT = '#5A5A5A';
const GOLD = '#C9A227';
const GOLD_DEEP = '#A8861A'; // darker gold for text on white (readable)
const GOLD_WASH = '#F7F0D8';
const SURFACE = '#FAF8F3';
const LINE = '#E8E2D0';
const PAPER = '#FFFFFF';
const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

const inputClass =
  'w-full text-sm outline-none transition-colors px-3.5 py-2.5 bg-white text-[#0A0A0A] ' +
  'border border-[#E8E2D0] rounded-[3px] placeholder:text-[#8A8A8A] ' +
  'focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]';

const sectionHeadClass = 'text-lg mb-4';

function SSRKInput({ placeholder, type = 'text', value, onChange, autoComplete, inputMode, maxLength }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      className={inputClass}
    />
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, updateQty, removeItem, setItemStock } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    line1: '', line2: '', city: '', state: '', pincode: '', landmark: ''
  });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [submitting, setSubmitting] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);

  const [shipping, setShipping] = useState(null);
  const [freeShippingAbove, setFreeShippingAbove] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const discountedSubtotal = subtotal - discount;
  const total = shipping !== null ? Math.round(discountedSubtotal + shipping) : null;

  // Total piece count across the cart — used by the shipping API to work
  // out order weight (totalQty × weight-per-piece from admin Settings).
  const totalQty = items.reduce((sum, i) => sum + (i.qty || 0), 0);

  const fetchShipping = useCallback(async () => {
    setShippingLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal: discountedSubtotal, totalQty })
      });
      const data = await res.json();
      if (res.ok) {
        setShipping(data.shippingCost);
        setFreeShippingAbove(data.freeShippingAbove);
      } else {
        toast.error(data.error || 'Could not calculate shipping');
      }
    } catch {
      toast.error('Could not calculate shipping');
    } finally {
      setShippingLoading(false);
    }
  }, [discountedSubtotal, totalQty]);

  useEffect(() => { fetchShipping(); }, [fetchShipping]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: coupon, subtotal })
    });
    const data = await res.json();
    if (data.valid) { setDiscount(data.discount); toast.success(data.message); }
    else { setDiscount(0); toast.error(data.message); }
  }

  async function validateStockBeforeOrder() {
    setCheckingStock(true);
    try {
      const res = await fetch('/api/cart/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,
            qty: i.qty,
            name: i.name,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not verify stock, please try again');
        return false;
      }

      if (data.valid) return true;

      data.issues.forEach((issue) => {
        const key = cartKey(issue);
        if (issue.reason === 'unavailable' || issue.reason === 'out_of_stock') {
          toast.error(`${issue.name || 'An item'} is out of stock and was removed from your cart`);
          removeItem(key);
        } else if (issue.reason === 'insufficient_stock') {
          toast.error(`Only ${issue.availableStock} left of ${issue.name || 'an item'} — quantity adjusted`);
          updateQty(key, issue.availableStock);
          setItemStock(key, issue.availableStock);
        }
      });

      return false;
    } catch {
      toast.error('Could not verify stock, please try again');
      return false;
    } finally {
      setCheckingStock(false);
    }
  }

  async function placeOrder() {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      toast.error('Please fill all required fields'); return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    if (shipping === null) { toast.error('Shipping is still being calculated, please wait'); return; }

    setSubmitting(true);

    const stockOk = await validateStockBeforeOrder();
    if (!stockOk) {
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      size: i.size,
      sleeveType: i.sleeveType || '',
      zipType: i.zipType || '',
      qty: i.qty,
      isCombo: i.isCombo || false,
      comboId: i.comboId
    }));

    try {
      if (paymentMethod === 'razorpay') {
        // Server recomputes the total from orderItems and stashes the order
        // payload so the webhook can create the order even if this tab
        // closes before the handler below runs.
        // `expectedTotal` is only a safety check: if the server's total
        // differs from what the customer saw, the server answers 409 and
        // the Razorpay popup never opens with a wrong amount.
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: orderItems,
            customer: { name: form.name, phone: form.phone, email: form.email },
            shippingAddress: form,
            couponCode: coupon,
            expectedTotal: total
          })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          toast.error(orderData.error || 'Payment gateway error');
          if (orderRes.status === 409) fetchShipping(); // refresh what the page shows
          setSubmitting(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.order.amount,
          currency: 'INR',
          name: 'Tirupur Clothing Hub',
          order_id: orderData.order.id,
          prefill: { name: form.name, contact: form.phone, email: form.email },
          theme: { color: '#0A0A0A' },
          handler: async function (response) {
            // Fast path — if this fails or never runs, the webhook creates
            // the same order server-side. /api/orders is idempotent on
            // razorpayOrderId, so this is always safe to call.
            const finalRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: orderItems,
                customer: { name: form.name, phone: form.phone, email: form.email },
                shippingAddress: form,
                couponCode: coupon,
                paymentMethod: 'razorpay',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });
            const finalData = await finalRes.json();
            if (finalRes.ok) {
              clearCart();
              router.push(`/order-success/${finalData.order._id}`);
            } else {
              // Payment already succeeded on Razorpay's side regardless —
              // the webhook will still create the order in the background.
              toast.error(
                `Payment received — confirming your order. If it doesn't appear shortly, contact support with payment ID ${response.razorpay_payment_id}.`,
                { duration: 8000 }
              );
              clearCart();
              router.push('/');
            }
            setSubmitting(false);
          },
          modal: { ondismiss: () => setSubmitting(false) }
        });
        rzp.open();
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: orderItems,
            customer: { name: form.name, phone: form.phone, email: form.email },
            shippingAddress: form,
            couponCode: coupon,
            paymentMethod: 'cod'
          })
        });
        const data = await res.json();
        if (res.ok) { clearCart(); router.push(`/order-success/${data.order._id}`); }
        else { toast.error(data.error || 'Could not place order'); }
        setSubmitting(false);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const placeOrderDisabled = submitting || shippingLoading || checkingStock || shipping === null;

  // Only show the "add ₹X more for free shipping" banner when a free-shipping
  // threshold is actually configured (> 0) and the customer hasn't reached it.
  const amountToFreeShipping =
    freeShippingAbove !== null && freeShippingAbove > 0
      ? freeShippingAbove - discountedSubtotal
      : 0;
  const showFreeShippingBanner = shipping !== null && shipping > 0 && amountToFreeShipping > 0;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-14" style={{ background: PAPER }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <h1 className="text-[24px] sm:text-[28px]" style={{ fontFamily: FONT_SERIF, color: INK }}>
        Checkout
      </h1>
      <div className="mt-3 mb-8 h-[2px] w-12" style={{ background: GOLD }} />

      {showFreeShippingBanner && (
        <div
          className="text-sm py-3 px-4 mb-8"
          style={{ background: GOLD_WASH, color: INK, border: `1px solid ${LINE}`, borderLeft: `3px solid ${GOLD}`, borderRadius: '3px' }}
        >
          Add <strong style={{ color: GOLD_DEEP }}>{formatINR(amountToFreeShipping)}</strong> more to get{' '}
          <strong>free shipping</strong>
        </div>
      )}

      <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 md:items-start">

        {/* ── Left: shipping form ───────────────────────────────── */}
        <div>
          <h2 className={sectionHeadClass} style={{ fontFamily: FONT_SERIF, color: INK }}>Shipping details</h2>
          <div className="space-y-3">
            <SSRKInput placeholder="Full Name *" autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            <SSRKInput placeholder="Phone Number *" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            <SSRKInput placeholder="Email (optional)" type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            <SSRKInput placeholder="Address Line 1 *" autoComplete="address-line1" value={form.line1} onChange={(e) => update('line1', e.target.value)} />
            <SSRKInput placeholder="Address Line 2" autoComplete="address-line2" value={form.line2} onChange={(e) => update('line2', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="City *"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="State"
                autoComplete="address-level1"
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Pincode *"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                value={form.pincode}
                onChange={(e) => update('pincode', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Landmark"
                value={form.landmark}
                onChange={(e) => update('landmark', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ── Right: summary card (sticky on desktop) ───────────── */}
        <aside
          className="p-5 sm:p-6 md:sticky md:top-6"
          style={{ background: SURFACE, border: `1px solid ${LINE}`, borderTop: `3px solid ${GOLD}`, borderRadius: '3px' }}
        >
          <h2 className={sectionHeadClass} style={{ fontFamily: FONT_SERIF, color: INK }}>Order summary</h2>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1 gap-2" style={{ color: INK_SOFT }}>
                <span className="truncate">
                  {i.name} ({[i.color, i.size, i.sleeveType, i.zipType].filter(Boolean).join('/')}) ×{i.qty}
                </span>
                <span className="shrink-0" style={{ color: INK }}>{formatINR(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          {/* <div className="flex gap-2 mt-4">
            <input
              placeholder="Coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={applyCoupon}
              className="px-4 text-sm shrink-0 transition-colors hover:bg-[#F7F0D8]"
              style={{ border: `1px solid ${GOLD}`, color: GOLD_DEEP, background: PAPER, borderRadius: '3px' }}
            >
              Apply
            </button>
          </div> */}

          <div style={{ height: '1px', background: LINE }} className="my-4" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between" style={{ color: INK_SOFT }}>
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between" style={{ color: GOLD_DEEP }}>
                <span>Discount</span>
                <span>−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ color: INK_SOFT }}>
              <span>Shipping</span>
              <span>
                {shippingLoading
                  ? <span style={{ opacity: 0.6 }}>Calculating…</span>
                  : shipping === 0
                    ? <span style={{ color: GOLD_DEEP, fontWeight: 500 }}>Free</span>
                    : shipping !== null
                      ? formatINR(shipping)
                      : <span style={{ opacity: 0.6 }}>—</span>
                }
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline mt-3 pt-3 text-base" style={{ borderTop: `1px solid ${INK}` }}>
            <span style={{ color: INK }}>Total</span>
            <span className="text-xl" style={{ color: INK, fontFamily: FONT_SERIF }}>{total !== null ? formatINR(total) : '—'}</span>
          </div>

          {/* Payment method */}
          <div className="mt-6">
            <h2 className={sectionHeadClass} style={{ fontFamily: FONT_SERIF, color: INK }}>Payment method</h2>
            <label
              className="flex items-center gap-3 text-sm cursor-pointer px-4 py-3"
              style={{
                color: INK,
                background: PAPER,
                border: `1px solid ${paymentMethod === 'razorpay' ? GOLD : LINE}`,
                borderRadius: '3px',
              }}
            >
              <input
                type="radio"
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
                className="w-4 h-4"
                style={{ accentColor: INK }}
              />
              Pay Online (Cards / UPI / Netbanking)
            </label>
          </div>

          <button
            onClick={placeOrder}
            disabled={placeOrderDisabled}
            className="w-full mt-6 py-3.5 text-sm font-medium rounded-[4px] border transition-colors
                       bg-[#0A0A0A] text-white border-[#0A0A0A]
                       hover:bg-[#C9A227] hover:border-[#C9A227] hover:text-[#0A0A0A]
                       disabled:bg-[#D9D9D9] disabled:border-[#D9D9D9] disabled:text-[#7A7A7A] disabled:cursor-not-allowed
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227]"
          >
            {submitting
              ? (checkingStock ? 'Checking stock…' : 'Placing Order…')
              : shippingLoading
                ? 'Calculating shipping…'
                : total !== null
                  ? `Place Order — ${formatINR(total)}`
                  : 'Place Order'
            }
          </button>
        </aside>
      </div>
    </div>
  );
}