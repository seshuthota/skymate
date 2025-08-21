import ClientSearch from '@/components/ClientSearch'
import type { ReactNode } from 'react'

export default function Page() {
  return (
    <main className="relative">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[420px] overflow-hidden">
        <div className="mx-auto h-full max-w-5xl blur-3xl">
          <div className="h-56 w-56 rounded-full bg-primary/30 opacity-60 mix-blend-screen" />
          <div className="float-right -mt-24 h-44 w-44 rounded-full bg-accent/25 opacity-70 mix-blend-screen" />
        </div>
      </div>

      {/* Hero + Search */}
      <section className="relative grid gap-8 py-6 md:grid-cols-2 md:py-12">
        <div className="flex flex-col justify-center gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Prototype • Mock provider enabled
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
            Book flights, hold seats, and checkout
            <br />
            with a smart assistant
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent"> that helps</span>.
          </h1>
          <p className="max-w-prose text-base text-muted-foreground">
            Search real-like offers, reserve while you decide, and complete bookings with clarity. No cards required in this demo.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground/80">
            <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> No payments</div>
            <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-400" /> Prototype data</div>
            <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-fuchsia-400" /> Fast mock search</div>
          </div>
        </div>

        <div className="md:pl-6">
          <div className="rounded-2xl border bg-card/70 p-4 shadow-lg ring-1 ring-border/40 sm:p-6">
            <h3 className="mb-3 text-lg font-semibold">Search flights</h3>
            <ClientSearch />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Search smarter"
            desc="Simple inputs, clear results, and prices that make sense."
            icon={(
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M21 21l-4.35-4.35m1.1-4.55a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
            )}
          />
          <FeatureCard
            title="Hold before booking"
            desc="Lock the best option while you finalize details."
            icon={(
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M12 3l8 4v6c0 5-3 7-8 8-5-1-8-3-8-8V7l8-4z" fill="currentColor"/></svg>
            )}
          />
          <FeatureCard
            title="Clear checkout"
            desc="Straightforward steps and transparent totals. No surprises."
            icon={(
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M3 6h18M3 12h12M3 18h6" stroke="currentColor" strokeWidth="2"/></svg>
            )}
          />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: ReactNode }) {
  return (
    <div className="group rounded-xl border bg-card/60 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary/20">
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  )
}
