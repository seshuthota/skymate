export const runtime = 'nodejs'

import { z } from 'zod'
import OpenAI from 'openai'
import { requireUser } from '@/lib/auth'
import { users } from '@/lib/users'
import { bookings } from '@/lib/bookings'
import { provider } from '@/lib/flights'
import { normalizeDate, normalizePlace } from '@/lib/nlp'

const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
})

function getBaseUrl() {
  return process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
}

function getModel() {
  return process.env.OLLAMA_MODEL || 'llama3.2'
}

const SYSTEM_PROMPT = `You are SkyMate's website assistant with an enthusiastic, professional, and helpful tone.
- Persona: friendly and upbeat, but concise. Be confident and calm. Avoid overusing exclamation points.
- Scope: answer questions about the SkyMate prototype, its features (search, bookings, profile), and how to use it.
- Style: plain text only (ASCII). No markdown, bold, italics, emojis, fancy bullets or arrows. If needed, use simple hyphen bullets like "- item". Prefer currency codes (e.g., "INR 34,900") over symbols.
- Helpfulness: default to a short 1–2 sentence answer with only key details. Use 2–5 short bullets or steps only when the user asks "how" or requests steps. If unsure, say so.
- Safety: avoid hallucinations; do not claim external integrations beyond the mock provider.
- Tools: call tools only when the user explicitly asks about their personal data (e.g., "my bookings", "my profile", "what is my email") OR when they refer to themselves (I/me/my) together with bookings/profile/account/email. Do not call tools for greetings or general questions.
- Data fidelity: when summarizing tool results, use exact provided fields. If an airline name is not provided, do not invent it — use the carrier code only. Amounts are in minor units; divide by 100 and include the currency code.
- Follow-up: ask a brief clarifying question when intent is ambiguous.`

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_user_profile',
      description: 'Get the current user profile (id, email, name, createdAt).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_user_bookings',
      description: 'List current user bookings optionally filtered by status (RESERVED|CONFIRMED|CANCELLED).',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['RESERVED', 'CONFIRMED', 'CANCELLED'] },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_next_flight',
      description: 'Return the next upcoming flight segment for the current user, including booking id and price.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_flights',
      description: 'Search flights between origin and destination. Origin/destination can be IATA codes or city/airport names. Date can be YYYY-MM-DD or natural phrases (today, tomorrow, next friday).',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'IATA code or name (e.g., BLR, Bangalore, NYC, New York)' },
          destination: { type: 'string', description: 'IATA code or name (e.g., BOM, Mumbai, London)' },
          depart: { type: 'string', description: 'YYYY-MM-DD or natural language' },
          adults: { type: 'number', minimum: 1, default: 1 },
        },
        required: ['origin', 'destination'],
        additionalProperties: false,
      },
    },
  },
]

