import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema(
  {
    color: { type: String, default: '' },
    colorHex: { type: String, default: '#000000' },
    images: [{ type: String }],
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: 0 },

    sizes: [
      {
        size: { type: String, required: true },
        stock: { type: Number, default: 0 },
        sku: { type: String }
      }
    ]
  },
  { _id: true }
);

// A single named add-on option (e.g. "Cotton Palazzo", "Bandhani Shawl").
// `price` is an ADDITIONAL amount added on top of the variant price when
// this option is picked — not a standalone price.
const AddonOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: '' }
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    fabric: { type: String, default: '' },
    tags: [{ type: String }],
    variants: [VariantSchema],

    // One or more optional size chart images. If empty, the storefront
    // falls back to this product's category.sizeChart instead.
    sizeChart: [{ type: String }],

    // Product-level (not per-variant) sleeve/zip options. Admin picks which
    // of these apply to this product; if a product has any sleeveOptions,
    // the customer must pick one on the PDP before adding to cart. Same
    // for zipOptions. Products where these don't apply (sarees, dupattas,
    // jewellery, etc) simply leave these empty and no selector is shown.
    sleeveOptions: [{ type: String, enum: ['Full Sleeve', 'Half Sleeve', 'Elbow Sleeve', 'Sleeveless'] }],
    zipOptions: [{ type: String, enum: ['With Zip', 'Without Zip'] }],

    // Optional add-ons — admin can add any number of named pant/shawl
    // options, each with its own image, extra price, and stock. Customer
    // picks at most one of each (or none, i.e. "without pant"/"without
    // shawl"). Empty array = no selector shown on the storefront.
    pantOptions: [AddonOptionSchema],
    shawlOptions: [AddonOptionSchema],

    // When true, the storefront shows a highlighted "Ready to Ship" badge
    // below the product title.
    isReadyToShip: { type: Boolean, default: false },

    basePrice: { type: Number, required: true }, // used for listing/sorting
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isBestSeller: { type: Boolean, default: false },
    isTopSeller: { type: Boolean, default: false },
    isActiveSeller: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);