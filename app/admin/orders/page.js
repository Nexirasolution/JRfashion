'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import { buildProductIndex, resolveOrderItem } from '@/lib/orderItemResolver';
import OrderItemModal from '@/components/admin/OrderItemModal';

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null); // { item, image, categoryName, productSku }

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Orders fetch failed (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  useEffect(() => {
    fetch('/api/products?limit=200')
      .then(async (r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(d.products || []))
      .catch((err) => console.error('Failed to load products', err));

    fetch('/api/categories')
      .then(async (r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => setCategories(d.categories || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  const index = useMemo(() => buildProductIndex(products), [products]);

  function catId(c) { return c?._id || c; }
  function parentId(c) {
    const full = categories.find((cat) => cat._id === catId(c));
    return full?.parent?._id || full?.parent || null;
  }

  // Resolve each order's items to categories once, for filtering + display
  const enrichedOrders = useMemo(() => {
    return orders.map((o) => {
      const resolvedItems = (o.items || []).map((item) => ({
        item,
        ...resolveOrderItem(item, index),
      }));
      const categoryIds = new Set(
        resolvedItems.map((r) => catId(r.category)).filter(Boolean)
      );
      return { ...o, resolvedItems, categoryIds };
    });
  }, [orders, index]);

  const filteredOrders = useMemo(() => {
    if (categoryFilter === 'all') return enrichedOrders;
    return enrichedOrders.filter((o) => {
      for (const cid of o.categoryIds) {
        if (cid === categoryFilter || parentId(cid) === categoryFilter) return true;
      }
      return false;
    });
  }, [enrichedOrders, categoryFilter]);

  function categoryName(catRef) {
    const cid = catId(catRef);
    return categories.find((c) => c._id === cid)?.name || catRef?.name || '';
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-magenta mb-5">Orders</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          placeholder="Search by order number, name, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          {categories.filter((c) => !c.parent).map((parent) => (
            <optgroup key={parent._id} label={parent.name}>
              <option value={parent._id}>{parent.name} (all)</option>
              {categories
                .filter((c) => (c.parent?._id || c.parent) === parent._id)
                .map((child) => (
                  <option key={child._id} value={child._id}>— {child.name}</option>
                ))}
            </optgroup>
          ))}
        </select>
        <button onClick={load} className="btn-outline text-sm">Search</button>
      </div>

      {loading ? (
        <p className="text-brand-ink/50">Loading...</p>
      ) : (
        <div className="card-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-brand-ink/10 text-brand-ink/50">
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Product SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o._id} className="border-b border-brand-ink/5">
                  <td className="p-3 font-medium">{o.orderNumber}</td>
                  <td className="p-3">{o.customer?.name}<br /><span className="text-xs text-brand-ink/50">{o.customer?.phone}</span></td>
                  <td className="p-3 max-w-[220px]">
                    <div className="flex flex-wrap gap-1">
                      {o.resolvedItems.map((r, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setModalItem({ item: r.item, image: r.image, categoryName: categoryName(r.category), productSku: r.product?.sku })
                          }
                          className="text-xs px-2 py-1 rounded-full bg-brand-ink/5 text-brand-ink/70 hover:bg-brand-magenta hover:text-white transition-colors"
                          title={[r.item.sku, r.item.sleeveType, r.item.zipType, r.item.pantOption?.name, r.item.shawlOption?.name].filter(Boolean).join(' · ') || r.item.name}
                        >
                          {r.item.name}
                          {(r.item.sleeveType || r.item.zipType || r.item.pantOption || r.item.shawlOption) && (
                            <span className="opacity-70"> · {[r.item.sleeveType, r.item.zipType, r.item.pantOption?.name, r.item.shawlOption?.name].filter(Boolean).join('/')}</span>
                          )}
                          {' '}x{r.item.qty}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-brand-ink/60 max-w-[160px] truncate" title={o.resolvedItems.map((r) => r.product?.sku || r.item.sku).filter(Boolean).join(', ')}>
                    {o.resolvedItems.map((r) => r.product?.sku || r.item.sku).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-3 text-xs text-brand-ink/60">
                    {[...o.categoryIds].map((cid) => categoryName(cid)).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-3">{formatINR(o.total)}</td>
                  <td className="p-3 capitalize">{o.paymentStatus}</td>
                  <td className="p-3 capitalize">{o.status}</td>
                  <td className="p-3 text-xs text-brand-ink/50">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3"><Link href={`/admin/orders/${o._id}`} className="text-brand-magenta font-medium">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <p className="text-center text-brand-ink/40 py-10">No orders found.</p>}
        </div>
      )}

      <OrderItemModal
        item={modalItem?.item}
        image={modalItem?.image}
        categoryName={modalItem?.categoryName}
        productSku={modalItem?.productSku}
        onClose={() => setModalItem(null)}
      />
    </div>
  );
}