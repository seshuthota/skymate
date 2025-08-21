# Flight Booking MVP — Vercel‑Ready (Postgres + Chat‑first)

Goal: Ship the smallest workable flight‑booking app to test an AI support assistant (chat‑only first). Optimize for Vercel deployment, keep complexity low, and use Postgres instead of file‑backed SQLite.

---

## 1) Changes vs. previous plan

- DB: SQLite (file) → Postgres (Vercel Postgres/Neon) via Prisma. Same DB for local and prod to avoid drift.
- Assistant: Chat‑only using OpenAI Responses API + server‑side tool execution. Voice/WebRTC moves to Phase‑2.
- Idempotency: Required on booking/cancel; stored in DB to prevent duplicates.
- Provider interface: Add getOffer(offerId) used by API/tools.
- Runtime split: Node.js runtime for DB routes; optional Edge route for streaming chat.

---

## 2) Scope & Non‑Goals

In scope

- Flight search (one‑way/round‑trip), basic filters
- Offer inspect, optional hold, create/cancel booking
- User profile, traveler info, booking history
- Chat assistant with tools covering all above

Non‑goals (for now)

- Payments, refunds, KYC, ancillaries, multi‑city, reissues, voice calls

---

## 3) Architecture (Vercel‑first)

```
+------------------------+          +------------------------------+
| Web Client (Next.js)   |  fetch   |  API Routes (Node runtime)  |
| React/TS + Chat UI     +--------->|  Auth, Prisma, Postgres     |
+-----------+------------+          +-----------+------------------+
            |                                   |
            |  SSE/stream (Edge optional)       | Prisma (pooling)
            v                                   v
       OpenAI Responses API                Vercel Postgres / Neon
           + tools                           (DATABASE_URL)

   Flights Provider (mock default; optional Duffel sandbox via env)
```

Notes

- Keep DB work on Node runtime routes. If you add a streaming chat route, run that on Edge and call back to Node routes for DB ops when needed.
- Start with a single region; Postgres is fine for a prototype and Vercel handles pooling.

---

## 4) Tech Stack

- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- Assistant (chat): OpenAI Responses API with function‑calling tools
- Backend: Next.js Route Handlers (Node 20); optional Edge handler for chat streaming
- DB: Postgres via Prisma
- Flights provider: mock (canned offers) by default; optional Duffel sandbox via env
- Observability (optional): Vercel Analytics; optional Sentry

---

## 5) Env Config

```
# OpenAI
OPENAI_API_KEY=...
OPENAI_TEXT_MODEL=gpt-4o
OPENAI_TEXT_MODEL_SMALL=gpt-4.1-mini

# Provider selection
PROVIDER=mock   # or duffel later
DUFFEL_API_KEY=... # only if PROVIDER=duffel

# Postgres (Vercel Postgres/Neon)
DATABASE_URL=...              # use POSTGRES_URL in Vercel
POSTGRES_PRISMA_URL=...       # use for migrations on Vercel
SHADOW_DATABASE_URL=...       # non‑pooled URL for Prisma shadow DB

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev_secret
EMAIL_SERVER=...              # for magic link, or swap to OAuth later
EMAIL_FROM=hello@example.com
```

---

## 6) Data Model (Prisma, Postgres)

```prisma
// prisma/schema.prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  travelers Traveler[]
  bookings  Booking[]
}

model Traveler {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  firstName  String
  lastName   String
  gender     String?
  dob        DateTime?
  docType    String?
  docNumber  String?
  docExpiry  DateTime?

  @@index([userId])
}

model Booking {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  provider     String   // mock|duffel
  providerRef  String   // order id or simulated id
  status       String   // RESERVED|CONFIRMED|CANCELLED
  totalAmount  Int      // cents (prototype)
  currency     String   // e.g., "INR"
  offerId      String
  passengers   Json
  contact      Json
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  segments     Segment[]

  @@unique([provider, providerRef])
  @@index([userId, createdAt])
}

model Segment {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  origin      String
  destination String
  departAt    DateTime
  arriveAt    DateTime
  carrier     String
  number      String
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  kind      String   // TOOL_CALL|BOOK|CANCEL|ERROR
  payload   Json
  createdAt DateTime @default(now())
}

model IdempotencyKey {
  id        String   @id @default(cuid())
  userId    String?
  method    String
  path      String
  key       String
  hash      String   @unique  // hash(userId,method,path,key)
  createdAt DateTime @default(now())
  expiresAt DateTime?
}
```

