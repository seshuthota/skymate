'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function SignInDemo() {
  const [uid, setUid] = useState<string | null>(null)
  useEffect(() => { setUid(getCookie('uid')) }, [])

  async function signIn() {
    await fetch('/api/dev-login?uid=demo_user')
    setUid('demo_user')
  }
  async function signOut() {
    await fetch('/api/dev-logout')
    setUid(null)
  }

  return (
    <div className="flex items-center gap-2">
      {uid ? <Badge className="hidden sm:flex">Signed in: {uid}</Badge> : null}
      {uid ? (
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      ) : (
        <Button onClick={signIn}>Sign in</Button>
      )}
    </div>
  )
}

