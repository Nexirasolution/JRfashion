import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    storeName: { type: String },
    logo: { type: String },
    whatsapp: { type: String },
    instagram: { type: String },
    address: { type: String },

    // Weight-based shipping: admin sets the assumed weight of a single
    // piece (garment/unit) and a price per kg. Total order weight is
    // computed as (total piece count across the cart) * weightPerPiece,
    // then charged at pricePerKg, rounded up to the next whole kg.
    // See lib/shipping.js — the only place this is calculated.
    // `shippingFee` is legacy and no longer read by the shipping calculator.
    shippingFee: { type: Number, default: 0 },
    weightPerPiece: { type: Number, default: 0 }, // grams, per single piece
    pricePerKg: { type: Number, default: 0 }, // ₹ charged per kg (rounded up)

    // Flat fallback used whenever weight-based shipping can't be computed,
    // i.e. weightPerPiece or pricePerKg is 0.
    defaultShippingCharge: { type: Number, default: 0 },

    // Order subtotal (₹) at or above which shipping is free.
    // 0 means "free shipping disabled".
    freeShippingAbove: { type: Number, default: 0 },

    seoTitle: { type: String },
    seoDescription: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);