'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';

// White, black and gold palette (matches the invoice page)
const PAPER = '#FFFFFF';
const BLACK = '#000000';
const GREY = '#5E5E5E';        // secondary text on white
const LINE = '#E7E2D6';        // hairlines
const GOLD = '#C9A24B';        // rules and accents
const GOLD_DEEP = '#8C6A12';   // gold text on white (readable contrast)
const GOLD_BRIGHT = '#E0BC5F'; // gold on black
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order));
  }, [id]);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-sm" style={{ color: GREY }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center" style={{ background: PAPER }}>
      <div
        className="inline-flex items-center justify-center w-16 h-16 mb-5"
        style={{ background: BLACK, borderRadius: '50%', boxShadow: `0 0 0 3px ${PAPER}, 0 0 0 4px ${GOLD}` }}
      >
        <CheckCircle2 size={30} strokeWidth={1.5} style={{ color: GOLD_BRIGHT }} />
      </div>

      <h1 className="text-[24px] sm:text-[28px]" style={{ fontFamily: FONT_SERIF, color: BLACK }}>
        Order placed successfully
      </h1>

      <div className="mt-6 pt-6 max-w-xs mx-auto space-y-2" style={{ borderTop: `1px solid ${GOLD}` }}>
        <p className="text-sm" style={{ color: GREY }}>
          Order Number <span style={{ color: BLACK }}>— {order.orderNumber}</span>
        </p>
        <p className="text-sm" style={{ color: GREY }}>
          Total <span className="font-medium" style={{ color: GOLD_DEEP }}>— {formatINR(order.total)}</span>
        </p>
      </div>

      <p className="text-xs mt-5" style={{ color: GREY }}>
        We&rsquo;ll send updates to {order.customer?.phone}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
        <Link
          href={`/invoice/${order._id}`}
          className="px-6 py-3 text-sm font-medium transition-opacity active:opacity-70"
          style={{ border: `1px solid ${BLACK}`, color: BLACK, background: PAPER, borderRadius: '4px' }}
        >
          View Invoice
        </Link>
        <Link
          href="/"
          className="px-6 py-3 text-sm font-medium transition-opacity active:opacity-80"
          style={{ background: BLACK, color: GOLD_BRIGHT, border: `1px solid ${BLACK}`, borderRadius: '4px' }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}