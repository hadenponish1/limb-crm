import { useState, useEffect, useCallback } from 'react'
import { supabase, isCloud } from './supabase'

const KEY = 'limb-crm:v3'

// ---- Service catalog ----
export const SERVICES = [
  'Lawn Maintenance',
  'Mulch & Beds',
  'Weeding',
  'Landscape Design',
  'Hardscape / Patio',
  'Tree & Shrub Care',
  'Seasonal Cleanup',
  'Irrigation',
  'Sod / Lawn Install',
]

export const FREQUENCIES = [
  { id: 'weekly', label: 'Weekly', perMonth: 4, stepDays: 7 },
  { id: 'biweekly', label: 'Bi-weekly', perMonth: 2, stepDays: 14 },
  { id: 'monthly', label: 'Monthly', perMonth: 1, stepDays: null },
]

// Where a client/lead came from
export const SOURCES = ['TaskRabbit', 'Referral', 'Repeat client', 'Website', 'Direct', 'Other']

export function isoLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

let idCounter = 0
export function newId(prefix) {
  idCounter += 1
  return `${prefix}${Date.now()}-${idCounter}`
}
// UUIDs for rows that map to Postgres tables (clients, jobs)
const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : newId('u'))

export function blankService(overrides = {}) {
  return { id: newId('s'), service: SERVICES[0], type: 'recurring', frequency: 'weekly', amount: 0, time: '08:00', duration: 60, stage: 'won', ...overrides }
}

