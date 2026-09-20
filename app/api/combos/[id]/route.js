import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Combo from '@/models/Combo';
import { requireAdmin } from '@/lib/apiAuth';

export const PUT = requireAdmin(async (req, { params }) => {
  await dbConnect();
  const body = await req.json();

  // Same validation as POST — findByIdAndUpdate does NOT run schema
  // validators or these checks by default, so without this an edit could
  // silently save a combo with no colors/packOptions/price and the
  // storefront would render blank.
  if (!body.name) {
    return NextResponse.json({ error: 'Combo name is required' }, { status: 400 });
  }

  if (body.type === 'color-pack') {
    if (!body.baseProduct) {
      return NextResponse.json({ error: 'A base product is required for a color-pack combo' }, { status: 400 });
    }
    if (!Array.isArray(body.colors) || body.colors.length === 0) {
      return NextResponse.json({ error: 'Add at least one color' }, { status: 400 });
    }
    if (!Array.isArray(body.packOptions) || body.packOptions.length === 0) {
      return NextResponse.json({ error: 'Add at least one pack size option' }, { status: 400 });
    }
  } else if (!body.comboPrice) {
    return NextResponse.json({ error: 'Combo price is required' }, { status: 400 });
  }

  try {
    // runValidators: true — without it, Mongoose skips schema validation
    // on updates (required fields, casting) and can persist bad data.
    const combo = await Combo.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!combo) {
      return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
    }

    return NextResponse.json({ combo });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to update combo' }, { status: 400 });
  }
});

export const DELETE = requireAdmin(async (req, { params }) => {
  await dbConnect();
  const deleted = await Combo.findByIdAndDelete(params.id);

  if (!deleted) {
    return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});