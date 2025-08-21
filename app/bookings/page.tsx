"use client";

import { useEffect, useState } from 'react';

type Booking = {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  segments: { origin: string; destination: string; departAt: string }[];
};

export default function BookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/bookings');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load');
        setItems(data.items || []);
      } catch (e: any) {
        setError(e.message);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <main className="space-y-4">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold">Your bookings</h1>
        <p className="text-muted-foreground">All bookings created with the mock provider.</p>
      </div>
      <div className="rounded-lg border p-4 shadow-sm">
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-red-500">Error: {error}</div>}
        {!loading && !items.length && <div className="text-sm text-muted-foreground">No bookings yet</div>}
        <div className="mt-3 grid gap-3">
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-semibold">{b.segments?.[0]?.origin} → {b.segments?.[0]?.destination}</div>
                <div className="text-sm text-muted-foreground">{new Date(b.createdAt).toLocaleString()} • {b.status}</div>
              </div>
              <div className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                {b.currency} {(b.totalAmount / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
