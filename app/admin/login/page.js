'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Design tokens — same black/white/gold system as the rest of the site.
const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#DADADA';
const PAPER = '#FFFFFF';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      toast.error(data.error || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAPER }}>
      <form onSubmit={submit} className="w-full max-w-[340px]">
        <div className="text-center mb-8">
          <h1 className="text-xl font-medium" style={{ color: INK }}>
            JR Fashion
          </h1>
          <p className="text-xs mt-1.5" style={{ color: INK_SOFT }}>Admin sign in</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            required
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-transparent outline-none transition-colors"
            style={{ border: `1px solid ${LINE}`, borderRadius: '4px', color: INK }}
            onFocus={(e) => (e.target.style.borderColor = GOLD)}
            onBlur={(e) => (e.target.style.borderColor = LINE)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-transparent outline-none transition-colors"
            style={{ border: `1px solid ${LINE}`, borderRadius: '4px', color: INK }}
            onFocus={(e) => (e.target.style.borderColor = GOLD)}
            onBlur={(e) => (e.target.style.borderColor = LINE)}
          />
        </div>

        <button
          disabled={loading}
          className="w-full mt-5 py-2.5 text-sm font-medium transition-opacity active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: INK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: '4px' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}