Notes

- JSON columns are fine in Postgres for prototype speed.
- Amounts stored as cents in Int for simplicity.

---

## 7) Flights Provider Abstraction

```ts
// lib/flights/provider.ts
export interface SearchParams {
  origin: string; destination: string; departDate: string; returnDate?: string;
  adults: number; children?: number; infants?: number;
  cabin?: 'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST';
  maxStops?: number; sort?: 'price'|'duration';
}
export interface ProviderOffer { id: string; price: { amount: number; currency: string }; summary: string; raw: any; }
export interface BookingInput { offerId: string; contact: any; passengers: any[]; }
export interface BookingResult { orderId: string; status: 'RESERVED'|'CONFIRMED'; raw: any; }

export interface FlightsProvider {
  search(params: SearchParams): Promise<ProviderOffer[]>;
  getOffer(offerId: string): Promise<ProviderOffer | null>;
  hold?(offerId: string, minutes: number): Promise<{ holdId: string; expiresAt: string }>;
  book(input: BookingInput): Promise<BookingResult>;
  cancel(orderId: string, reason?: string): Promise<{ status: 'CANCELLED' }>;
  getOrder(orderId: string): Promise<any>;
}
```

Mock provider (dev‑default)

```ts
// lib/flights/mock.ts
import { FlightsProvider, ProviderOffer, BookingInput } from './provider';
const offers: ProviderOffer[] = [
  { id: 'off_mock_1', price: { amount: 34900, currency: 'INR' }, summary: 'BLR→BOM non-stop, 1h35', raw: { carrier:'6E', depart:'2025-09-02T06:30:00+05:30' } },
  { id: 'off_mock_2', price: { amount: 28900, currency: 'INR' }, summary: 'BLR→BOM 1 stop, 3h10', raw: { carrier:'UK', via:'GOI' } }
];
export const mockProvider: FlightsProvider = {
  async search() { return offers; },
  async getOffer(id: string) { return offers.find(o => o.id === id) ?? null; },
  async book(input: BookingInput) { return { orderId: 'ord_mock_'+Date.now(), status: 'CONFIRMED', raw: { input } }; },
  async cancel() { return { status: 'CANCELLED' }; },
  async getOrder(orderId: string) { return { id: orderId, status: 'CONFIRMED' }; }
};
```

---

## 8) Backend API (no payments)

Auth: NextAuth (email magic link is enough). Tool calls run server‑side under user session.

Runtime

- DB routes: Node runtime (default) — Prisma + Postgres
- Chat route: optional Edge runtime for streaming; call Node routes for DB if needed

Endpoints

- Search Flights — POST `/api/flights/search`
- Offer Details — GET `/api/flights/offers/:id`
- Hold Offer (optional) — POST `/api/flights/hold`
- Create Booking — POST `/api/bookings` (requires Idempotency‑Key)
- Cancel Booking — POST `/api/bookings/:id/cancel` (requires Idempotency‑Key)
- Get Booking / List — GET `/api/bookings/:id`, GET `/api/bookings?status=...&cursor=...`
- Profile/Travelers — `GET/PATCH /api/me`, `POST/GET /api/me/travelers`

Idempotency (sketch)

```ts
// lib/idempotency.ts
export async function withIdempotency(userId: string | null, method: string, path: string, key: string, fn: () => Promise<any>) {
  const hash = hashKey(userId, method, path, key);
  const existing = await db.idempotencyKey.findUnique({ where: { hash } });
  if (existing) return { reused: true, result: existing }; // or fetch stored result if you persist it
  const result = await fn();
  await db.idempotencyKey.create({ data: { userId: userId ?? null, method, path, key, hash } });
  return { reused: false, result };
}
```

