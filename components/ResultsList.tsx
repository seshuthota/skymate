'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Offer = {
  id: string;
  summary: string;
  price: { amount: number; currency: string };
};

export default function ResultsList({ offers }: { offers: Offer[] }) {
  const router = useRouter();
  if (!offers?.length) return null;
  return (
    <div className="mt-6 rounded-2xl border bg-card/60 p-4 shadow-sm sm:p-5">
      <div className="mb-3 text-lg font-semibold">Results</div>
      <ul className="grid gap-3">
        {offers.map((o) => (
          <li key={o.id} className="group flex items-center justify-between gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md">
            <div className="min-w-0">
              <div className="truncate font-semibold">{o.summary}</div>
              <div className="text-sm text-muted-foreground">Mock Provider • Prototype data</div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge variant="primary" className="px-3 py-1 text-sm font-semibold">
                {o.price.currency} {(o.price.amount / 100).toFixed(2)}
              </Badge>
              <Button onClick={() => router.push(`/checkout?offerId=${encodeURIComponent(o.id)}`)} className="h-9">
                Book
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
