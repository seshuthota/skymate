"use client"

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! I can answer questions about SkyMate. Ask me how to search flights, create bookings, or where to find your bookings.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      const reply = (data?.message?.content as string) || 'Sorry, I could not get a response.'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'There was an error contacting the assistant.' }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 10)
    }
  }

  return (
    <main className="grid gap-6">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold">Assistant</h1>
        <p className="text-muted-foreground">Ask about SkyMate features and how to use them.</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Requires local Ollama at http://localhost:11434
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-sm md:col-span-2">
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto pr-1">
            <ul className="grid gap-3">
              {messages.map((m, i) => (
                <li key={i} className={m.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}>
                  <div className={
                    'rounded-2xl border p-3 text-sm shadow-sm ' +
                    (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')
                  }>
                    {m.content}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={send} className="mt-4 flex items-center gap-2">
            <Input
              className="h-11 rounded-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={loading}
            />
            <Button className="h-11" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send'}</Button>
          </form>
        </div>
        <div className="rounded-2xl border bg-card/60 p-4 text-sm text-muted-foreground shadow-sm">
          <div className="mb-2 font-semibold text-foreground">Tips</div>
          <ul className="grid gap-2">
            <li>• How do I search flights?</li>
            <li>• Where can I see my bookings?</li>
            <li>• Can I cancel a booking?</li>
            <li>• What data is mock vs real?</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

