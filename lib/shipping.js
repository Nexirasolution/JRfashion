// Single source of truth for shipping.
// Used by BOTH:
//   - POST /api/admin/settings   (checkout page shipping estimate)
//   - buildOrderItemsAndTotals   (amount charged through Razorpay / stored on the order)
// so the total shown on the checkout page and the amount Razorpay charges
// can never disagree.
//
// Rules:
//   1. If weightPerPiece > 0 AND pricePerKg > 0 -> weight-based:
//        totalWeight = totalQty * weightPerPiece (grams)
//        billable kg = ceil(totalWeight / 1000), minimum 1 kg (0 if cart is empty)
//        cost = billable kg * pricePerKg
//   2. Otherwise fall back to the flat defaultShippingCharge.
//   3. If freeShippingAbove > 0 and subtotal >= freeShippingAbove -> free.
//      A threshold of 0 / unset means "free shipping disabled".
export function calculateShipping(settings, { subtotal, totalQty }) {
  const weightPerPiece = Number(settings?.weightPerPiece) || 0; // grams
  const pricePerKg = Number(settings?.pricePerKg) || 0;
  const freeShippingAbove = Number(settings?.freeShippingAbove) || 0;
  const defaultShippingCharge = Number(settings?.defaultShippingCharge) || 0;
  const qty = Number(totalQty) || 0;

  const weightConfigured = weightPerPiece > 0 && pricePerKg > 0;

  let totalWeightGrams = 0;
  let billableKg = 0;
  let baseCost;

  if (weightConfigured) {
    totalWeightGrams = qty * weightPerPiece;
    billableKg = qty > 0 ? Math.max(1, Math.ceil(totalWeightGrams / 1000)) : 0;
    baseCost = billableKg * pricePerKg;
  } else {
    baseCost = defaultShippingCharge;
  }

  const isFree = freeShippingAbove > 0 && Number(subtotal) >= freeShippingAbove;

  return {
    shippingCost: isFree ? 0 : baseCost,
    freeShippingAbove,
    weightPerPiece,
    pricePerKg,
    defaultShippingCharge,
    totalWeightGrams,
    billableKg,
    usedFallback: !weightConfigured
  };
}