// ---- Seed data (local/demo mode only) ----
const seed = {
  clients: [
    { id: 'c1', name: 'The Hartwell Residence', contact: 'Diane Hartwell', email: 'diane.h@gmail.com', phone: '(724) 555-0142', address: '412 Saxonburg Blvd, Saxonburg, PA', lat: 40.7534, lng: -79.8103, status: 'active', createdAt: '2026-04-06', services: [{ id: 's1a', service: 'Lawn Maintenance', type: 'recurring', frequency: 'biweekly', amount: 145, time: '08:00', duration: 60 }, { id: 's1b', service: 'Weeding', type: 'recurring', frequency: 'monthly', amount: 95, time: '08:00', duration: 45 }, { id: 's1c', service: 'Seasonal Cleanup', type: 'project', stage: 'quoted', amount: 850 }], notes: [{ id: 'n1', text: 'Gate code is 4412. Dog is friendly but keep the side gate shut.', at: '2026-04-06T14:20:00' }] },
    { id: 'c2', name: 'Maple Grove HOA', contact: 'Rick Alvarez', email: 'board@maplegrovehoa.org', phone: '(724) 555-0199', address: '88 Freeport Rd, Sarver, PA', lat: 40.7402, lng: -79.7361, status: 'active', createdAt: '2026-03-16', services: [{ id: 's2a', service: 'Lawn Maintenance', type: 'recurring', frequency: 'weekly', amount: 620, time: '08:00', duration: 240 }, { id: 's2b', service: 'Mulch & Beds', type: 'project', stage: 'won', amount: 3200 }], notes: [] },
    { id: 'c3', name: 'Bianchi Backyard Reno', contact: 'Marco Bianchi', email: 'marco.bianchi@outlook.com', phone: '(412) 555-0176', address: '210 Cedar Ridge Dr, Gibsonia, PA', lat: 40.6423, lng: -79.9711, status: 'active', createdAt: '2026-05-11', services: [{ id: 's3a', service: 'Hardscape / Patio', type: 'project', stage: 'won', amount: 18400 }], notes: [{ id: 'n2', text: 'Approved 400 sq ft paver patio + fire pit. Deposit paid 5/12.', at: '2026-05-12T09:10:00' }] },
    { id: 'c4', name: 'Okafor Family', contact: 'Ada Okafor', email: 'ada.okafor@gmail.com', phone: '(724) 555-0121', address: '55 Powder Mill Rd, Mars, PA', lat: 40.6959, lng: -80.0134, status: 'active', createdAt: '2026-04-27', services: [{ id: 's4a', service: 'Mulch & Beds', type: 'recurring', frequency: 'monthly', amount: 240, time: '13:00', duration: 120 }], notes: [] },
    { id: 'c5', name: 'Greenbriar Dental', contact: 'Dr. Lena Voss', email: 'office@greenbriardental.com', phone: '(724) 555-0188', address: '900 Rochester Rd, Cranberry Twp, PA', lat: 40.6845, lng: -80.1073, status: 'active', createdAt: '2026-03-31', services: [{ id: 's5a', service: 'Lawn Maintenance', type: 'recurring', frequency: 'weekly', amount: 310, time: '10:30', duration: 90 }, { id: 's5b', service: 'Sod / Lawn Install', type: 'project', stage: 'won', amount: 2600 }], notes: [] },
    { id: 'c6', name: 'Delgado New Build', contact: 'Sofia Delgado', email: 'sofia.d.build@gmail.com', phone: '(412) 555-0155', address: '18 Hidden Valley Rd, Wexford, PA', lat: 40.6234, lng: -80.0562, status: 'lead', createdAt: '2026-06-20', services: [{ id: 's6a', service: 'Landscape Design', type: 'project', stage: 'quoted', amount: 9600 }], notes: [{ id: 'n3', text: 'Wants full front + back design. Send proposal by 7/5.', at: '2026-06-20T16:45:00' }] },
    { id: 'c7', name: 'Thompson Estate', contact: 'Gary Thompson', email: 'gthompson@yahoo.com', phone: '(724) 555-0133', address: '340 Glade Run Rd, Valencia, PA', lat: 40.6801, lng: -79.9345, status: 'lead', createdAt: '2026-06-25', services: [{ id: 's7a', service: 'Tree & Shrub Care', type: 'project', stage: 'quoted', amount: 4200 }], notes: [] },
    { id: 'c8', name: 'Riverside Apartments', contact: 'Property Mgmt', email: 'pm@riversideapts.net', phone: '(412) 555-0198', address: '1200 Freeport Rd, Fox Chapel, PA', lat: 40.5245, lng: -79.8934, status: 'active', createdAt: '2026-04-13', services: [{ id: 's8a', service: 'Lawn Maintenance', type: 'recurring', frequency: 'biweekly', amount: 480, time: '09:00', duration: 180 }], notes: [] },
    { id: 'c9', name: 'Nguyen Patio Project', contact: 'Kevin Nguyen', email: 'kevin.nguyen@gmail.com', phone: '(724) 555-0167', address: '77 Meadowbrook Ln, Butler, PA', lat: 40.8612, lng: -79.8953, status: 'active', createdAt: '2026-05-29', services: [{ id: 's9a', service: 'Hardscape / Patio', type: 'project', stage: 'won', amount: 12300 }], notes: [] },
  ],
  jobs: [
    hj('c2', 's2a', 'Lawn Maintenance', '2026-04-06', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-04-13', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-04-20', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-04-27', 240, 620),
    hj('c5', 's5a', 'Lawn Maintenance', '2026-04-10', 90, 310), hj('c5', 's5a', 'Lawn Maintenance', '2026-04-24', 90, 310), hj('c1', 's1a', 'Lawn Maintenance', '2026-04-15', 60, 145),
    hj('c2', 's2a', 'Lawn Maintenance', '2026-05-04', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-05-11', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-05-18', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-05-25', 240, 620),
    hj('c5', 's5a', 'Lawn Maintenance', '2026-05-08', 90, 310), hj('c5', 's5a', 'Lawn Maintenance', '2026-05-22', 90, 310), hj('c8', 's8a', 'Lawn Maintenance', '2026-05-05', 180, 480), hj('c8', 's8a', 'Lawn Maintenance', '2026-05-19', 180, 480),
    hj('c1', 's1a', 'Lawn Maintenance', '2026-05-13', 60, 145), hj('c3', 's3a', 'Patio build — progress draw', '2026-05-20', 480, 9000, 'project'),
    hj('c2', 's2a', 'Lawn Maintenance', '2026-06-01', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-06-15', 240, 620), hj('c2', 's2a', 'Lawn Maintenance', '2026-06-29', 240, 620),
    hj('c5', 's5a', 'Lawn Maintenance', '2026-06-05', 90, 310), hj('c5', 's5a', 'Lawn Maintenance', '2026-06-19', 90, 310), hj('c8', 's8a', 'Lawn Maintenance', '2026-06-02', 180, 480), hj('c8', 's8a', 'Lawn Maintenance', '2026-06-16', 180, 480),
    hj('c4', 's4a', 'Mulch & Beds', '2026-06-10', 120, 240), hj('c5', 's5b', 'Sod / Lawn Install', '2026-06-20', 300, 2600, 'project'), hj('c9', 's9a', 'Patio — footers & base', '2026-06-24', 420, 6000, 'project'),
    { id: 'j3', clientId: 'c3', serviceId: 's3a', title: 'Paver base + excavation', date: dstr(3), time: '07:30', duration: 480, amount: 4600, type: 'project' },
    { id: 'j6', clientId: 'c9', serviceId: 's9a', title: 'Patio layout & footers', date: dstr(6), time: '08:00', duration: 360, amount: 3100, type: 'project' },
  ],
}

function hj(clientId, serviceId, title, date, duration, amount, type = 'recurring') {
  return { id: `seed-${clientId}-${serviceId}-${date}`, clientId, serviceId, title, date, time: '08:00', duration, amount, type, recurring: type === 'recurring' }
}
function dstr(offsetDays) { const d = new Date(); d.setDate(d.getDate() + offsetDays); return isoLocal(d) }

// Give seed clients a demo source so the badge/filter is visible in local mode
seed.clients.forEach((c, i) => { if (!c.source) c.source = ['TaskRabbit', 'Referral', 'Direct'][i % 3] })

function loadLocal() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) } catch (e) { /* ignore */ }
  return seed
}

