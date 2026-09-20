import mongoose from 'mongoose';
import Product from '@/models/Product';
import Combo from '@/models/Combo';
import Coupon from '@/models/Coupon';
import Settings from '@/models/Settings';
import { genCouponCheck } from '@/lib/utils';
import { calculateShipping } from '@/lib/shipping';

export class OrderError extends Error {}

// Pure read-only pricing + validation. Does NOT touch stock or coupon usage —
// safe to call twice (once for the Razorpay amount, once at final order creation).
export async function buildOrderItemsAndTotals(items, couponCode) {
  let subtotal = 0;
  const orderItems = [];
  const stockUpdateItems = [];

  for (const item of items) {
    if (item.isCombo === true && item.comboId) {
      if (!mongoose.Types.ObjectId.isValid(item.comboId)) continue;

      const combo = await Combo.findById(item.comboId);
      if (!combo || !combo.isActive) {
        throw new OrderError(`This combo is no longer available`);
      }

      for (const sub of combo.products) {
        const subProduct = await Product.findById(sub.product);
        const subVariant = subProduct?.variants.id(sub.variantId);
        const subSizeEntry = subVariant?.sizes.find((s) => s.size === sub.size);
        if (!subProduct || !subVariant || !subSizeEntry || subSizeEntry.stock < item.qty) {
          throw new OrderError(`Combo "${combo.name}" is out of stock`);
        }
      }

      subtotal += combo.comboPrice * item.qty;
      orderItems.push({
        product: null,
        comboId: combo._id,
        name: combo.name,
        sku: combo.sku || '',
        image: combo.image || '',
        color: '',
        size: '',
        sleeveType: '',
        zipType: '',
        pantOption: null,
        shawlOption: null,
        price: combo.comboPrice,
        qty: item.qty,
        isCombo: true
      });
      stockUpdateItems.push({ isCombo: true, comboProducts: combo.products, qty: item.qty });
      continue;
    }

    if (!mongoose.Types.ObjectId.isValid(item.productId) || !mongoose.Types.ObjectId.isValid(item.variantId)) {
      continue;
    }

    const product = await Product.findById(item.productId);
    if (!product) continue;
    const variant = product.variants.id(item.variantId);
    if (!variant) continue;
    const sizeEntry = variant.sizes.find((s) => s.size === item.size);
    if (!sizeEntry || sizeEntry.stock < item.qty) {
      throw new OrderError(`${product.name} (${variant.color}, ${item.size}) is out of stock`);
    }

    // Sleeve/zip are product-level options. If the product defines any,
    // the customer must have picked one — enforced server-side too, since
    // the client-side selector can't be trusted alone.
    const sleeveType = item.sleeveType || '';
    const zipType = item.zipType || '';

    if (product.sleeveOptions?.length) {
      if (!sleeveType || !product.sleeveOptions.includes(sleeveType)) {
        throw new OrderError(`${product.name} — please select a valid sleeve type`);
      }
    }
    if (product.zipOptions?.length) {
      if (!zipType || !product.zipOptions.includes(zipType)) {
        throw new OrderError(`${product.name} — please select a valid zip type`);
      }
    }

    // Pant / Shawl are optional product-level add-ons. Unlike sleeve/zip,
    // they are never mandatory even when the product has options configured
    // — "None" is always valid. If the client DID send a selection, it must
    // resolve to a real, in-stock option on this product; a stale or
    // tampered id is rejected rather than silently dropped, since that
    // could let someone add a paid add-on for free.
    let pantOption = null;
    if (item.pantOption?.id) {
      const opt = product.pantOptions?.id(item.pantOption.id);
      if (!opt) {
        throw new OrderError(`${product.name} — selected pant option is no longer available`);
      }
      if (opt.stock < item.qty) {
        throw new OrderError(`${product.name} — ${opt.name} (pant) is out of stock`);
      }
      pantOption = opt;
    }

    let shawlOption = null;
    if (item.shawlOption?.id) {
      const opt = product.shawlOptions?.id(item.shawlOption.id);
      if (!opt) {
        throw new OrderError(`${product.name} — selected shawl option is no longer available`);
      }
      if (opt.stock < item.qty) {
        throw new OrderError(`${product.name} — ${opt.name} (shawl) is out of stock`);
      }
      shawlOption = opt;
    }

    const addonPrice = (pantOption?.price || 0) + (shawlOption?.price || 0);
    const unitPrice = variant.price + addonPrice;

    subtotal += unitPrice * item.qty;
    orderItems.push({
      product: product._id,
      name: product.name,
      sku: sizeEntry.sku || product.sku || '',
      image: variant.images?.[0] || '',
      color: variant.color,
      size: item.size,
      sleeveType,
      zipType,
      pantOption: pantOption
        ? { optionId: pantOption._id, name: pantOption.name, image: pantOption.image || '', price: pantOption.price, sku: pantOption.sku || '' }
        : null,
      shawlOption: shawlOption
        ? { optionId: shawlOption._id, name: shawlOption.name, image: shawlOption.image || '', price: shawlOption.price, sku: shawlOption.sku || '' }
        : null,
      price: unitPrice,
      qty: item.qty
    });
    stockUpdateItems.push({
      isCombo: false,
      productId: item.productId,
      variantId: item.variantId,
      size: item.size,
      pantOptionId: pantOption?._id || null,
      shawlOptionId: shawlOption?._id || null,
      qty: item.qty
    });
  }

  if (!orderItems.length) throw new OrderError('No valid items in cart');

  let discount = 0;
  let appliedCoupon = '';
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: genCouponCheck(couponCode), isActive: true });
    if (coupon && subtotal >= (coupon.minOrderValue || 0)) {
      if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          appliedCoupon = coupon.code;
        }
      }
    }
  }

  // Shipping uses the SAME function as the checkout page's estimate route
  // (POST /api/admin/settings), so both always produce the same number.
  const settings = await Settings.findOne({ key: 'global' }).lean();
  const totalQty = orderItems.reduce((sum, i) => sum + (i.qty || 0), 0);
  const discountedSubtotal = subtotal - discount;
  const { shippingCost: shippingFee } = calculateShipping(settings, {
    subtotal: discountedSubtotal,
    totalQty
  });
  const total = Math.round(discountedSubtotal + shippingFee);

  return { orderItems, stockUpdateItems, subtotal, discount, appliedCoupon, shippingFee, total };
}