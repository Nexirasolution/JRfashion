'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatINR } from '@/lib/utils';
import { IndianRupee, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

// Design tokens — same black/white/gold system as the rest of the site.
const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

// Replaces the old `card-soft` utility so the dashboard doesn't depend on
// the previous theme's CSS.
const CARD = { background: PAPER, border: `1px solid ${LINE}`, borderRadius: '4px' };

// `highlight` flips the icon tile to gold — used for the card that needs action.
function StatCard({ icon: Icon, label, value, sub, highlight = false }) {
  return (
    <div className="p-4 flex items-center gap-3" style={CARD}>
      <div
        className="p-3"
        style={{ background: highlight ? GOLD : INK, borderRadius: '4px' }}
      >
        <Icon size={20} style={{ color: highlight ? INK : GOLD }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: INK_SOFT }}>{label}</p>
        <p className="font-bold text-lg" style={{ color: INK }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: INK_SOFT }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/dashboard')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Request failed with status ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p style={{ color: INK_SOFT }}>Loading dashboard...</p>;
  }

  // Error state keeps red on purpose — it's a status color, not a brand color.
  if (error) {
    return (
      <div className="p-5 border border-red-200 bg-red-50" style={{ borderRadius: '4px' }}>
        <p className="text-red-600 font-medium mb-1">Failed to load dashboard</p>
        <p className="text-sm text-red-500">{error}</p>
        <p className="text-xs mt-2" style={{ color: INK_SOFT }}>
          If this says "Unauthorized", your admin session may have expired — try logging in again.
        </p>
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: INK_SOFT }}>No dashboard data available.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ color: INK, fontFamily: FONT_SERIF }}>
        Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={IndianRupee}
          label="Today's Sales"
          value={formatINR(data.today?.sales ?? 0)}
          sub={`${data.today?.orders ?? 0} orders`}
        />
        <StatCard
          icon={IndianRupee}
          label="Weekly Sales"
          value={formatINR(data.week?.sales ?? 0)}
          sub={`${data.week?.orders ?? 0} orders`}
        />
        <StatCard
          icon={IndianRupee}
          label="Monthly Sales"
          value={formatINR(data.month?.sales ?? 0)}
          sub={`${data.month?.orders ?? 0} orders`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Pending Orders"
          value={data.pendingOrders ?? 0}
          sub="Need action"
          highlight
        />
      </div>

      <div className="p-5 mb-6" style={CARD}>
        <h2 className="font-semibold mb-4" style={{ color: INK }}>Sales Trend (Last 14 Days)</h2>
        {data.trend?.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE} />
              <XAxis dataKey="date" fontSize={12} stroke={INK_SOFT} />
              <YAxis fontSize={12} stroke={INK_SOFT} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke={GOLD}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: INK, stroke: GOLD }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm" style={{ color: INK_SOFT }}>No trend data available.</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-5" style={CARD}>
          <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: INK }}>
            <Package size={18} style={{ color: GOLD }} /> Top Selling Products
          </h2>
          {data.topProducts?.length ? (
            <ul className="space-y-2">
              {data.topProducts.map((p) => (
                <li key={p._id} className="flex justify-between text-sm" style={{ color: INK }}>
                  <span>{p.name}</span>
                  <span className="font-medium">{p.soldCount} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: INK_SOFT }}>No product data yet.</p>
          )}
        </div>

        <div className="p-5" style={CARD}>
          <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: INK }}>
            <AlertTriangle size={18} style={{ color: GOLD }} /> Low Stock Alert
          </h2>
          {!data.lowStock || data.lowStock.length === 0 ? (
            <p className="text-sm" style={{ color: INK_SOFT }}>All good — no low stock items.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStock.map((p) => (
                <li key={p._id} className="text-sm" style={{ color: INK }}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}