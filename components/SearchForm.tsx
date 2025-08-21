'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Offer = {
  id: string;
  summary: string;
  price: { amount: number; currency: string };
};

export default function SearchForm({ onResults }: { onResults: (offers: Offer[]) => void }) {
  const [origin, setOrigin] = useState('BLR');
  const [destination, setDestination] = useState('BOM');
  const [departDate, setDepartDate] = useState('2025-09-02');
  const [adults, setAdults] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, departDate, adults }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Search failed');
      onResults(data.offers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function quickSet(a: string, b: string) {
    setOrigin(a);
    setDestination(b);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <Label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Origin</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M2 16l20-6-9 9-2-5-5-2z" fill="currentColor"/></svg>
            </span>
            <Input
              className="h-11 rounded-lg pl-9"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="BLR"
              inputMode="text"
              aria-label="Origin IATA code"
              required
            />
          </div>
        </div>

        <div className="hidden items-end justify-center md:col-span-2 md:flex">
          <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Swap origin and destination">
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M7 7h11m0 0l-3-3m3 3l-3 3M17 17H6m0 0l3 3m-3-3l3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
          </Button>
        </div>

        <div className="md:col-span-5">
          <Label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Destination</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M2 8l20 6-9-9-2 5-5 2z" fill="currentColor"/></svg>
            </span>
            <Input
              className="h-11 rounded-lg pl-9"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              placeholder="BOM"
              inputMode="text"
              aria-label="Destination IATA code"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Depart</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M7 10h5m-8 7h16M3 7h18M7 3h2m6 0h2M7 3v4m8-4v4" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            </span>
            <Input
              className="h-11 rounded-lg pl-9"
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Adults</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            </span>
            <Input
              className="h-11 rounded-lg pl-9"
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value || '1'))}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading} className="h-11 px-5">
          {loading ? 'Searching…' : 'Search Flights'}
        </Button>
        {error && <span className="text-sm text-destructive">Error: {error}</span>}
        <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
          <Button type="button" variant="outline" size="sm" onClick={() => quickSet('BLR', 'BOM')}>BLR → BOM</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => quickSet('DEL', 'GOI')}>DEL → GOI</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => quickSet('SFO', 'SEA')}>SFO → SEA</Button>
        </div>
      </div>

      <div className="mt-1 text-xs text-muted-foreground">Tip: try BLR → BOM, DEL → GOI, or SFO → SEA.</div>
    </form>
  );
}