// ---- Row <-> app mapping (cloud mode) ----
const rowToClient = (r) => ({ id: r.id, name: r.name, contact: r.contact, email: r.email, phone: r.phone, address: r.address, lat: r.lat, lng: r.lng, status: r.status, source: r.source || '', services: r.services || [], notes: r.notes || [], createdAt: (r.created_at || '').slice(0, 10) })
const rowToJob = (r) => ({ id: r.id, clientId: r.client_id, serviceId: r.service_id, title: r.title, date: r.date, time: r.time, duration: r.duration, amount: Number(r.amount) || 0, type: r.type, recurring: r.recurring })
const clientToRow = (c) => ({ id: c.id, name: c.name, contact: c.contact, email: c.email, phone: c.phone, address: c.address, lat: c.lat, lng: c.lng, status: c.status, source: c.source || null, services: c.services || [], notes: c.notes || [] })
const jobToRow = (j) => ({ id: j.id, client_id: j.clientId, service_id: j.serviceId, title: j.title, date: j.date, time: j.time, duration: j.duration, amount: j.amount, type: j.type, recurring: !!j.recurring })

// ---- Shared in-memory store (source of truth for the UI in both modes) ----
let listeners = []
let state = isCloud ? { clients: [], jobs: [] } : loadLocal()
let loading = isCloud
let loadStarted = false

function notify() { listeners.forEach((l) => l()) }
function commit() {
  if (!isCloud) { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* ignore */ } }
  notify()
}

// Background Supabase writes (optimistic UI already updated). Errors are logged.
const cloud = {
  async load() {
    const [{ data: cRows, error: e1 }, { data: jRows, error: e2 }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: true }),
      supabase.from('jobs').select('*'),
    ])
    if (e1 || e2) console.error('Load failed', e1 || e2)
    state = { clients: (cRows || []).map(rowToClient), jobs: (jRows || []).map(rowToJob) }
    loading = false
    notify()
  },
  insertClient: (c) => supabase.from('clients').insert(clientToRow(c)).then(({ error }) => error && console.error(error)),
  insertClients: (cs) => supabase.from('clients').insert(cs.map(clientToRow)).then(({ error }) => error && console.error(error)),
  updateClient: (c) => supabase.from('clients').update(clientToRow(c)).eq('id', c.id).then(({ error }) => error && console.error(error)),
  deleteClients: (ids) => supabase.from('clients').delete().in('id', ids).then(({ error }) => error && console.error(error)),
  insertJobs: (jobs) => supabase.from('jobs').insert(jobs.map(jobToRow)).then(({ error }) => error && console.error(error)),
  deleteJob: (id) => supabase.from('jobs').delete().eq('id', id).then(({ error }) => error && console.error(error)),
}

function visitsFor(client, line, today, horizon, startISO) {
  const out = []
  const freq = FREQUENCIES.find((f) => f.id === line.frequency)
  if (!freq) return out
  let d = new Date((startISO || line.startDate || client.createdAt || isoLocal(today)) + 'T00:00:00')
  d.setHours(0, 0, 0, 0)
  const advance = () => { if (freq.stepDays) d.setDate(d.getDate() + freq.stepDays); else d.setMonth(d.getMonth() + 1) }
  let guard = 0
  while (d < today && guard++ < 5000) advance()
  guard = 0
  while (d <= horizon && guard++ < 5000) {
    out.push({ clientId: client.id, serviceId: line.id, title: line.service, date: isoLocal(d), time: line.time || '08:00', duration: line.duration || 60, amount: line.amount, type: 'recurring', recurring: true })
    advance()
  }
  return out
}

const jobKey = (j) => `${j.clientId}|${j.serviceId || ''}|${j.date}`
const findClient = (id) => state.clients.find((c) => c.id === id)

