import { BookingInput, BookingResult, FlightsProvider, ProviderOffer, SearchParams } from './provider';

// Expanded mock offers across multiple routes and times
const offers: ProviderOffer[] = [
  // BLR → BOM — 2025-09-02
  {
    id: 'off_blr_bom_0630_6e',
    price: { amount: 34900, currency: 'INR' },
    summary: 'BLR→BOM non-stop, 1h35',
    raw: { origin: 'BLR', destination: 'BOM', carrier: '6E', flight: '6E 512', depart: '2025-09-02T06:30:00+05:30', arrive: '2025-09-02T08:05:00+05:30', stops: 0, durationMinutes: 95, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_0805_ai',
    price: { amount: 36900, currency: 'INR' },
    summary: 'BLR→BOM non-stop, 1h40',
    raw: { origin: 'BLR', destination: 'BOM', carrier: 'AI', flight: 'AI 640', depart: '2025-09-02T08:05:00+05:30', arrive: '2025-09-02T09:45:00+05:30', stops: 0, durationMinutes: 100, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_1100_uk',
    price: { amount: 39900, currency: 'INR' },
    summary: 'BLR→BOM non-stop, 1h45',
    raw: { origin: 'BLR', destination: 'BOM', carrier: 'UK', flight: 'UK 855', depart: '2025-09-02T11:00:00+05:30', arrive: '2025-09-02T12:45:00+05:30', stops: 0, durationMinutes: 105, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_1420_i5',
    price: { amount: 35900, currency: 'INR' },
    summary: 'BLR→BOM non-stop, 1h35',
    raw: { origin: 'BLR', destination: 'BOM', carrier: 'I5', flight: 'I5 321', depart: '2025-09-02T14:20:00+05:30', arrive: '2025-09-02T15:55:00+05:30', stops: 0, durationMinutes: 95, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_1810_6e',
    price: { amount: 42900, currency: 'INR' },
    summary: 'BLR→BOM non-stop, 1h40',
    raw: { origin: 'BLR', destination: 'BOM', carrier: '6E', flight: '6E 834', depart: '2025-09-02T18:10:00+05:30', arrive: '2025-09-02T19:50:00+05:30', stops: 0, durationMinutes: 100, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_2115_ai',
    price: { amount: 43900, currency: 'INR' },
    summary: 'BLR→BOM non-stop, 1h35',
    raw: { origin: 'BLR', destination: 'BOM', carrier: 'AI', flight: 'AI 644', depart: '2025-09-02T21:15:00+05:30', arrive: '2025-09-02T22:50:00+05:30', stops: 0, durationMinutes: 95, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_0930_uk_goi',
    price: { amount: 28900, currency: 'INR' },
    summary: 'BLR→BOM 1 stop, 3h10',
    raw: { origin: 'BLR', destination: 'BOM', carrier: 'UK', flight: 'UK 301', depart: '2025-09-02T09:30:00+05:30', arrive: '2025-09-02T12:40:00+05:30', stops: 1, via: 'GOI', durationMinutes: 190, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_1625_6e_hyd',
    price: { amount: 30900, currency: 'INR' },
    summary: 'BLR→BOM 1 stop, 3h40',
    raw: { origin: 'BLR', destination: 'BOM', carrier: '6E', flight: '6E 712', depart: '2025-09-02T16:25:00+05:30', arrive: '2025-09-02T20:05:00+05:30', stops: 1, via: 'HYD', durationMinutes: 220, cabin: 'ECONOMY' },
  },
  {
    id: 'off_blr_bom_2300_ai_maa',
    price: { amount: 27900, currency: 'INR' },
    summary: 'BLR→BOM 1 stop, 4h05',
    raw: { origin: 'BLR', destination: 'BOM', carrier: 'AI', flight: 'AI 321', depart: '2025-09-02T23:00:00+05:30', arrive: '2025-09-03T03:05:00+05:30', stops: 1, via: 'MAA', durationMinutes: 245, cabin: 'ECONOMY' },
  },

  // DEL → GOI — 2025-09-02
  {
    id: 'off_del_goi_0710_6e',
    price: { amount: 52900, currency: 'INR' },
    summary: 'DEL→GOI non-stop, 2h35',
    raw: { origin: 'DEL', destination: 'GOI', carrier: '6E', flight: '6E 221', depart: '2025-09-02T07:10:00+05:30', arrive: '2025-09-02T09:45:00+05:30', stops: 0, durationMinutes: 155, cabin: 'ECONOMY' },
  },
  {
    id: 'off_del_goi_1215_ai',
    price: { amount: 56900, currency: 'INR' },
    summary: 'DEL→GOI non-stop, 2h45',
    raw: { origin: 'DEL', destination: 'GOI', carrier: 'AI', flight: 'AI 885', depart: '2025-09-02T12:15:00+05:30', arrive: '2025-09-02T15:00:00+05:30', stops: 0, durationMinutes: 165, cabin: 'ECONOMY' },
  },
  {
    id: 'off_del_goi_2040_uk',
    price: { amount: 54900, currency: 'INR' },
    summary: 'DEL→GOI non-stop, 2h35',
    raw: { origin: 'DEL', destination: 'GOI', carrier: 'UK', flight: 'UK 871', depart: '2025-09-02T20:40:00+05:30', arrive: '2025-09-02T23:15:00+05:30', stops: 0, durationMinutes: 155, cabin: 'ECONOMY' },
  },
  {
    id: 'off_del_goi_1030_6e_bom',
    price: { amount: 46900, currency: 'INR' },
    summary: 'DEL→GOI 1 stop, 4h10',
    raw: { origin: 'DEL', destination: 'GOI', carrier: '6E', flight: '6E 330', depart: '2025-09-02T10:30:00+05:30', arrive: '2025-09-02T14:40:00+05:30', stops: 1, via: 'BOM', durationMinutes: 250, cabin: 'ECONOMY' },
  },

  // SFO → SEA — 2025-09-02 (US)
  {
    id: 'off_sfo_sea_0715_as',
    price: { amount: 13900, currency: 'USD' },
    summary: 'SFO→SEA non-stop, 2h05',
    raw: { origin: 'SFO', destination: 'SEA', carrier: 'AS', flight: 'AS 123', depart: '2025-09-02T07:15:00-07:00', arrive: '2025-09-02T09:20:00-07:00', stops: 0, durationMinutes: 125, cabin: 'ECONOMY' },
  },
  {
    id: 'off_sfo_sea_1320_dl',
    price: { amount: 14900, currency: 'USD' },
    summary: 'SFO→SEA non-stop, 2h10',
    raw: { origin: 'SFO', destination: 'SEA', carrier: 'DL', flight: 'DL 456', depart: '2025-09-02T13:20:00-07:00', arrive: '2025-09-02T15:30:00-07:00', stops: 0, durationMinutes: 130, cabin: 'ECONOMY' },
  },
  {
    id: 'off_sfo_sea_1825_ua',
    price: { amount: 15900, currency: 'USD' },
    summary: 'SFO→SEA non-stop, 2h02',
    raw: { origin: 'SFO', destination: 'SEA', carrier: 'UA', flight: 'UA 789', depart: '2025-09-02T18:25:00-07:00', arrive: '2025-09-02T20:27:00-07:00', stops: 0, durationMinutes: 122, cabin: 'ECONOMY' },
  },
  {
    id: 'off_sfo_sea_1000_as_pdx',
    price: { amount: 12900, currency: 'USD' },
    summary: 'SFO→SEA 1 stop, 3h20',
    raw: { origin: 'SFO', destination: 'SEA', carrier: 'AS', flight: 'AS 234', depart: '2025-09-02T10:00:00-07:00', arrive: '2025-09-02T13:20:00-07:00', stops: 1, via: 'PDX', durationMinutes: 200, cabin: 'ECONOMY' },
  },

  // A couple extra international samples (same date)
  {
    id: 'off_lhr_cdg_0900_ba',
    price: { amount: 9900, currency: 'GBP' },
    summary: 'LHR→CDG non-stop, 1h20',
    raw: { origin: 'LHR', destination: 'CDG', carrier: 'BA', flight: 'BA 304', depart: '2025-09-02T09:00:00+01:00', arrive: '2025-09-02T11:20:00+02:00', stops: 0, durationMinutes: 80, cabin: 'ECONOMY' },
  },
  {
    id: 'off_jfk_lax_1500_b6',
    price: { amount: 21900, currency: 'USD' },
    summary: 'JFK→LAX non-stop, 6h10',
    raw: { origin: 'JFK', destination: 'LAX', carrier: 'B6', flight: 'B6 715', depart: '2025-09-02T15:00:00-04:00', arrive: '2025-09-02T18:10:00-07:00', stops: 0, durationMinutes: 370, cabin: 'ECONOMY' },
  },
];

function sameDate(iso: string, ymd: string) {
  // Compare YYYY-MM-DD without heavy TZ math; strings are ISO-like
  return (iso || '').slice(0, 10) === ymd;
}

// --- Synthetic offer generation for any route/date ---
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

const IN_AIRPORTS = new Set(['BLR', 'BOM', 'DEL', 'GOI', 'HYD', 'MAA', 'COK', 'AMD', 'CCU', 'PNQ']);
const US_AIRPORTS = new Set(['SFO', 'SEA', 'JFK', 'LAX', 'ORD', 'DFW', 'ATL', 'BOS', 'IAD', 'IAH', 'PHX', 'SAN', 'LAS', 'DEN', 'PDX', 'MSP', 'SLC']);
const UK_AIRPORTS = new Set(['LHR', 'LGW', 'MAN']);
const EU_AIRPORTS = new Set(['CDG', 'AMS', 'FRA', 'MUC', 'MAD', 'BCN', 'ZRH', 'VIE', 'FCO']);

type Region = 'IN' | 'US' | 'UK' | 'EU' | 'OTHER';

function regionFor(code: string): Region {
  if (IN_AIRPORTS.has(code)) return 'IN';
  if (US_AIRPORTS.has(code)) return 'US';
  if (UK_AIRPORTS.has(code)) return 'UK';
  if (EU_AIRPORTS.has(code)) return 'EU';
  return 'OTHER';
}

function currencyFor(origin: string, dest: string): string {
  const ro = regionFor(origin), rd = regionFor(dest);
  if (ro === 'IN' && rd === 'IN') return 'INR';
  if (ro === 'US' && rd === 'US') return 'USD';
  if (ro === 'UK' && rd === 'UK') return 'GBP';
  if ((ro === 'EU' && rd === 'EU') || (ro === 'UK' && rd === 'EU') || (ro === 'EU' && rd === 'UK')) return 'EUR';
  // Cross-region: use origin currency when known; default USD
  if (ro === 'IN') return 'INR';
  if (ro === 'US') return 'USD';
  if (ro === 'UK') return 'GBP';
  if (ro === 'EU') return 'EUR';
  return 'USD';
}

const CARRIERS: Record<Region, string[]> = {
  IN: ['6E', 'AI', 'UK', 'I5', 'SG', 'G8'],
  US: ['AS', 'DL', 'UA', 'AA', 'B6', 'WN'],
  UK: ['BA', 'U2', 'VS'],
  EU: ['AF', 'LH', 'KL', 'LX', 'IB', 'SK', 'VY'],
  OTHER: ['XY', 'ZZ'],
};

const VIA_BY_REGION: Record<Region, string[]> = {
  IN: ['HYD', 'GOI', 'MAA', 'COK', 'AMD', 'CCU', 'PNQ'],
  US: ['PDX', 'SLC', 'DEN', 'PHX', 'LAS', 'DFW', 'ORD', 'IAD', 'MSP'],
  UK: ['MAN', 'LGW', 'LHR'],
  EU: ['AMS', 'CDG', 'FRA', 'ZRH', 'MAD', 'BCN', 'FCO', 'VIE', 'MUC'],
  OTHER: ['HUB'],
};

function pad2(n: number) { return String(n).padStart(2, '0'); }

function formatIsoLocal(dateYMD: string, minutesSinceMidnight: number, tzOffset: string = 'Z') {
  const h = Math.floor(minutesSinceMidnight / 60);
  const m = minutesSinceMidnight % 60;
  return `${dateYMD}T${pad2(h)}:${pad2(m)}:00${tzOffset}`;
}

function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${pad2(m)}`;
}

const ROUTE_DURATION_HINTS: Record<string, [number, number]> = {
  'BLR-BOM': [90, 115],
  'DEL-GOI': [150, 175],
  'SFO-SEA': [115, 140],
  'JFK-LAX': [350, 400],
  'LHR-CDG': [70, 90],
  'DEL-BLR': [120, 150],
  'BLR-DEL': [120, 150],
  'BOM-DEL': [110, 140],
  'DEL-BOM': [110, 140],
  'SFO-LAX': [60, 90],
};

function durationRange(origin: string, dest: string, rng: () => number): [number, number] {
  const key = `${origin}-${dest}`;
  if (ROUTE_DURATION_HINTS[key]) return ROUTE_DURATION_HINTS[key];
  const ro = regionFor(origin), rd = regionFor(dest);
  if (ro === rd) {
    // Same region
    if (ro === 'US') return [90, 210];
    if (ro === 'IN') return [70, 190];
    if (ro === 'EU' || ro === 'UK') return [60, 180];
  }
  // Cross-region: medium/long haul
  return [240, 540];
}

function basePriceCurrency(origin: string, dest: string): { cur: string; min: number; max: number } {
  const cur = currencyFor(origin, dest);
  switch (cur) {
    case 'INR': return { cur, min: 24900, max: 64900 };
    case 'GBP': return { cur, min: 5900, max: 17900 };
    case 'EUR': return { cur, min: 6900, max: 18900 };
    default: return { cur: 'USD', min: 8900, max: 29900 };
  }
}

function generateOffers(origin: string, destination: string, departDate: string, count = 16): ProviderOffer[] {
  const seed = hash32(`${origin}|${destination}|${departDate}`);
  const rng = mulberry32(seed);
  const region = regionFor(origin);
  const carriers = CARRIERS[region];
  const vias = VIA_BY_REGION[region];
  const [minDur, maxDur] = durationRange(origin, destination, rng);
  const priceCfg = basePriceCurrency(origin, destination);

  const results: ProviderOffer[] = [];
  let t0 = 6 * 60; // 06:00 local
  const window = 16 * 60; // flights between 06:00 and 22:00
  const step = Math.max(45, Math.floor(window / count));

  for (let i = 0; i < count; i++) {
    const nonstop = rng() < 0.7; // 70% nonstop
    const stops = nonstop ? 0 : 1;
    const duration = Math.floor(minDur + rng() * (maxDur - minDur));
    const departMin = t0 + i * step + Math.floor(rng() * 20) - 10; // small jitter
    const layover = stops ? 45 + Math.floor(rng() * 75) : 0;
    const totalDuration = duration + layover;
    const arriveMin = departMin + totalDuration;
    const carrier = pick(rng, carriers);
    const flight = `${carrier} ${Math.floor(100 + rng() * 899)}`;
    const via = stops ? pick(rng, vias) : undefined;

    const base = priceCfg.min + Math.floor(rng() * (priceCfg.max - priceCfg.min));
    const amount = Math.max( Math.floor(base * (stops ? 0.9 : 1.0) * (1 + ((duration - minDur) / (maxDur - minDur + 1)) * 0.15)),  
      Math.floor(priceCfg.min * 0.8)
    );
    const id = `offgen_${origin}_${destination}_${departDate.replace(/-/g, '')}_${i}`;
    const summary = `${origin}→${destination} ${stops === 0 ? 'non-stop' : `${stops} stop`}, ${fmtDuration(totalDuration)}`;
    results.push({
      id,
      price: { amount, currency: priceCfg.cur },
      summary,
      raw: {
        origin,
        destination,
        carrier,
        flight,
        depart: formatIsoLocal(departDate, Math.max(5 * 60, Math.min(23 * 60, departMin))),
        arrive: formatIsoLocal(departDate, Math.max(6 * 60, Math.min(24 * 60 - 1, arriveMin))),
        stops,
        via,
        durationMinutes: totalDuration,
        cabin: 'ECONOMY',
      },
    });
  }

  return results;
}

export const mockProvider: FlightsProvider = {
  async search(params: SearchParams) {
    const o = (params.origin || '').toUpperCase();
    const d = (params.destination || '').toUpperCase();
    const date = params.departDate;
    const maxStops = typeof params.maxStops === 'number' ? params.maxStops : undefined;
    const cabin = params.cabin;

    let results = offers.filter((it) =>
      (!o || it.raw?.origin === o) &&
      (!d || it.raw?.destination === d) &&
      (!date || (typeof it.raw?.depart === 'string' && sameDate(it.raw.depart, date))) &&
      (maxStops === undefined || (typeof it.raw?.stops === 'number' && it.raw.stops <= maxStops)) &&
      (!cabin || it.raw?.cabin === cabin)
    );

    // Generate synthetic offers to ensure plenty of options
    if (o && d && date) {
      const synthetic = generateOffers(o, d, date, 18).filter((it) =>
        (maxStops === undefined || (typeof it.raw?.stops === 'number' && it.raw.stops <= maxStops)) &&
        (!cabin || it.raw?.cabin === cabin)
      );
      // Merge and de-duplicate by id
      const map = new Map<string, ProviderOffer>();
      for (const item of [...results, ...synthetic]) map.set(item.id, item);
      results = Array.from(map.values());
    }

    // Default sort: price asc; allow duration sort
    if (params.sort === 'duration') {
      results = results.slice().sort((a, b) => (a.raw?.durationMinutes ?? 0) - (b.raw?.durationMinutes ?? 0));
    } else {
      results = results.slice().sort((a, b) => a.price.amount - b.price.amount);
    }

    return results;
  },
  async getOffer(id: string) {
    const direct = offers.find((o) => o.id === id);
    if (direct) return direct;
    // Try generated id: offgen_ORG_DEST_YYYYMMDD_INDEX
    const m = id.match(/^offgen_([A-Z]{3})_([A-Z]{3})_(\d{8})_(\d{1,2})$/);
    if (m) {
      const [, origin, destination, ymd, idxStr] = m;
      const y = ymd.slice(0, 4), mo = ymd.slice(4, 6), da = ymd.slice(6, 8);
      const date = `${y}-${mo}-${da}`;
      const idx = parseInt(idxStr, 10);
      const list = generateOffers(origin, destination, date, Math.max(20, idx + 1));
      return list[idx] ?? null;
    }
    return null;
  },
  async book(input: BookingInput): Promise<BookingResult> {
    return { orderId: 'ord_mock_' + Date.now(), status: 'CONFIRMED', raw: { input } };
  },
  async cancel() {
    return { status: 'CANCELLED' } as const;
  },
  async getOrder(orderId: string) {
    return { id: orderId, status: 'CONFIRMED' };
  },
};
