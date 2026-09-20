import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Review from '@/models/Review';
import { requireAdmin } from '@/lib/apiAuth';

function getFilter(id) {
  return mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
}

export async function GET(req, { params }) {
  await dbConnect();

  // Added `sizeChart` to the category populate — the product detail page
  // falls back to product.category.sizeChart when the product itself has
  // no size chart of its own. Without this field selected here, that
  // fallback is always undefined even if the category has one saved.
  const product = await Product.findOne({
    ...getFilter(params.id),
    isActive: true,
  }).populate('category', 'name slug sizes type sizeChart');

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const reviews = await Review.find({ product: product._id, isApproved: true }).sort({ createdAt: -1 });

  const related = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(8)
    .select('name slug basePrice variants rating')
    .populate('category', 'name slug type sizeChart'); // kept consistent, though ProductCard doesn't use it today

  return NextResponse.json({ product, reviews, related });
}

export const PUT = requireAdmin(async (req, { params }) => {
  await dbConnect();
  const body = await req.json();

  const current = await Product.findOne(getFilter(params.id)).select('_id category sku');
  if (!current) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // SKU is auto-managed and permanently locked after creation — it is never
  // regenerated or overwritten on update, even if the category changes.
  // Any sku value the client sends is ignored.
  delete body.sku;

  if (body.variants?.length) {
    body.basePrice = Math.min(...body.variants.map((v) => v.price));
  }

  // body already carries sizeChart / isReadyToShip / sleeveOptions /
  // zipOptions / pantOptions / shawlOptions when the admin form sends them
  // — findOneAndUpdate persists whatever fields are present on body, so no
  // extra handling is required here as long as the Product schema
  // (models/Product.js) actually defines these paths.
  const product = await Product.findOneAndUpdate(getFilter(params.id), body, { new: true });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ product });
});

export const DELETE = requireAdmin(async (req, { params }) => {
  await dbConnect();
  await Product.findOneAndDelete(getFilter(params.id));
  return NextResponse.json({ success: true });
});