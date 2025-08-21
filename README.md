# SkyMate MVP

Minimal flight booking prototype optimized for Vercel deployment.

## Stack

- Next.js 15 (App Router, Node runtime)
- Prisma + Postgres (Vercel Postgres/Neon)
- Zod for validation
- OpenAI (optional, for assistant later)

## Getting Started

1) Install deps

```
pnpm install
```

2) Run Postgres (no external account needed)

Option A — Docker (recommended):

```
docker compose up -d
```

This starts Postgres 16 on port 5432 with DB `skymate` and password `postgres`.

Option B — Local Postgres:

Create a database named `skymate` and ensure it is accessible on `localhost:5432`.

3) Configure env

Copy `.env.example` to `.env` and set `DATABASE_URL` (Neon/Vercel Postgres). For development you can use a local Postgres too.

For Docker/local Postgres, use:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skymate?schema=public"
```

4) Prisma

```
pnpm prisma:generate
pnpm prisma:migrate --name init
```

5) Run dev server

```
pnpm dev
```

## API

- POST `/api/flights/search` → `{ origin, destination, departDate, adults }`
- GET `/api/flights/offers/:id`
- POST `/api/bookings` (requires `x-user-id` header and optional `Idempotency-Key`)
- POST `/api/bookings/:id/cancel` (requires `x-user-id`)
- GET `/api/bookings?status=...&cursor=...` (requires `x-user-id`)
- GET `/api/bookings/:id` (requires `x-user-id`)
- PATCH `/api/bookings/:id` (requires `x-user-id`) → update `contact` and/or `passengers`

- GET `/api/users/me` (requires `x-user-id` or `uid` cookie)
- PATCH `/api/users/me` (requires `x-user-id` or `uid` cookie)
- GET `/api/users/me/bookings?status=...&cursor=...` (requires `x-user-id` or `uid` cookie`)

- POST `/api/chat` → Proxies to local Ollama (`llama3.2`) to answer site questions.
  - Tools: `get_user_profile`, `list_user_bookings`, `get_next_flight`, `search_flights`

For auth, this prototype uses an `x-user-id` header. Replace with NextAuth when ready.

## Deploy to Vercel

- Add Vercel Postgres integration (or Neon) and set env vars:
  - `DATABASE_URL`, `POSTGRES_PRISMA_URL`, `SHADOW_DATABASE_URL`
- Add a build step that runs:
  - `pnpm prisma:generate` and `pnpm prisma:deploy`

## Assistant (Local Ollama)

- Install Ollama and pull a model (e.g., `ollama pull llama3.2`).
- Start Ollama locally (defaults to `http://localhost:11434`).
- Optional envs:
  - `LLM_PROVIDER` (default `ollama`; set to `openai` to use OpenAI)
  - `LLM_MODEL` (override default model for selected provider)
  - `OPENAI_API_KEY` (required when `LLM_PROVIDER=openai`)
  - `OLLAMA_BASE_URL` (default `http://localhost:11434`)
  - `OLLAMA_MODEL` (default `llama3.2`)
- Open `/assistant` in the app to chat.

### Switching providers

- Ollama (default): ensure local server is running; set nothing or `LLM_PROVIDER=ollama`.
- OpenAI: set `LLM_PROVIDER=openai` and `OPENAI_API_KEY`. Optionally set `LLM_MODEL` (e.g., `gpt-4o-mini`).
