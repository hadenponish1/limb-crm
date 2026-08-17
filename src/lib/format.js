export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

export const money2 = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

export function fmtDate(iso, opts = { month: 'short', day: 'numeric' }) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', opts)
}

export function dayParts(iso) {
  const d = new Date(iso + 'T00:00:00')
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  }
}

// Minutes -> friendly duration, e.g. 240 -> "4h", 90 -> "1h 30m", 45 -> "45m"
export function fmtDuration(min) {
  const m = Math.round(Number(min) || 0)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`
}

const COLORS = ['#6B7F65', '#8a6d3b', '#4d6b7a', '#9a5b4a', '#5c7a4d', '#7a6b8a', '#b08544', '#4a7a6b']
export function colorFor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

export function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
