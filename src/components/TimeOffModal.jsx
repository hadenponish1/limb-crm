import { useState } from 'react'
import { Icon } from './icons'
import { isoLocal } from '../lib/store'
import { TIMEOFF_TYPES } from '../lib/timeoff'

// Block out a range of days off (all-day). Shows as a banner across the calendar.
export default function TimeOffModal({ editing, initialDate, onClose, addTimeOff, updateTimeOff, deleteTimeOff }) {
  const isEdit = !!editing
  const today = initialDate || isoLocal(new Date())
  const [type, setType] = useState(editing?.type || 'vacation')
  const [title, setTitle] = useState(editing?.title || '')
  const [start, setStart] = useState(editing?.start || today)
  const [end, setEnd] = useState(editing?.end || today)

  // keep end on/after start
  const onStart = (v) => { setStart(v); if (end < v) setEnd(v) }
  const onEnd = (v) => { setEnd(v < start ? start : v) }

  function submit(e) {
    e.preventDefault()
    const payload = { type, title: title.trim(), start, end: end < start ? start : end }
    if (isEdit) updateTimeOff(editing.id, payload)
    else addTimeOff(payload)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="card-title">{isEdit ? 'Edit time off' : 'Block time off'}</div>
            <div className="page-sub">Mark days you're not working — shows on the calendar</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Type</label>
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {TIMEOFF_TYPES.map((t) => (
                <button key={t.id} type="button" className={type === t.id ? 'on' : ''} onClick={() => setType(t.id)}>
                  <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: t.color, marginRight: 7, verticalAlign: '0px' }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Label <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Beach trip, July 4th" autoFocus />
          </div>

          <div className="field-row">
            <div className="field"><label>First day off</label><input type="date" value={start} onChange={(e) => onStart(e.target.value)} required /></div>
            <div className="field"><label>Last day off</label><input type="date" value={end} min={start} onChange={(e) => onEnd(e.target.value)} required /></div>
          </div>
          <div className="page-sub" style={{ fontSize: 12 }}>Both days are included. For a single day, set them the same.</div>
        </div>

        <div className="modal-foot" style={{ justifyContent: isEdit ? 'space-between' : 'flex-end' }}>
          {isEdit && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { deleteTimeOff(editing.id); onClose() }}>
              <Icon.trash /> Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save' : 'Block it'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
