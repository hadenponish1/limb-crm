import { FREQUENCIES } from './store'

const perMonth = (freq) => FREQUENCIES.find((f) => f.id === freq)?.perMonth || 1

// ---- Per-client derivations ----
export const recurringLines = (c) => (c.services || []).filter((s) => s.type === 'recurring')
export const projectLines = (c) => (c.services || []).filter((s) => s.type === 'project')

// Monthly recurring revenue for one active client
export function clientMRR(c) {
  if (c.status !== 'active') return 0
  return recurringLines(c).reduce((s, l) => s + l.amount * perMonth(l.frequency), 0)
}
// Won project value booked for a client
export function clientWonProjects(c) {
  return projectLines(c).filter((l) => l.stage === 'won').reduce((s, l) => s + (Number(l.amount) || 0), 0)
}
export function clientQuotedProjects(c) {
  return projectLines(c).filter((l) => l.stage !== 'won').reduce((s, l) => s + (Number(l.amount) || 0), 0)
}

// Monthly $ for one recurring service line
export function recurringMonthly(line) {
  return (Number(line.amount) || 0) * perMonth(line.frequency)
}
// Rows for the "recurring maintenance" breakdown: one per recurring line on an active client
export function maintenanceReport(clients) {
  const rows = []
  clients.filter((c) => c.status === 'active').forEach((c) =>
    recurringLines(c).forEach((l) => rows.push({ clientId: c.id, name: c.name, source: c.source, service: l.service, frequency: l.frequency, amount: Number(l.amount) || 0, monthly: recurringMonthly(l) })))
  return rows.sort((a, b) => b.monthly - a.monthly)
}

// A short label for the client's overall relationship
export function clientKind(c) {
  const r = recurringLines(c).length
  const p = projectLines(c).length
  if (r && p) return 'mixed'
  if (r) return 'recurring'
  if (p) return 'project'
  return 'none'
}

export function clientColor(c) {
  if (c.status === 'lead') return '#4d6b7a'
  const kind = clientKind(c)
  if (kind === 'project') return '#c99a4b'
  return '#6B7F65' // recurring or mixed
}

// ---- Portfolio totals ----
export function monthlyRecurring(clients) {
  return clients.reduce((sum, c) => sum + clientMRR(c), 0)
}

export function bookedThisMonth(jobs) {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  return jobs
    .filter((j) => { const d = new Date(j.date + 'T00:00:00'); return d.getMonth() === m && d.getFullYear() === y })
    .reduce((sum, j) => sum + (j.amount || 0), 0)
}

export function projectRevenue(clients, months = 6) {
  const mrr = monthlyRecurring(clients)
  let activeProjects = 0
  let pipeline = 0
  clients.forEach((c) => {
    activeProjects += clientWonProjects(c)
    pipeline += clientQuotedProjects(c) * 0.4
  })
  const series = []
  const now = new Date()
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const projShare = i < 3 ? activeProjects / 3 : 0
    const pipeShare = i >= 1 && i < 4 ? pipeline / 3 : 0
    series.push({ month: label, recurring: Math.round(mrr), projects: Math.round(projShare), pipeline: Math.round(pipeShare), total: Math.round(mrr + projShare + pipeShare) })
  }
  return { series, mrr, activeProjects, pipeline }
}

export function counts(clients) {
  let recLines = 0
  let projLines = 0
  let recurringClients = 0
  let projectClients = 0
  clients.forEach((c) => {
    const r = recurringLines(c).length
    const p = projectLines(c).length
    recLines += r
    projLines += p
    if (r && c.status === 'active') recurringClients += 1
    if (p) projectClients += 1
  })
  return {
    recurring: recLines,
    project: projLines,
    recurringClients,
    projectClients,
    leads: clients.filter((c) => c.status === 'lead').length,
    active: clients.filter((c) => c.status === 'active').length,
    total: clients.length,
  }
}

// Lifetime value per client = revenue from their completed (past-dated) jobs.
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function ltvByClient(jobs) {
  const t = todayISO()
  const m = {}
  jobs.forEach((j) => { if (j.date && j.date < t) m[j.clientId] = (m[j.clientId] || 0) + (j.amount || 0) })
  return m
}
export function clientLTV(clientId, jobs) {
  const t = todayISO()
  return jobs.filter((j) => j.clientId === clientId && j.date && j.date < t).reduce((s, j) => s + (j.amount || 0), 0)
}

// Actual booked revenue per calendar month, keyed 'YYYY-MM', from the job schedule.
export function monthlyActual(jobs) {
  const map = {}
  jobs.forEach((j) => { const key = (j.date || '').slice(0, 7); if (key) map[key] = (map[key] || 0) + (j.amount || 0) })
  return map
}

// Month-by-month timeline: actual (booked jobs) for past/current months, projected for future months.
// Returns { series, ytd, projectedNext } where series items are { month, actual, projected }.
export function revenueTimeline(jobs, clients, forwardMonths = 3) {
  const now = new Date()
  const curIdx = now.getFullYear() * 12 + now.getMonth()
  const actualMap = monthlyActual(jobs)
  const mrr = monthlyRecurring(clients)

  // How much of each project has already been booked as jobs — so we don't
  // forecast contract value that's already been realized as actual revenue.
  const bookedByService = {}
  jobs.forEach((j) => { if (j.serviceId) bookedByService[j.serviceId] = (bookedByService[j.serviceId] || 0) + (j.amount || 0) })

  let remainingWon = 0
  let pipeline = 0
  clients.forEach((c) => projectLines(c).forEach((l) => {
    if (l.stage === 'won') remainingWon += Math.max(0, (l.amount || 0) - (bookedByService[l.id] || 0))
    else pipeline += (l.amount || 0) * 0.4
  }))

  // start at the earliest month with a job (but never after the current month)
  const keys = Object.keys(actualMap).sort()
  let startIdx = curIdx
  if (keys.length) { const [y, m] = keys[0].split('-').map(Number); startIdx = Math.min(y * 12 + (m - 1), curIdx) }
  const endIdx = curIdx + forwardMonths

  const series = []
  let ytd = 0
  let projectedNext = 0
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const y = Math.floor(idx / 12)
    const m = idx % 12
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    const d = new Date(y, m, 1)
    const label = d.toLocaleDateString('en-US', m === 0 ? { month: 'short', year: '2-digit' } : { month: 'short' })
    const future = idx > curIdx
    let actual = 0
    let projected = 0
    if (future) {
      const fo = idx - curIdx // 1, 2, 3 ...
      const share = fo <= 3 ? (remainingWon + pipeline) / 3 : 0 // spread remaining project work over the next 3 months
      projected = Math.round(mrr + share)
      projectedNext += projected
    } else {
      actual = actualMap[key] || 0
      if (y === now.getFullYear()) ytd += actual
    }
    series.push({ month: label, actual: Math.round(actual), projected })
  }
  return { series, ytd, projectedNext }
}

// Monthly revenue split by service line
export function byService(clients) {
  const map = {}
  clients.forEach((c) => {
    (c.services || []).forEach((s) => {
      let monthly = 0
      if (s.type === 'recurring') monthly = c.status === 'active' ? s.amount * perMonth(s.frequency) : 0
      else monthly = s.stage === 'won' ? s.amount / 6 : 0
      if (monthly) map[s.service] = (map[s.service] || 0) + monthly
    })
  })
  return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)
}