export function useStore() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const l = () => setTick((t) => t + 1)
    listeners.push(l)
    if (isCloud && !loadStarted) { loadStarted = true; cloud.load() }
    return () => { listeners = listeners.filter((x) => x !== l) }
  }, [])

  const addClient = useCallback((client) => {
    const c = { ...client, id: uid(), notes: client.notes || [], services: client.services || [] }
    state = { ...state, clients: [c, ...state.clients] }
    commit()
    if (isCloud) cloud.insertClient(c)
  }, [])

  const persistClient = (id) => { if (isCloud) { const c = findClient(id); if (c) cloud.updateClient(c) } }

  const updateClient = useCallback((id, patch) => {
    state = { ...state, clients: state.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }
    commit(); persistClient(id)
  }, [])

  const deleteClient = useCallback((id) => {
    state = { ...state, clients: state.clients.filter((c) => c.id !== id), jobs: state.jobs.filter((j) => j.clientId !== id) }
    commit(); if (isCloud) cloud.deleteClients([id])
  }, [])

  const deleteClients = useCallback((ids) => {
    const set = new Set(ids)
    state = { ...state, clients: state.clients.filter((c) => !set.has(c.id)), jobs: state.jobs.filter((j) => !set.has(j.clientId)) }
    commit(); if (isCloud) cloud.deleteClients(ids)
  }, [])

  const addNote = useCallback((clientId, text) => {
    const note = { id: newId('n'), text, at: new Date().toISOString() }
    state = { ...state, clients: state.clients.map((c) => (c.id === clientId ? { ...c, notes: [note, ...(c.notes || [])] } : c)) }
    commit(); persistClient(clientId)
  }, [])

  const deleteNote = useCallback((clientId, noteId) => {
    state = { ...state, clients: state.clients.map((c) => (c.id === clientId ? { ...c, notes: (c.notes || []).filter((n) => n.id !== noteId) } : c)) }
    commit(); persistClient(clientId)
  }, [])

  const upsertService = useCallback((clientId, service) => {
    const withId = service.id ? service : { ...service, id: newId('s') }
    state = {
      ...state,
      clients: state.clients.map((c) => {
        if (c.id !== clientId) return c
        const has = (c.services || []).some((s) => s.id === withId.id)
        const services = has ? c.services.map((s) => (s.id === withId.id ? { ...s, ...withId } : s)) : [...(c.services || []), withId]
        return { ...c, services }
      }),
    }
    commit(); persistClient(clientId)
    return withId.id
  }, [])

  const addJob = useCallback((job) => {
    const j = { ...job, id: uid() }
    state = { ...state, jobs: [j, ...state.jobs] }
    commit(); if (isCloud) cloud.insertJobs([j])
  }, [])

  const deleteJob = useCallback((id) => {
    state = { ...state, jobs: state.jobs.filter((j) => j.id !== id) }
    commit(); if (isCloud) cloud.deleteJob(id)
  }, [])

  const generateSeries = useCallback((clientId, serviceId, weeks = 8, startISO) => {
    const client = findClient(clientId)
    const line = client?.services.find((s) => s.id === serviceId)
    if (!client || !line) return 0
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + weeks * 7)
    const existing = new Set(state.jobs.map(jobKey))
    const created = []
    visitsFor(client, line, today, horizon, startISO).forEach((v) => { if (!existing.has(jobKey(v))) { created.push({ ...v, id: uid() }); existing.add(jobKey(v)) } })
    if (created.length) { state = { ...state, jobs: [...created, ...state.jobs] }; commit(); if (isCloud) cloud.insertJobs(created) }
    return created.length
  }, [])

  const previewRecurring = useCallback((weeks = 8) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + weeks * 7)
    const existing = new Set(state.jobs.map(jobKey))
    const perClient = []
    let total = 0
    state.clients.filter((c) => c.status === 'active').forEach((c) => {
      let count = 0
      c.services.filter((s) => s.type === 'recurring').forEach((line) => { count += visitsFor(c, line, today, horizon).filter((v) => !existing.has(jobKey(v))).length })
      if (count) perClient.push({ client: c, count })
      total += count
    })
    return { total, perClient }
  }, [])

  const generateRecurring = useCallback((weeks = 8) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + weeks * 7)
    const existing = new Set(state.jobs.map(jobKey))
    const created = []
    state.clients.filter((c) => c.status === 'active').forEach((c) => {
      c.services.filter((s) => s.type === 'recurring').forEach((line) => {
        visitsFor(c, line, today, horizon).forEach((v) => { if (!existing.has(jobKey(v))) { created.push({ ...v, id: uid() }); existing.add(jobKey(v)) } })
      })
    })
    if (created.length) { state = { ...state, jobs: [...created, ...state.jobs] }; commit(); if (isCloud) cloud.insertJobs(created) }
    return created.length
  }, [])

  const bulkImport = useCallback(({ clients: nc = [], jobs: nj = [] }) => {
    state = { ...state, clients: [...nc, ...state.clients], jobs: [...nj, ...state.jobs] }
    commit()
    if (isCloud) { if (nc.length) cloud.insertClients(nc); if (nj.length) cloud.insertJobs(nj) }
  }, [])

  const reset = useCallback(() => { if (!isCloud) { state = seed; commit() } }, [])

  return {
    ...state, loading, cloud: isCloud,
    addClient, updateClient, deleteClient, deleteClients, addNote, deleteNote, upsertService,
    addJob, deleteJob, generateSeries, previewRecurring, generateRecurring, bulkImport, reset,
  }
}
