import { useState, useEffect, useRef } from 'react'
import { Icon } from './icons'
import { isoLocal, SERVICES, FREQUENCIES } from '../lib/store'
import { googleCalendarUrl } from '../lib/calendar'

// Shared job scheduler used by both the Schedule calendar and the client drawer.
// Pass `lockClientId` to fix it to one client (hides the client dropdown).
export default function JobModal({
  clients, lockClientId, initialClientId, initialDate, initialServiceId, initialJobType,
  onClose, addJob, upsertService, generateSeries,
}) {
  const startClient = lockClientId || initialClientId || clients[0]?.id || ''
  const [clientId, setClientId] = useState(startClient)
  const [jobType, setJobType] = useState(initialJobType || 'recurring') // recurring | oneoff

  const client = clients.find((c) => c.id === clientId)
  const wantType = jobType === 'recurring' ? 'recurring' : 'project'
  const matching = (client?.services || []).filter((s) => s.type === wantType)

  const [serviceSel, setServiceSel] = useState(initialServiceId || matching[0]?.id || '__new__')
  const [svcName, setSvcName] = useState(SERVICES[0])
  const [freq, setFreq] = useState('weekly')
  const [time, setTime] = useState('08:00')
  const [duration, setDuration] = useState(60)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate || isoLocal(new Date()))
  const [weeks, setWeeks] = useState(8)
  const [pushGoogle, setPushGoogle] = useState(true)
  const [result, setResult] = useState(null)

  // don't clobber the caller's initial service on the first render
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setServiceSel(matching[0]?.id || '__new__')
  }, [clientId, jobType])

  // prefill from an existing selected service line
  useEffect(() => {
    if (serviceSel === '__new__') return
    const line = (client?.services || []).find((s) => s.id === serviceSel)
    if (!line) return
    setSvcName(line.service)
    setAmount(String(line.amount ?? ''))
    if (line.type === 'recurring') { setFreq(line.frequency || 'weekly'); setTime(line.time || '08:00'); setDuration(line.duration || 60) }
  }, [serviceSel])

  function submit(e) {
    e.preventDefault()
    let serviceId = serviceSel
    if (jobType === 'recurring') {
      const line = { service: svcName, type: 'recurring', frequency: freq, amount: Number(amount) || 0, time, duration: Number(duration) || 60 }
      if (serviceSel !== '__new__') line.id = serviceSel
      serviceId = upsertService(clientId, line)
      const n = generateSeries(clientId, serviceId, weeks, date)
      setResult({ recurring: true, n })
    } else {
      if (serviceSel === '__new__') {
        serviceId = upsertService(clientId, { service: svcName, type: 'project', stage: 'won', amount: Number(amount) || 0 })
      }
      const job = { clientId, serviceId, title: title || svcName, date, time, duration: Number(duration) || 60, amount: Number(amount) || 0, type: 'project' }
      addJob(job)
      if (pushGoogle) {
        window.open(googleCalendarUrl({ title: `${client?.name || 'Job'} — ${job.title}`, dateISO: date, time, durationMin: job.duration, details: job.title, location: client?.address || '' }), '_blank')
      }
      onClose()
    }
  }

  if (result?.recurring) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-head"><div className="card-title">Recurring service scheduled</div><button className="icon-btn" onClick={onClose}><Icon.x /></button></div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '18px 26px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6efe0', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <Icon.repeat style={{ width: 26, height: 26, color: '#3f6b3d' }} />
            </div>
            <div className="card-title">{result.n} visit{result.n !== 1 ? 's' : ''} added</div>
            <div className="page-sub" style={{ marginTop: 6 }}>{svcName} · {FREQUENCIES.find((x) => x.id === freq)?.label.toLowerCase()} for {client?.name}. Open each from the calendar to push to Google.</div>
          </div>
          <div className="modal-foot"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="card-title">Schedule a job</div>
            {lockClientId && <div className="page-sub">{client?.name}</div>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          {!lockClientId && (
            <div className="field">
              <label>Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="field">
            <label>Job type</label>
            <div className="seg">
              <button type="button" className={jobType === 'recurring' ? 'on' : ''} onClick={() => setJobType('recurring')}>
                <Icon.repeat style={{ width: 14, height: 14, verticalAlign: '-2px', marginRight: 6 }} />Recurring
              </button>
              <button type="button" className={jobType === 'oneoff' ? 'on' : ''} onClick={() => setJobType('oneoff')}>
                <Icon.briefcase style={{ width: 14, height: 14, verticalAlign: '-2px', marginRight: 6 }} />One-off
              </button>
            </div>
            <div className="page-sub" style={{ marginTop: 6, fontSize: 12 }}>
              {jobType === 'recurring' ? 'Auto-generates visits on a cadence and saves as a recurring service.' : 'Creates a single job and logs it as a project on the client.'}
            </div>
          </div>

          <div className="field">
            <label>Service</label>
            <select value={serviceSel} onChange={(e) => setServiceSel(e.target.value)}>
              {matching.map((s) => <option key={s.id} value={s.id}>{s.service}{s.type === 'recurring' ? ` · ${FREQUENCIES.find((x) => x.id === s.frequency)?.label.toLowerCase()}` : ''}</option>)}
              <option value="__new__">➕ New {jobType === 'recurring' ? 'recurring' : 'one-off'} service…</option>
            </select>
          </div>

          {serviceSel === '__new__' && (
            <div className="field">
              <label>Service type</label>
              <select value={svcName} onChange={(e) => setSvcName(e.target.value)}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
          )}

          {jobType === 'recurring' ? (
            <>
              <div className="field-row">
                <div className="field"><label>Price / visit</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required /></div>
                <div className="field"><label>Frequency</label>
                  <select value={freq} onChange={(e) => setFreq(e.target.value)}>{FREQUENCIES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                </div>
              </div>
              <div className="field-row">
                <div className="field"><label>First visit</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                <div className="field"><label>Start time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
              </div>
              <div className="field">
                <label>Generate visits for the next…</label>
                <div className="seg">{[4, 8, 12].map((w) => <button key={w} type="button" className={weeks === w ? 'on' : ''} onClick={() => setWeeks(w)}>{w} weeks</button>)}</div>
              </div>
            </>
          ) : (
            <>
              <div className="field"><label>Job description</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={svcName} /></div>
              <div className="field-row">
                <div className="field"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                <div className="field"><label>Start time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Duration (min)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
                <div className="field"><label>Amount</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
                <input type="checkbox" checked={pushGoogle} onChange={(e) => setPushGoogle(e.target.checked)} style={{ width: 16, height: 16 }} />
                Open in Google Calendar after saving
              </label>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{jobType === 'recurring' ? 'Generate visits' : 'Save job'}</button>
        </div>
      </form>
    </div>
  )
}
