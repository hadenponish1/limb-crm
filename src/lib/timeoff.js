// Time-off blocks: multi-day, all-day calendar bars for days you're not working.
export const TIMEOFF_TYPES = [
  { id: 'vacation', label: 'Vacation', color: '#4d6b7a' },
  { id: 'holiday', label: 'Holiday', color: '#5c7a4d' },
  { id: 'personal', label: 'Personal', color: '#7a6b8a' },
  { id: 'weather', label: 'Weather', color: '#8a6d3b' },
]

export function timeoffType(id) {
  return TIMEOFF_TYPES.find((t) => t.id === id) || TIMEOFF_TYPES[0]
}

// Blocks covering a given ISO date (inclusive range). Sorted by start for stable stacking.
export function timeOffOnDate(blocks, iso) {
  return (blocks || [])
    .filter((b) => b.start && b.end && b.start <= iso && iso <= b.end)
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
}

export const isDayOff = (blocks, iso) => timeOffOnDate(blocks, iso).length > 0

// Short human label for a block's span, e.g. "Thu, Aug 13 – Sun, Aug 16" or a single day.
export function timeOffRangeLabel(b) {
  const opt = { weekday: 'short', month: 'short', day: 'numeric' }
  const s = new Date(b.start + 'T00:00:00').toLocaleDateString('en-US', opt)
  if (b.end === b.start) return s
  const e = new Date(b.end + 'T00:00:00').toLocaleDateString('en-US', opt)
  return `${s} – ${e}`
}
