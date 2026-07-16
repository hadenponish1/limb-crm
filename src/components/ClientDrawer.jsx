import { useState, useEffect } from 'react'
import { Icon } from './icons'
import { Avatar, StatusBadge, TypeBadge, StageBadge } from './ui'
import { blankService, freqLabel, isoLocal, SOURCES } from '../lib/store'
import ServiceLineFields from './ServiceLineFields'
import JobModal from './JobModal'
import RescheduleModal from './RescheduleModal'
import { geocode } from '../lib/geocode'
import { money, dayParts, fmtTime } from '../lib/format'
import { clientMRR, clientLTV } from '../lib/metrics'
import { googleCalendarUrl } from '../lib/calendar'

export default function ClientDrawer({ client, onClose, updateClient, deleteClient, addNote, deleteNote, jobs, addJob, deleteJob, generateSeries, upsertService, rescheduleSeries }) {
  const [f, setF] = useState(client)
  const [dirty, setDirty] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [openLine, setOpenLine] = useState(null)
  const [sched, setSched] = useState(null) // { jobType, serviceId } | null
  const [resched, setResched] = useState(null) // serviceId | null

  useEffect(() => { setF(client); setDirty(false); setOpenLine(null) }, [client.id])
  // Keep the form synced with the store whenever there are no pending local edits
  // (e.g. after scheduling a job adds a new service line to this client).
  useEffect(() => { if (!dirty) setF(client) }, [client])

  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setDirty(true) }
  const touch = (next) => { setF(next); setDirty(true) }

  function updateLine(id, next) { touch({ ...f, services: f.services.map((s) => (s.id === id ? next : s)) }) }
  function addLine() { const line = blankService(); touch({ ...f, services: [...(f.services || []), line] }); setOpenLine(line.id) }
  function removeLine(id) { touch({ ...f, services: f.services.filter((s) => s.id !== id) }) }

  // Persist the form (minus notes) synchronously so JobModal/generateSeries see the latest services.
  // service line amounts are edited as raw strings (to allow typing decimals) —
  // coerce them back to numbers before persisting.
  const cleanServices = (svcs) => (svcs || []).map((s) => ({ ...s, amount: Number(s.amount) || 0 }))

  function commit() {
    const { notes, ...rest } = f
    updateClient(client.id, { ...rest, services: cleanServices(rest.services) })
    setDirty(false)
  }

  async function save() {
    setSaving(true)
    const { notes, ...rest } = f
    let patch = { ...rest, services: cleanServices(rest.services) }
    if (f.address && f.address !== client.address) {
      const coords = await geocode(f.address)
      if (coords) { patch.lat = coords.lat; patch.lng = coords.lng }
    }
    updateClient(client.id, patch)
    setDirty(false)
    setSaving(false)
  }

  function openScheduler(opts) { commit(); setSched(opts || {}) }
  function closeScheduler() { setDirty(false); setSched(null) }
  function openReschedule(serviceId) { commit(); setResched(serviceId) }

  function submitNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    addNote(client.id, note.trim())
    setNote('')
  }

  const notes = client.notes || []
  const mrr = clientMRR(f)
  const wonTotal = (f.services || []).filter((s) => s.type === 'project' && s.stage === 'won').reduce((a, s) => a + Number(s.amount || 0), 0)

  const todayIso = isoLocal(new Date())
  const clientJobs = (jobs || []).filter((j) => j.clientId === client.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const ltv = clientLTV(client.id, jobs || [])

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="cell-name">
            <Avatar name={f.name} service={f.services?.[0]?.service} />
            <div><b style={{ fontSize: 15 }}>{f.name}</b><small>{f.contact}</small></div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="drawer-badges">
          <StatusBadge status={f.status} />
          {mrr > 0 && <span className="money" style={{ color: 'var(--green)' }}>{money(mrr)}/mo</span>}
          <span className="money" title="Lifetime value from completed jobs" style={{ color: 'var(--moss)' }}>{money(ltv)} LTV</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{(f.services || []).length} service{(f.services || []).length !== 1 ? 's' : ''}</span>
        </div>

        <div className="drawer-body">
          <div className="section-label">Contact</div>
          <div className="field"><label>Account name</label><input value={f.name} onChange={set('name')} /></div>
          <div className="field-row">
            <div className="field"><label>Contact</label><input value={f.contact || ''} onChange={set('contact')} /></div>
            <div className="field"><label>Phone</label><input value={f.phone || ''} onChange={set('phone')} /></div>
          </div>
          <div className="field"><label>Email</label><input value={f.email || ''} onChange={set('email')} /></div>
          <div className="field"><label>Address</label><input value={f.address || ''} onChange={set('address')} /></div>
          <div className="field-row">
            <div className="field"><label>Account stage</label>
              <select value={f.status} onChange={set('status')}><option value="lead">Lead</option><option value="active">Active client</option></select>
            </div>
            <div className="field"><label>Source</label>
              <select value={f.source || 'Other'} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Services</span>
            <button className="btn btn-ghost btn-sm" onClick={addLine}><Icon.plus /> Add service</button>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {(f.services || []).map((s) => {
              const open = openLine === s.id
              const freq = freqLabel(s.frequency)
              const lineJobs = clientJobs.filter((j) => j.serviceId === s.id).length
              return (
                <div className="svc-card" key={s.id}>
                  <button className="svc-head" type="button" onClick={() => setOpenLine(open ? null : s.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <TypeBadge type={s.type} />
                      <b style={{ fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.service}</b>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.type === 'project' && <StageBadge stage={s.stage} />}
                      <span className="money" style={{ fontSize: 13 }}>{money(s.amount)}{s.type === 'recurring' ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>/{freq?.toLowerCase()}</span> : ''}</span>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </button>
                  {open && (
                    <div className="svc-body">
                      <ServiceLineFields line={s} onChange={(next) => updateLine(s.id, next)} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openScheduler({ serviceId: s.id, jobType: s.type === 'recurring' ? 'recurring' : 'oneoff' })}>
                          <Icon.calendar /> Schedule{lineJobs ? ` (${lineJobs})` : ''}
                        </button>
                        {s.type === 'recurring' && rescheduleSeries && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openReschedule(s.id)} title="Replace upcoming visits with the current cadence">
                            <Icon.repeat /> Reschedule
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', marginLeft: 'auto' }} onClick={() => removeLine(s.id)}><Icon.trash /> Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {(f.services || []).length === 0 && <div className="page-sub" style={{ fontSize: 12.5 }}>No services yet — add one above.</div>}
          </div>

          <div className="section-label" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Schedule & jobs</span>
            <button className="btn btn-ghost btn-sm" onClick={() => openScheduler({})}><Icon.plus /> Schedule job</button>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {clientJobs.length === 0 && <div className="page-sub" style={{ fontSize: 12.5 }}>No jobs scheduled. Use “Schedule job” or the button on a service.</div>}
            {clientJobs.map((j) => {
              const dp = dayParts(j.date)
              const past = j.date < todayIso
              const gcal = googleCalendarUrl({ title: `${f.name} — ${j.title}`, dateISO: j.date, time: j.time, durationMin: j.duration, details: j.title, location: f.address || '' })
              return (
                <div className={`mini-job${past ? ' done' : ''}`} key={j.id}>
                  <div className="mini-date"><div className="d">{dp.day}</div><div className="m">{dp.month}</div></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{dp.weekday} · {fmtTime(j.time)} · <span className="money">{money(j.amount)}</span></div>
                  </div>
                  {past
                    ? <span className="badge active" title="Job date has passed">Completed</span>
                    : j.type && <TypeBadge type={j.type} />}
                  <a className="icon-btn" href={gcal} target="_blank" rel="noreferrer" title="Add to Google Calendar"><Icon.calendar style={{ width: 15, height: 15 }} /></a>
                  <button className="icon-btn" onClick={() => deleteJob(j.id)} title="Delete job"><Icon.trash style={{ width: 15, height: 15 }} /></button>
                </div>
              )
            })}
          </div>

          <div className="section-label" style={{ marginTop: 20 }}>Notes & activity</div>
          <form onSubmit={submitNote} style={{ marginBottom: 14 }}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Log a note — site details, quote follow-ups, gate codes…"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, resize: 'vertical', background: '#fff' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost btn-sm" type="submit" disabled={!note.trim()}><Icon.plus /> Add note</button>
            </div>
          </form>
          <div className="note-list">
            {notes.length === 0 && <div className="page-sub" style={{ fontSize: 12.5 }}>No notes yet.</div>}
            {notes.map((n) => (
              <div className="note" key={n.id}>
                <div className="note-body">{n.text}</div>
                <div className="note-meta">
                  <span>{new Date(n.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  <button className="note-del" onClick={() => deleteNote(client.id, n.id)} title="Delete note"><Icon.trash style={{ width: 13, height: 13 }} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Delete this client and their jobs?')) { deleteClient(client.id); onClose() } }}>
            <Icon.trash /> Delete
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button>
          </div>
        </div>
      </aside>

      {sched && (
        <JobModal
          clients={[f]} lockClientId={f.id}
          initialServiceId={sched.serviceId} initialJobType={sched.jobType}
          onClose={closeScheduler} addJob={addJob} upsertService={upsertService} generateSeries={generateSeries}
        />
      )}

      {resched && (
        <RescheduleModal client={client} serviceId={resched} jobs={jobs} reschedule={rescheduleSeries} onClose={() => { setDirty(false); setResched(null) }} />
      )}
    </div>
  )
}