---

## 9) Assistant: Tools (chat‑only)

System Prompt (v0)

> You are a concise, helpful flight‑booking assistant. Always confirm critical details (dates, airports, passenger names) before booking or cancelling. Use tools for all facts; never fabricate prices or PNRs.

Tool catalog (JSON Schemas)

```json
{"name":"searchFlights","description":"Search flight offers","parameters":{"type":"object","properties":{"origin":{"type":"string"},"destination":{"type":"string"},"departDate":{"type":"string","format":"date"},"returnDate":{"type":"string","format":"date","nullable":true},"adults":{"type":"integer","minimum":1},"children":{"type":"integer","minimum":0},"infants":{"type":"integer","minimum":0},"cabin":{"type":"string","enum":["ECONOMY","PREMIUM_ECONOMY","BUSINESS","FIRST"]},"maxStops":{"type":"integer","minimum":0},"sort":{"type":"string","enum":["price","duration"]}},"required":["origin","destination","departDate","adults"]}}
```

```json
{"name":"getOfferDetails","description":"Get enriched details for an offer","parameters":{"type":"object","properties":{"offerId":{"type":"string"}},"required":["offerId"]}}
```

```json
{"name":"createBooking","description":"Create a booking (no payment)","parameters":{"type":"object","properties":{"offerId":{"type":"string"},"contact":{"type":"object"},"passengers":{"type":"array","items":{"type":"object"}}},"required":["offerId","contact","passengers"]}}
```

```json
{"name":"cancelBooking","description":"Cancel a booking","parameters":{"type":"object","properties":{"bookingId":{"type":"string"},"reason":{"type":"string"}},"required":["bookingId"]}}
```

```json
{"name":"getBooking","description":"Retrieve a booking","parameters":{"type":"object","properties":{"bookingId":{"type":"string"}},"required":["bookingId"]}}
```

```json
{"name":"listUserBookings","description":"List the user’s booking history","parameters":{"type":"object","properties":{"status":{"type":"string"},"cursor":{"type":"string"}}}}
```

```json
{"name":"getUserProfile","description":"Get current user profile","parameters":{"type":"object","properties":{}}}
```

```json
{"name":"updateUserProfile","description":"Update user profile","parameters":{"type":"object","properties":{"name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"}}}}
```

```json
{"name":"addTraveler","description":"Add a traveler","parameters":{"type":"object","properties":{"traveler":{"type":"object"}},"required":["traveler"]}}
```

Server executor

```ts
// app/api/assistant/tools/execute.ts
export async function executeToolCall(name: string, args: any, ctx: { userId: string }) {
  switch (name) {
    case 'searchFlights': return flights.search(args);
    case 'getOfferDetails': return flights.getOffer(args.offerId);
    case 'createBooking': return bookings.create(ctx.userId, args);
    case 'cancelBooking': return bookings.cancel(ctx.userId, args.bookingId, args.reason);
    case 'getBooking': return bookings.get(ctx.userId, args.bookingId);
    case 'listUserBookings': return bookings.list(ctx.userId, args.status, args.cursor);
    case 'getUserProfile': return users.getProfile(ctx.userId);
    case 'updateUserProfile': return users.updateProfile(ctx.userId, args);
    case 'addTraveler': return users.addTraveler(ctx.userId, args.traveler);
    default: throw new Error('Unknown tool');
  }
}
```

---

## 10) Route Handlers (sketch)

```ts
// app/api/flights/search/route.ts
export const runtime = 'nodejs';
import { z } from 'zod';
import { provider } from '@/lib/flights';
const Schema = z.object({ origin:z.string(), destination:z.string(), departDate:z.string(), returnDate:z.string().optional(), adults:z.number().int().min(1), children:z.number().int().min(0).optional(), infants:z.number().int().min(0).optional(), cabin:z.enum(['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST']).optional(), maxStops:z.number().int().min(0).optional(), sort:z.enum(['price','duration']).optional() });
export async function POST(req: Request) {
  const args = Schema.parse(await req.json());
  const offers = await provider.search(args);
  return Response.json({ offers });
}
```

