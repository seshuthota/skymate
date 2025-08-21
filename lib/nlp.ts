// Minimal helpers for normalizing places and dates from loose user input.

const IATA_ALIASES: Record<string, string> = {
  // India
  blr: 'BLR', bengaluru: 'BLR', bangalore: 'BLR',
  bom: 'BOM', mumbai: 'BOM', bombay: 'BOM',
  del: 'DEL', delhi: 'DEL', 'new delhi': 'DEL',
  goi: 'GOI', goa: 'GOI',
  // US
  nyc: 'JFK', 'new york': 'JFK', 'new york city': 'JFK', jfk: 'JFK', ewr: 'EWR', lga: 'LGA',
  sfo: 'SFO', 'san francisco': 'SFO',
  sea: 'SEA', seattle: 'SEA',
  // UK
  lon: 'LHR', london: 'LHR', lhr: 'LHR', lgw: 'LGW',
};

export function normalizePlace(input: string): string {
  const s = (input || '').trim().toLowerCase()
  if (!s) return ''
  // If already looks like an IATA code
  const m = s.match(/^[a-z]{3}$/i)
  if (m) return s.toUpperCase()
  // Try alias map
  if (IATA_ALIASES[s]) return IATA_ALIASES[s]
  // Heuristic: take first word if contains comma (e.g., "London, UK")
  const first = s.split(',')[0].trim()
  if (IATA_ALIASES[first]) return IATA_ALIASES[first]
  // Fallback: return first 3 alpha chars uppercased
  const letters = first.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase()
  return letters.length === 3 ? letters : (IATA_ALIASES['nyc'])
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

export function normalizeDate(input?: string): string {
  const today = new Date()
  function format(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${da}`
  }
  if (!input) return format(today)
  const s = input.trim().toLowerCase()
  if (!s) return format(today)
  // ISO-like
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (s === 'today') return format(today)
  if (s === 'tomorrow') { const d = new Date(today); d.setDate(d.getDate() + 1); return format(d) }
  // next <weekday>
  const nx = s.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/)
  if (nx) {
    const target = WEEKDAYS[nx[1]]
    const d = new Date(today)
    const delta = (7 + target - d.getDay()) % 7 || 7
    d.setDate(d.getDate() + delta)
    return format(d)
  }
  const th = s.match(/^this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/)
  if (th) {
    const target = WEEKDAYS[th[1]]
    const d = new Date(today)
    const delta = (7 + target - d.getDay()) % 7
    d.setDate(d.getDate() + delta)
    return format(d)
  }
  // tonight / morning / evening → today or tomorrow; choose today if before noon
  if (/(tonight|evening|late)/.test(s)) {
    const d = new Date(today)
    if (today.getHours() >= 18) d.setDate(d.getDate() + 1)
    return format(d)
  }
  if (/(morning|afternoon)/.test(s)) {
    return format(today)
  }
  // "next flight" → today
  if (/next\s+flight/.test(s)) return format(today)
  return format(today)
}

