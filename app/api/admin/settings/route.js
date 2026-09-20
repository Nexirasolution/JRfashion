export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { requireAdmin } from '@/lib/apiAuth';
import { calculateShipping } from '@/lib/shipping';

export async function GET() {
  await dbConnect();
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) settings = await Settings.create({ key: 'global' });
  return NextResponse.json({ settings });
}

export const PUT = requireAdmin(async (req) => {
  await dbConnect();
  const body = await req.json();
  const settings = await Settings.findOneAndUpdate({ key: 'global' }, body, { new: true, upsert: true });
  return NextResponse.json({ settings });
});

// POST /api/admin/settings — used by checkout to calculate shipping.
// Body: { subtotal, totalQty }
//   subtotal — cart subtotal in ₹ (after discount), used only to check the
//              free-shipping threshold.
//   totalQty — total number of pieces in the cart (sum of each line's qty),
//              used to compute the order's total weight.
//
// The calculation lives in lib/shipping.js and is shared with
// buildOrderItemsAndTotals, so the checkout page and the Razorpay amount
// always agree.
export async function POST(req) {
  try {
    const { subtotal, totalQty } = await req.json();

    await dbConnect();
    const settings = await Settings.findOne({ key: 'global' }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 500 });
    }

    return NextResponse.json(calculateShipping(settings, { subtotal, totalQty }));
  } catch (err) {
    console.error('Shipping calculate error:', err);
    return NextResponse.json({ error: 'Could not calculate shipping' }, { status: 500 });
  }
}