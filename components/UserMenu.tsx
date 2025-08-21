'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function UserMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setUid(getCookie('uid')) }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  async function signIn() {
    await fetch('/api/dev-login?uid=demo_user')
    setUid('demo_user')
  }

  async function signOut() {
    await fetch('/api/dev-logout')
    setUid(null)
    setOpen(false)
    router.push('/')
  }

  const initial = uid ? uid[0]?.toUpperCase() : null

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-secondary text-foreground shadow-sm transition-colors hover:opacity-90"
      >
        {uid ? (
          <span className="text-sm font-semibold">{initial}</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-80"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-9 9a9 9 0 1118 0" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border bg-popover p-1 text-sm shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-semibold">
              {initial || <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-80"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-9 9a9 9 0 1118 0" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{uid || 'Guest'}</div>
              <div className="text-xs text-muted-foreground">{uid ? 'Demo session' : 'Not signed in'}</div>
            </div>
            {uid ? <Badge className="ml-auto">Demo</Badge> : null}
          </div>
          <hr className="my-1 border-border/70" />

          <MenuItem onClick={() => { setOpen(false); router.push('/profile') }} icon={UserIcon}>Profile</MenuItem>
          <MenuItem onClick={() => { setOpen(false); router.push('/bookings') }} icon={TicketIcon}>Bookings</MenuItem>
          <MenuItem onClick={() => { setOpen(false); router.push('/') }} icon={HomeIcon}>Home</MenuItem>
          <MenuItem onClick={() => { setOpen(false); router.push('/settings') }} icon={SettingsIcon}>Settings</MenuItem>

          <hr className="my-1 border-border/70" />
          {uid ? (
            <MenuItem onClick={signOut} icon={SignOutIcon} variant="destructive">Sign out</MenuItem>
          ) : (
            <MenuItem onClick={signIn} icon={SignInIcon}>Sign in</MenuItem>
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({ children, onClick, icon: Icon, variant }: { children: React.ReactNode; onClick: () => void; icon: (props: any) => JSX.Element; variant?: 'destructive' | 'default' }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary ${variant === 'destructive' ? 'text-destructive' : ''}`}
    >
      <Icon className="h-4 w-4 opacity-80" />
      <span className="truncate">{children}</span>
    </button>
  )
}

function UserIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-9 9a9 9 0 1118 0" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
function TicketIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M3 8h18v4a2 2 0 010 4v4H3v-4a2 2 0 010-4V8zM8 8v8m8-8v8" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
function HomeIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
function SettingsIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M10.5 3h3l.6 2.4a7.97 7.97 0 012.4 1.4L19 6l2 3-1.8 1a7.97 7.97 0 010 2L21 13l-2 3-2.5-.8a7.97 7.97 0 01-2.4 1.4L13.5 19h-3l-.6-2.4a7.97 7.97 0 01-2.4-1.4L5 16l-2-3 1.8-1a7.97 7.97 0 010-2L3 7l2-3 2.5.8a7.97 7.97 0 012.4-1.4L10.5 3z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
function SignOutIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M16 17l5-5-5-5M21 12H9m3 9H5a2 2 0 01-2-2V5a2 2 0 012-2h7" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
function SignInIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M8 7l-5 5 5 5M3 12h12m-3-9h7a2 2 0 012 2v14a2 2 0 01-2 2h-7" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
