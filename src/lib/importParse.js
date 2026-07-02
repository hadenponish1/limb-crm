// Parses tab-separated rows pasted from Google Sheets into clients + jobs.
// Groups rows into clients by address (each property = one client), and turns
// each row into a completed job. Reuses existing clients when the address matches.

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random())

const HEADER_KEYS = {
  date: ['date', 'day'],
  title: ['event', 'description', 'job', 'task', 'service', 'notes'],
  time: ['time'],
  address: ['address', 'location', 'property'],
  name: ['name', 'client', 'contact', 'customer'],
  amount: ['amount', 'price', 'total', 'paid', 'revenue', 'cost', 'charge'],
  source: ['source', 'lead source', 'channel', 'referral'],
  type: ['type'],
  status: ['status', 'stage'],
}

function detectMap(cells) {
  const map = {}
  cells.forEach((c, i) => {
    const k = (c || '').toLowerCase().trim()
    for (const [field, keys] of Object.entries(HEADER_KEYS)) {
      if (map[field] === undefined && keys.some((kw) => k === kw || k.includes(kw))) map[field] = i
    }
  })
  return map
}

function to24(t) {
  const m = (t || '').trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (!m) return null
  let h = +m[1]
  const min = m[2] ? +m[2] : 0
  const ap = (m[3] || '').toLowerCase()
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return { mins: h * 60 + min, str: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` }
}

export function parseTimeRange(s) {
  if (!s) return { time: '08:00', duration: 60 }
  const parts = String(s).split(/[–—\-to]+/i).map((x) => x.trim()).filter(Boolean)
  const start = to24(parts[0])
  const end = parts[1] ? to24(parts[1]) : null
  const time = start ? start.str : '08:00'
  let duration = 60
  if (start && end) { duration = end.mins - start.mins; if (duration <= 0) duration = 60 }
  return { time, duration }
}

function normDate(s) {
  const t = (s || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  // try common US formats
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) { let [, mo, d, y] = m; if (y.length === 2) y = '20' + y; return `${y}-${String(+mo).padStart(2, '0')}-${String(+d).padStart(2, '0')}` }
  const dt = new Date(t)
  if (!isNaN(dt)) return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  return null
}

function parseAmount(s) { return Number(String(s || '').replace(/[$,\s]/g, '')) || 0 }
export const normAddr = (a) => (a || '').toLowerCase().replace(/,?\s*usa\s*$/i, '').replace(/\s+/g, ' ').trim()

function deriveName(title) {
  const m = String(title || '').split(/\s[-–—]\s/)
  return m.length > 1 ? m[m.length - 1].trim() : ''
}
function inferType(title) {
  return /\bmow|mowing|maintenance|weekly|biweekly/i.test(title || '') ? 'recurring' : 'project'
}

export function parseImport(text, { defaultSource = 'TaskRabbit', defaultStatus = 'lead', existingClients = [] } = {}) {
  const rows = String(text || '').split(/\r?\n/).map((r) => r.split('\t')).filter((r) => r.some((c) => c && c.trim()))
  if (!rows.length) return { error: 'Nothing to import — paste rows copied from your sheet.' }

  let map = detectMap(rows[0])
  let dataRows = rows
  const hasHeader = map.date !== undefined || map.address !== undefined || map.title !== undefined
  if (hasHeader) dataRows = rows.slice(1)
  else map = { date: 0, title: 1, time: 2, address: 3, name: 4, amount: 5 } // fallback to sheet order

  if (map.address === undefined) return { error: 'Couldn\'t find an Address column. Include your header row when copying.' }

  const cell = (row, field) => (map[field] !== undefined ? (row[map[field]] || '').trim() : '')
  const existingByAddr = new Map(existingClients.map((c) => [normAddr(c.address || ''), c]))
  const newByAddr = new Map()
  const jobs = []
  const skipped = []

  dataRows.forEach((row, i) => {
    const address = cell(row, 'address')
    const date = normDate(cell(row, 'date'))
    if (!address || !date) { skipped.push(i + 1); return }
    const key = normAddr(address)

    let clientId
    if (existingByAddr.has(key)) clientId = existingByAddr.get(key).id
    else if (newByAddr.has(key)) clientId = newByAddr.get(key).id
    else {
      const nameCell = cell(row, 'name')
      const title = cell(row, 'title')
      const name = nameCell || deriveName(title) || address.split(',')[0]
      const client = {
        id: uid(), name, contact: nameCell || '', email: '', phone: '', address,
        lat: null, lng: null,
        status: cell(row, 'status') || defaultStatus,
        source: cell(row, 'source') || defaultSource,
        services: [], notes: [],
      }
      newByAddr.set(key, client)
      clientId = client.id
    }

    const { time, duration } = parseTimeRange(cell(row, 'time'))
    const title = cell(row, 'title') || 'Job'
    const amount = parseAmount(cell(row, 'amount'))
    const type = (cell(row, 'type') || inferType(title)).toLowerCase().includes('recur') ? 'recurring' : inferType(title)
    jobs.push({ id: uid(), clientId, serviceId: null, title, date, time, duration, amount, type, recurring: type === 'recurring' })
  })

  const newClients = [...newByAddr.values()]
  const matchedCount = new Set(jobs.map((j) => j.clientId)).size - newClients.length
  return {
    newClients, jobs,
    stats: {
      newClients: newClients.length,
      matchedClients: Math.max(0, matchedCount),
      jobs: jobs.length,
      revenue: jobs.reduce((s, j) => s + j.amount, 0),
      skipped: skipped.length,
    },
    map,
  }
}
