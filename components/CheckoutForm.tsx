'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Offer = {
  id: string;
  summary: string;
  price: { amount: number; currency: string };
};

export default function CheckoutForm({ offerId }: { offerId: string }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [firstName, setFirstName] = useState('Seshu');
  const [lastName, setLastName] = useState('Kumar');
  const [email, setEmail] = useState('dev@example.com');
  const [phone, setPhone] = useState('+91-00000-00000');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/flights/offers/${offerId}`);
      if (res.ok) setOffer(await res.json());
    })();
  }, [offerId]);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': String(Date.now()) },
        body: JSON.stringify({
          offerId,
          contact: { email, phone },
          passengers: [{ type: 'ADULT', firstName, lastName }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Booking failed');
      setMessage(`Booked: ${data.bookingId} (${data.status})`);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground">Confirm passenger details and finalize your mock booking.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Traveler</CardTitle>
            <CardDescription>Primary passenger details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={book} className="grid max-w-xl gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
              </div>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={loading}>{loading ? 'Booking…' : 'Confirm Booking'}</Button>
                {message && <Badge>{message}</Badge>}
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Offer details and total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {offer ? (
              <>
                <div className="font-semibold">{offer.summary}</div>
                <Badge variant="primary" className="w-fit">{offer.price.currency} {(offer.price.amount / 100).toFixed(2)}</Badge>
                <div className="text-sm text-muted-foreground">Operated by Mock Provider. Prototype only; no payments.</div>
              </>
            ) : (
              <Badge>Loading offer…</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
