import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';

// POST /api/cart/validate-stock
// body: { items: [{ productId, variantId, size, qty, name, pantOption, shawlOption }] }
//
// Re-checks each cart line against the live database (not the client's
// stale cart state) and reports any lines that are out of stock,
// insufficient in quantity, or no longer available at all — including
// their chosen pant/shawl add-on stock.
export async function POST(req) {
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];

  if (items.length === 0) {
    return NextResponse.json({ valid: true, issues: [] });
  }

  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const issues = [];

  for (const item of items) {
    const product = productMap.get(String(item.productId));

    if (!product || !product.isActive) {
      issues.push({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        name: item.name,
        reason: 'unavailable',
        availableStock: 0,
      });
      continue;
    }

    const variant = product.variants.find((v) => String(v._id) === String(item.variantId));
    if (!variant) {
      issues.push({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        name: item.name,
        reason: 'unavailable',
        availableStock: 0,
      });
      continue;
    }

    const sizeEntry = variant.sizes.find((s) => s.size === item.size);
    const sizeStock = sizeEntry?.stock || 0;

    const caps = [sizeStock];
    let addonUnavailable = false;

    if (item.pantOption?.id) {
      const pant = product.pantOptions?.find((p) => String(p._id) === String(item.pantOption.id));
      if (!pant) {
        addonUnavailable = true;
      } else {
        caps.push(pant.stock || 0);
      }
    }

    if (item.shawlOption?.id) {
      const shawl = product.shawlOptions?.find((s) => String(s._id) === String(item.shawlOption.id));
      if (!shawl) {
        addonUnavailable = true;
      } else {
        caps.push(shawl.stock || 0);
      }
    }

    if (addonUnavailable) {
      issues.push({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        name: item.name,
        reason: 'unavailable',
        availableStock: 0,
      });
      continue;
    }

    const available = Math.min(...caps);

    if (available <= 0) {
      issues.push({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        name: item.name,
        reason: 'out_of_stock',
        availableStock: 0,
      });
    } else if (item.qty > available) {
      issues.push({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        name: item.name,
        reason: 'insufficient_stock',
        availableStock: available,
      });
    }
  }

  return NextResponse.json({ valid: issues.length === 0, issues });
}