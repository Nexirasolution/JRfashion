export const dynamic = 'force-dynamic';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import { formatINR } from '@/lib/utils';
import PrintButton from '@/components/PrintButton';

// White, black and gold palette
const PAPER = '#FFFFFF';
const BLACK = '#000000';
const GREY = '#5E5E5E';        // secondary text on white
const LINE = '#E7E2D6';        // hairlines between rows
const GOLD = '#C9A24B';        // rules and decorative accents
const GOLD_DEEP = '#8C6A12';   // gold text on white (readable contrast)
const GOLD_BRIGHT = '#E0BC5F'; // gold text on black
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

// Keeps black/gold blocks visible when the invoice is printed
const KEEP_COLORS = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };

export default async function InvoicePage({ params }) {
  await dbConnect();
  const order = await Order.findById(params.orderId).lean();
  const settings = await Settings.findOne({ key: 'global' }).lean();

  if (!order) {
    return <div className="p-10 text-center text-sm" style={{ color: GREY }}>Invoice not found.</div>;
  }

  const storeName = settings?.storeName || 'Tirupur Clothing Hub';

  return (
    <div className="max-w-2xl mx-auto p-8 sm:p-10" style={{ background: PAPER, color: BLACK }}>
      {/* Header */}
      <div style={{ borderTop: `4px solid ${BLACK}`, ...KEEP_COLORS }}>
        <div style={{ borderTop: `1px solid ${GOLD}`, marginTop: 3 }} />
      </div>

      <div className="flex justify-between items-start pt-6 pb-6 mb-6" style={{ borderBottom: `1px solid ${LINE}` }}>
        <div>
          <h1 className="text-[24px] leading-tight" style={{ fontFamily: FONT_SERIF, color: BLACK }}>
            {storeName}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: GREY }}>{settings?.address || 'Tamil Nadu'}</p>
          <p className="text-sm" style={{ color: GREY }}>WhatsApp: +{settings?.whatsapp}</p>
        </div>
        <div className="text-right">
          <h2 className="text-[28px] leading-none" style={{ fontFamily: FONT_SERIF, color: GOLD_DEEP }}>Invoice</h2>
          <p className="text-sm mt-2 font-medium" style={{ color: BLACK }}>{order.orderNumber}</p>
          <p className="text-sm" style={{ color: GREY }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Billing + payment */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div className="pl-3" style={{ borderLeft: `2px solid ${GOLD}` }}>
          <p className="text-sm font-semibold mb-1.5" style={{ color: BLACK }}>Billed to</p>
          <p style={{ color: BLACK }}>{order.customer?.name}</p>
          <p style={{ color: GREY }}>{order.customer?.phone}</p>
          <p style={{ color: GREY }}>{order.shippingAddress?.line1}, {order.shippingAddress?.line2}</p>
          <p style={{ color: GREY }}>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
        </div>
        <div className="pl-3" style={{ borderLeft: `2px solid ${GOLD}` }}>
          <p className="text-sm font-semibold mb-1.5" style={{ color: BLACK }}>Payment</p>
          <p style={{ color: GREY }}>Method: <span style={{ color: BLACK }}>{order.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}</span></p>
          <p style={{ color: GREY }}>Status: <span style={{ color: BLACK }}>{order.paymentStatus}</span></p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr style={{ borderBottom: `2px solid ${BLACK}` }} className="text-left">
            <th className="py-2.5 text-sm font-semibold" style={{ color: BLACK }}>Item</th>
            <th className="py-2.5 text-sm font-semibold" style={{ color: BLACK }}>Color/Size</th>
            <th className="py-2.5 text-right text-sm font-semibold" style={{ color: BLACK }}>Price</th>
            <th className="py-2.5 text-right text-sm font-semibold" style={{ color: BLACK }}>Qty</th>
            <th className="py-2.5 text-right text-sm font-semibold" style={{ color: BLACK }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td className="py-3" style={{ color: BLACK }}>{item.name}</td>
              <td className="py-3" style={{ color: GREY }}>{item.color}/{item.size}</td>
              <td className="py-3 text-right" style={{ color: GREY }}>{formatINR(item.price)}</td>
              <td className="py-3 text-right" style={{ color: GREY }}>{item.qty}</td>
              <td className="py-3 text-right font-medium" style={{ color: BLACK }}>{formatINR(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 text-sm">
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between" style={{ color: GREY }}>
              <span>Subtotal</span><span style={{ color: BLACK }}>{formatINR(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between" style={{ color: GOLD_DEEP }}>
                <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                <span>-{formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ color: GREY }}>
              <span>Shipping</span>
              <span style={{ color: BLACK }}>{order.shippingFee === 0 ? 'Free' : formatINR(order.shippingFee)}</span>
            </div>
          </div>

          <div
            className="flex justify-between items-center text-base mt-3 px-4 py-3"
            style={{ background: BLACK, color: GOLD_BRIGHT, fontFamily: FONT_SERIF, ...KEEP_COLORS }}
          >
            <span>Total</span><span className="text-lg">{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-5 text-center" style={{ borderTop: `1px solid ${GOLD}` }}>
        <p className="text-xs" style={{ color: GREY }}>
          Thank you for shopping with {storeName}
        </p>
      </div>

      <div className="mt-6">
        <PrintButton />
      </div>
    </div>
  );
}