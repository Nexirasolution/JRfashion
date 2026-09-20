import ProductCard from '@/components/ProductCard';
import Filters from '@/components/Filters';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import '@/models/Category'; // registers the Category schema — required for .populate('category')

export const dynamic = 'force-dynamic'; // never cache/statically render this page

// White, black and gold palette (matches the other pages)
const PAPER = '#FFFFFF';
const BLACK = '#000000';
const GREY = '#5E5E5E';      // secondary text on white
const GOLD = '#C9A24B';      // rules and accents
const GOLD_DEEP = '#8C6A12'; // gold text on white (readable contrast)
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

const SORT_MAP = {
  newest: { createdAt: -1 },
  priceLow: { basePrice: 1 },
  priceHigh: { basePrice: -1 },
  popular: { soldCount: -1 },
  rating: { rating: -1 },
};

async function getAllProducts(sort) {
  await dbConnect();

  const query = { isActive: true };
  const sortStage = SORT_MAP[sort] || SORT_MAP.newest;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug type')
      .sort(sortStage)
      .lean(), // no skip/limit — fetch everything
    Product.countDocuments(query),
  ]);

  return {
    products: JSON.parse(JSON.stringify(products)), // strip Mongoose/ObjectId wrappers for the client
    total,
  };
}

export const metadata = {
  title: 'All Products | Mohith Trends',
};

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams; // Next.js 15: searchParams is a Promise

  const sort = resolvedSearchParams?.sort || 'newest';

  const { products, total } = await getAllProducts(sort);

  return (
    <section className="max-w-6xl mx-auto px-5 py-16" style={{ background: PAPER }}>
      <div
        className="mb-8 pb-5 flex items-baseline justify-between flex-wrap gap-3"
        style={{ borderBottom: `1px solid ${GOLD}` }}
      >
        <h1
          className="text-3xl sm:text-4xl tracking-tight"
          style={{ fontFamily: FONT_SERIF, color: BLACK, fontWeight: 400 }}
        >
          All Products
        </h1>
        <span className="text-xs tracking-wide" style={{ color: GOLD_DEEP }}>
          {total} {total === 1 ? 'item' : 'items'}
        </span>
      </div>

      <Filters sort={sort} />

      {products.length === 0 ? (
        <p className="text-sm" style={{ color: GREY }}>
          Nothing here yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10 mt-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}