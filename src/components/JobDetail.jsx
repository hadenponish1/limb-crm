import { useState } from 'react'
import { Icon } from './icons'
import { money } from '../lib/format'
import { googleCalendarUrl, downloadICS } from '../lib/calendar'
import { directionsUrl } from '../lib/maps'

// Edit a single job (used by both Schedule and Metrics day panels).
export default function JobDetail({ job, client, onClose, onDelete, updateJob, onOpenClient }) {
  const [f, setF] = useState({ title: job.title || '', date: job.date, time: job.time || '08:00', duration: job.duration || 60, amount: job.amount ?? 0, notes: job.notes || '' })
  const [dirty, setDirty] = useState(false)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setDirty(true) }

  function save() {
    const patch = { title: f.title, date: f.date, time: f.time, duration: Number(f.duration) || 60, amount: Number(f.amount) || 0 }
    // only send notes when it changed, so time/amount edits don't require the
    // notes column to exist yet (supabase/add-job-notes.sql)
    if (f.notes !== (job.notes || '')) patch.notes = f.notes
    updateJob(job.id, patch)
    setDirty(false)
    onClose()
  }

  const gcal = googleCalendarUrl({
    title: `${client?.name || 'Job'} — ${f.title}`,
    dateISO: f.date, time: f.time, durationMin: Number(f.duration) || 60,
    details: `${f.title}${f.notes ? `\n${f.notes}` : ''}\nClient: ${client?.contact || ''} ${client?.phone || ''}\nAmount: ${money(Number(f.amount) || 0)}`,
    location: client?.address || '',
  })
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            {onOpenClient && client ? (
              <button type="button" className="title-link" onClick={() => { onOpenClient(client.id); onClose() }} title="Open client profile">
                <span className="card-title">{client.name}</span> <Icon.external style={{ width: 15, height: 15, color: 'var(--muted)', verticalAlign: '-2px' }} />
              </button>
            ) : (
              <div className="card-title">{client?.name}</div>
            )}
            {client?.address && (
              <a className="addr-link" href={directionsUrl(client.address)} target="_blank" rel="noreferrer" title="Open in Apple Maps">
                <Icon.pin style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> {client.address}
              </a>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          <div className="field"><label>Job description</label><input value={f.title} onChange={set('title')} placeholder="e.g. Lawn Maintenance" /></div>
          <div className="field-row">
            <div className="field"><label>Date</label><input type="date" value={f.date} onChange={set('date')} /></div>
            <div className="field"><label>Start time</label><input type="time" value={f.time} onChange={set('time')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Duration (min)</label><input type="number" value={f.duration} onChange={set('duration')} /></div>
            <div className="field"><label>Amount</label><input type="number" step="0.01" value={f.amount} onChange={set('amount')} /></div>
          </div>
          <div className="field"><label>Notes</label><textarea value={f.notes} onChange={set('notes')} rows={3} placeholder="e.g. mulch the front beds, pull weeds in back, gate code 1234" /></div>
          {job.recurring && <div className="detail-row" style={{ color: 'var(--green)', borderBottom: 'none', paddingTop: 0 }}><Icon.repeat /> <span>Auto-generated recurring visit</span></div>}
          {client?.address && (
            <a className="btn btn-primary btn-sm" href={directionsUrl(client.address)} target="_blank" rel="noreferrer" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}><Icon.navigation /> Directions</a>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <a className="btn btn-ghost btn-sm" href={gcal} target="_blank" rel="noreferrer" style={{ flex: 1, justifyContent: 'center' }}><Icon.calendar /> Google Calendar</a>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadICS({ title: `${client?.name} — ${f.title}`, dateISO: f.date, time: f.time, durationMin: Number(f.duration) || 60, location: client?.address })}><Icon.download /> .ics</button>
          </div>
        </div>
        <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(job.id)}><Icon.trash /> Delete</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={save} disabled={!dirty}>{dirty ? 'Save changes' : 'Saved'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