```ts
// app/api/flights/offers/[id]/route.ts
export const runtime = 'nodejs';
import { provider } from '@/lib/flights';
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const offer = await provider.getOffer(params.id);
  if (!offer) return new Response('Not found', { status: 404 });
  return Response.json(offer);
}
```

```ts
// app/api/bookings/route.ts
export const runtime = 'nodejs';
import { z } from 'zod';
import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';
const Schema = z.object({ offerId:z.string(), contact:z.any(), passengers:z.array(z.any()) });
export async function POST(req: Request) {
  const userId = await requireUser(req);
  const args = Schema.parse(await req.json());
  const idem = req.headers.get('Idempotency-Key') || '';
  const { result } = await withIdempotency(userId, 'POST', '/api/bookings', idem, () => bookings.create(userId, args));
  return new Response(JSON.stringify({ bookingId: result.id, status: result.status, providerRef: result.providerRef }), { status: 201 });
}
```

---

## 11) Frontend UX (chat‑first)

- Pages: `/` search → results → offer details → checkout (collect passenger/contact) → confirmation
- Account: `/bookings`, `/profile` (travelers)
- Assistant Widget: chat panel with tool activity states and confirmation prompts before booking/cancelling

---

## 12) Security & Guardrails

- Secrets only on server; tools executed server‑side
- Schema validation (zod) on every route/tool
- Double confirm in assistant before booking/cancelling
- Minimal rate limit per IP/session on search and bookings (optional)
- PII redaction in AuditLog; correlation ids for tool calls

---

## 13) Testing

- Unit: provider mock, validators, bookings service
- Integration: search→book→cancel with mock provider
- E2E: Playwright paths for UI and assistant chat flows (stub model replies for CI)

---

## 14) Phase‑2 (voice upgrade plan)

When chat flows are stable:

- Add Realtime API (WebRTC) with ephemeral tokens
- Reuse the same tool catalog and executors
- Add push‑to‑talk UI, latency metrics, and human‑handoff

---

## 15) Setup & Commands

```bash
# 1) Bootstrap
pnpm create next-app flight-mvp --ts
cd flight-mvp
pnpm add openai zod prisma @prisma/client next-auth

# 2) Prisma/Postgres
pnpm dlx prisma init --datasource-provider postgresql
# put schema.prisma as above
# set DATABASE_URL in .env to your Neon/Vercel Postgres URL
npx prisma migrate dev --name init
npx prisma generate

# 3) Dev
pnpm dev

# 4) Deploy (Vercel)
# - Add Vercel Postgres integration or Neon, set env:
#   DATABASE_URL, POSTGRES_PRISMA_URL, SHADOW_DATABASE_URL
# - Run migrations on deploy:
npx prisma migrate deploy
```

---

## 16) File/Folder Layout

```
app/
  api/
    flights/
      search/route.ts
      offers/[id]/route.ts
      hold/route.ts
    bookings/
      route.ts
      [id]/route.ts
      [id]/cancel/route.ts
    assistant/
      tools/execute.ts
      (chat/route.ts  # optional Edge streaming)
  (pages)
lib/
  flights/
    provider.ts
    mock.ts
    index.ts  // exports provider based on env
  bookings.ts
  users.ts
  auth.ts
  idempotency.ts
prisma/
  schema.prisma
components/
  AssistantWidget.tsx
  SearchForm.tsx
  ResultsList.tsx
  CheckoutForm.tsx
```

---

## 17) Definition of Done (chat‑first MVP)

- A user can search, select, “book” (simulated provider), cancel, and view bookings
- Chat assistant can perform the same via tools (with confirmations)
- Postgres persists users/travelers/bookings; basic logs exist; no secrets in client