export async function POST(req: Request) {
  try {
    const { messages } = ChatSchema.parse(await req.json())
    const MAX_MESSAGES = 16
    const baseMessages = messages.slice(-MAX_MESSAGES)
    const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase()

    if (provider === 'openai') {
      const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const oaiMessages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...baseMessages,
      ]
      const res1 = await client.chat.completions.create({ model, messages: oaiMessages as any, tools: tools as any, tool_choice: 'auto' })
      const choice1 = res1.choices?.[0]
      const message: any = choice1?.message || { role: 'assistant', content: '' }
      const toolCalls: any[] | undefined = message?.tool_calls

      function shouldUseTools(msgs: any[]): boolean {
        const lastUser = [...msgs].reverse().find((m) => m.role === 'user') as { content?: string } | undefined
        const q = (lastUser?.content || '').toLowerCase()
        if (!q) return false
        const subject = '(booking|bookings|reservation|reservations|profile|account|email|info|flight|flights|trip|trips|itinerary|ticket|pnr)'
        const patterns = [
          new RegExp(`\\bmy\\s+${subject}\\b`),
          new RegExp(`\\b(show|list|get|view|see|check)\\s+my\\s+${subject}\\b`),
          new RegExp(`\\b(how\\s+many|what\\s+are)\\s+my\\s+${subject}\\b`),
          new RegExp(`\\bdo\\s+i\\s+(have|got)\\b.*\\b${subject}\\b`),
        ]
        if (patterns.some((re) => re.test(q))) return true
        const hasPronoun = /\b(i|me|my|mine)\b/.test(q)
        const hasSubject = new RegExp(subject).test(q)
        return hasPronoun && hasSubject
      }

      if (toolCalls && toolCalls.length > 0 && !shouldUseTools(baseMessages)) {
        const resPlain = await client.chat.completions.create({ model, messages: oaiMessages as any })
        const msg = resPlain.choices?.[0]?.message || { role: 'assistant', content: 'How can I help?' }
        return Response.json({ message: msg })
      }

      if (toolCalls && toolCalls.length > 0 && shouldUseTools(baseMessages)) {
        const userId = await requireUser(req).catch(() => null)
        if (!userId) {
          const resNoUser = await client.chat.completions.create({ model, messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...baseMessages,
            { role: 'assistant', content: 'The user is not signed in, so tools cannot access personal data.' },
          ] as any })
          const msg = resNoUser.choices?.[0]?.message || { role: 'assistant', content: 'Please sign in to access your info.' }
          return Response.json({ message: msg })
        }
        // Execute tools
        const toolResults: { id?: string; name: string; content: any }[] = []
        for (const call of toolCalls) {
          const id = call.id as string | undefined
          const name = call.function?.name as string
          let args: any = {}
          try { args = JSON.parse(call.function?.arguments || '{}') } catch {}
          if (name === 'get_user_profile') {
            const profile = await users.getProfile(userId)
            toolResults.push({ id, name, content: profile })
          } else if (name === 'list_user_bookings') {
            const status = typeof args?.status === 'string' ? args.status : undefined
            const data = await bookings.list(userId, status, undefined)
            toolResults.push({ id, name, content: data })
          } else if (name === 'get_next_flight') {
            const data = await bookings.list(userId, 'CONFIRMED', undefined)
            const now = new Date()
            let best: any = null
            for (const b of data.items || []) {
              for (const s of (b.segments as any[]) || []) {
                const depart = new Date(s.departAt)
                if (!best && depart >= now) best = { booking: b, seg: s }
                else if (depart >= now && best && depart < new Date(best.seg.departAt)) best = { booking: b, seg: s }
              }
            }
            if (!best) {
              for (const b of data.items || []) {
                for (const s of (b.segments as any[]) || []) {
                  const depart = new Date(s.departAt)
                  if (!best) best = { booking: b, seg: s }
                  else if (depart > new Date(best.seg.departAt)) best = { booking: b, seg: s }
                }
              }
            }
            if (best) {
              const out = {
                bookingId: best.booking.id,
                currency: best.booking.currency,
                totalAmount: best.booking.totalAmount,
                origin: best.seg.origin,
                destination: best.seg.destination,
                departAt: new Date(best.seg.departAt).toISOString(),
                arriveAt: new Date(best.seg.arriveAt).toISOString(),
                carrier: best.seg.carrier,
                number: best.seg.number,
                status: best.booking.status,
              }
              toolResults.push({ id, name, content: out })
            } else {
              toolResults.push({ id, name, content: { message: 'no flights found' } })
            }
          } else if (name === 'search_flights') {
            const origin = normalizePlace(String(args.origin || ''))
            const destination = normalizePlace(String(args.destination || ''))
            const departDate = normalizeDate(String(args.depart || ''))
            const adults = Math.max(1, Number(args.adults || 1))
            const offers = await provider.search({ origin, destination, departDate, adults } as any)
            toolResults.push({ id, name, content: { origin, destination, departDate, adults, offers } })
          }
        }

        const followMessages: any[] = [
          ...oaiMessages,
          { role: 'assistant', content: message.content || '', tool_calls: message.tool_calls },
          ...toolResults.map((r) => ({ role: 'tool', tool_call_id: r.id, content: JSON.stringify(r.content) })),
        ]
        const res2 = await client.chat.completions.create({ model, messages: followMessages })
        const msg2 = res2.choices?.[0]?.message || { role: 'assistant', content: 'Here is your information.' }
        return Response.json({ message: msg2 })
      }

      return Response.json({ message })
    }

    // Default: Ollama provider
    // First call: let the model decide if it needs a tool
    const payload1: any = {
      model: getModel(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...baseMessages,
      ],
      tools,
      stream: false,
    }

    const res1 = await fetch(`${getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload1),
    })

    if (!res1.ok) {
      const text = await res1.text().catch(() => '')
      return new Response(JSON.stringify({ code: 'OLLAMA_ERROR', message: text || 'Failed to reach Ollama' }), { status: 502 })
    }

    const data1 = await res1.json()

    const message = data1?.message
    const toolCalls: any[] | undefined = message?.tool_calls || message?.toolCalls

    function shouldUseTools(msgs: any[]): boolean {
      const lastUser = [...msgs].reverse().find((m) => m.role === 'user') as { content?: string } | undefined
      const q = (lastUser?.content || '').toLowerCase()
      if (!q) return false
      const subject = '(booking|bookings|reservation|reservations|profile|account|email|info|flight|flights|trip|trips|itinerary|ticket|pnr)'
      const patterns = [
        new RegExp(`\\bmy\\s+${subject}\\b`),
        new RegExp(`\\b(show|list|get|view|see|check)\\s+my\\s+${subject}\\b`),
        new RegExp(`\\b(how\\s+many|what\\s+are)\\s+my\\s+${subject}\\b`),
        new RegExp(`\\bdo\\s+i\\s+(have|got)\\b.*\\b${subject}\\b`),
        ]
      if (patterns.some((re) => re.test(q))) return true
      // Fallback: if first-person pronoun + subject both appear, allow
      const hasPronoun = /\b(i|me|my|mine)\b/.test(q)
      const hasSubject = new RegExp(subject).test(q)
      return hasPronoun && hasSubject
    }

    if (toolCalls && toolCalls.length > 0 && !shouldUseTools(baseMessages)) {
      // Suppress tool use for non-personal queries; get a plain answer instead
      const resPlain = await fetch(`${getBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getModel(),
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...baseMessages,
          ],
          stream: false,
        }),
      })
      const dataPlain = await resPlain.json().catch(() => ({}))
      return Response.json({ message: dataPlain?.message || { role: 'assistant', content: 'How can I help?' } })
    }

    if (toolCalls && toolCalls.length > 0 && shouldUseTools(baseMessages)) {
      // Execute tool calls (single round)
      const userId = await requireUser(req).catch(() => null)
      if (!userId) {
        // If not signed in, ask the model to reply accordingly
        const resNoUser = await fetch(`${getBaseUrl()}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: getModel(),
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...baseMessages,
              { role: 'assistant', content: 'The user is not signed in, so tools cannot access personal data.' },
            ],
            stream: false,
          }),
        })
        const dataNoUser = await resNoUser.json().catch(() => ({}))
        return Response.json({ message: dataNoUser?.message || { role: 'assistant', content: 'Please sign in to access your info.' } })
      }

      const toolResults: { name: string; content: any }[] = []
      for (const call of toolCalls) {
        const name: string = call?.function?.name || call?.name
        let args: any = {}
        try { args = JSON.parse(call?.function?.arguments || call?.arguments || '{}') } catch {}

        if (name === 'get_user_profile') {
          const profile = await users.getProfile(userId)
          toolResults.push({ name, content: profile })
        } else if (name === 'list_user_bookings') {
          const status = typeof args?.status === 'string' ? args.status : undefined
          const data = await bookings.list(userId, status, undefined)
          toolResults.push({ name, content: data })
        } else if (name === 'get_next_flight') {
          // Compute the earliest upcoming segment across confirmed bookings
          const data = await bookings.list(userId, 'CONFIRMED', undefined)
          const now = new Date()
          let best: any = null
          for (const b of data.items || []) {
            for (const s of (b.segments as any[]) || []) {
              const depart = new Date(s.departAt)
              if (!best && depart >= now) {
                best = { booking: b, seg: s }
              } else if (depart >= now && best && depart < new Date(best.seg.departAt)) {
                best = { booking: b, seg: s }
              }
            }
          }
          // Fallback: if no future, pick the most recent past
          if (!best) {
            for (const b of data.items || []) {
              for (const s of (b.segments as any[]) || []) {
                const depart = new Date(s.departAt)
                if (!best) {
                  best = { booking: b, seg: s }
                } else if (depart > new Date(best.seg.departAt)) {
                  best = { booking: b, seg: s }
                }
              }
            }
          }
          if (best) {
            const out = {
              bookingId: best.booking.id,
              currency: best.booking.currency,
              totalAmount: best.booking.totalAmount,
              origin: best.seg.origin,
              destination: best.seg.destination,
              departAt: new Date(best.seg.departAt).toISOString(),
              arriveAt: new Date(best.seg.arriveAt).toISOString(),
              carrier: best.seg.carrier,
              number: best.seg.number,
              status: best.booking.status,
            }
            toolResults.push({ name, content: out })
          } else {
            toolResults.push({ name, content: { message: 'no flights found' } })
          }
        } else if (name === 'search_flights') {
          const origin = normalizePlace(String(args.origin || ''))
          const destination = normalizePlace(String(args.destination || ''))
          const departDate = normalizeDate(String(args.depart || ''))
          const adults = Math.max(1, Number(args.adults || 1))
          const offers = await provider.search({ origin, destination, departDate, adults } as any)
          toolResults.push({ name, content: { origin, destination, departDate, adults, offers } })
        }
      }

      const res2 = await fetch(`${getBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getModel(),
          tools,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...baseMessages,
            message,
            // Provide tool outputs back to the model; include as tool role messages
            ...toolResults.map((r, i) => ({ role: 'tool', content: JSON.stringify(r.content), name: r.name })),
          ],
          stream: false,
        }),
      })
      const data2 = await res2.json().catch(() => ({}))
      return Response.json({ message: data2?.message || { role: 'assistant', content: 'Here is your information.' } })
    }

    // No tools needed, return the assistant message
    return Response.json({ message: message || { role: 'assistant', content: '' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'CHAT_FAILED', message: err?.message || 'Invalid request' }), { status: 400 })
  }
}
