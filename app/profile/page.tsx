"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => { setUid(getCookie('uid')) }, [])

  async function signIn() {
    setLoading(true)
    await fetch('/api/dev-login?uid=demo_user')
    setUid('demo_user')
    setLoading(false)
  }
  async function signOut() {
    setLoading(true)
    await fetch('/api/dev-logout')
    setUid(null)
    setLoading(false)
  }

  return (
    <main className="space-y-6">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold">Your profile</h1>
        <p className="text-muted-foreground">Manage your account and traveler details for smoother bookings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Basic information for your session.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
                {(uid?.[0] || 'G').toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{uid || 'Guest'}</div>
                <div className="text-sm text-muted-foreground">{uid ? 'Demo session' : 'Not signed in'}</div>
              </div>
              {uid ? <Badge className="ml-auto">Demo</Badge> : null}
            </div>
            <div className="flex items-center gap-3">
              {uid ? (
                <Button variant="outline" onClick={signOut} disabled={loading}>Sign out</Button>
              ) : (
                <Button onClick={signIn} disabled={loading}>Sign in</Button>
              )}
              <span className="text-xs text-muted-foreground">Prototype auth. Replace with NextAuth later.</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Defaults used when searching and booking.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div>Seat: Any</div>
            <div>Bags: Carry-on</div>
            <div>Notifications: Enabled</div>
            <div className="text-xs">Editable settings coming soon.</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Traveler details</CardTitle>
            <CardDescription>Save travelers for faster checkout.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add passport and frequent flyer info here — coming soon.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
