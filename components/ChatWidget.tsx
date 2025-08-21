"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatWidget({ provider, model }: { provider?: string; model?: string }) {
  const STORAGE_KEY = 'chat_widget_messages'
  const MAX_MESSAGES = 20

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! I can answer questions about SkyMate. Ask about searching flights, bookings, or profiles.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toolStatus, setToolStatus] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Persist conversation locally per-session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: Msg[] = JSON.parse(raw)
        setMessages(parsed.slice(-MAX_MESSAGES))
      }
    } catch {}
  }, [])
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES))) } catch {}
  }, [messages])

  function clearChat() {
    const init: Msg[] = [{ role: 'assistant', content: 'Chat cleared. How can I help?' }]
    setMessages(init)
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(init)) } catch {}
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    const next = [...messages, { role: 'user' as const, content: text }].slice(-MAX_MESSAGES)
    setMessages(next)
    setLoading(true)
    setToolStatus(null)
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      if (!reader) throw new Error('No stream')
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let idx
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 1)
          if (!line) continue
          try {
            const evt = JSON.parse(line)
            if (evt.event === 'tool') {
              const names: string[] = evt.calls || []
              const label = names
                .map((n) => (
                  n === 'get_user_profile' ? 'profile'
                  : n === 'list_user_bookings' ? 'bookings'
                  : n === 'get_next_flight' ? 'next flight'
                  : n === 'search_flights' ? 'flight search'
                  : n
                ))
                .join(', ')
              setToolStatus(`Fetching ${label}…`)
            } else if (evt.event === 'message') {
              const reply = (evt?.message?.content as string) || 'Sorry, I could not get a response.'
              setMessages((m) => [...m, { role: 'assistant', content: reply }].slice(-MAX_MESSAGES))
              setToolStatus(null)
            } else if (evt.event === 'error') {
              setMessages((m) => [...m, { role: 'assistant', content: 'Error: ' + (evt.message || 'unknown') }].slice(-MAX_MESSAGES))
              setToolStatus(null)
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'There was an error contacting the assistant.' }].slice(-MAX_MESSAGES))
      setToolStatus(null)
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 10)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Panel */}
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm rounded-2xl border bg-card/90 p-3 shadow-xl backdrop-blur md:p-4">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ChatIcon className="h-3.5 w-3.5" />
              </span>
              <div className="text-sm font-semibold">SkyMate Assistant</div>
            </div>
            <div className="flex items-center gap-1">
              <button aria-label="Clear chat" onClick={clearChat} className="rounded-md p-1 text-xs text-muted-foreground hover:bg-secondary">
                Clear
              </button>
              <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-secondary">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="max-h-[50vh] overflow-y-auto pr-1">
            <ul className="grid gap-2">
              {messages.map((m, i) => (
                <li key={i} className={m.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}>
                  <div className={
                    'rounded-2xl border p-2.5 text-sm shadow-sm ' +
                    (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')
                  }>
                    {m.content}
                  </div>
                </li>
              ))}
            </ul>
            {toolStatus ? (
              <div className="mt-2 text-center text-xs text-muted-foreground">{toolStatus}</div>
            ) : null}
          </div>

          <form onSubmit={send} className="mt-3 flex items-center gap-2">
            <Input
              className="h-10 rounded-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={loading}
              aria-label="Chat input"
            />
            <Button className="h-10" type="submit" disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send'}
            </Button>
          </form>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Powered by {provider?.toLowerCase() === 'openai' ? 'OpenAI' : 'local Ollama'} ({model || (provider?.toLowerCase() === 'openai' ? 'gpt-4.1-mini' : 'llama3.2')})
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open assistant"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <ChatIcon className="h-6 w-6" />
      </button>
    </div>
  )
}

function ChatIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M21 15a4 4 0 01-4 4H9l-6 3 2-4a4 4 0 01-2-3V7a4 4 0 014-4h10a4 4 0 014 4v8z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
}
function CloseIcon(props: any) {
  return <svg viewBox="0 0 24 24" {...props}><path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
