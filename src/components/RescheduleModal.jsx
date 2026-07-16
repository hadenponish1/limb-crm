import { useState } from 'react'
import { Icon } from './icons'
import { FREQUENCIES, isoLocal } from '../lib/store'

// Reflow a recurring service's upcoming visits to its current cadence.
export default function RescheduleModal({ client, serviceId, jobs, reschedule, onClose }) {
  const [weeks, setWeeks] = useState(8)
  const [result, setResult] = useState(null)
  const line = (client.services || []).find((s) => s.id === serviceId)
  const freq = FREQUENCIES.find((f) => f.id === line?.frequency)?.label || line?.frequency
  const todayIso = isoLocal(new Date())
  const future = (jobs || []).filter((j) => j.clientId === client.id && j.serviceId === serviceId && j.date >= todayIso)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">Reschedule upcoming visits</div>
            <div className="page-sub">{line?.service} · now <b>{freq}</b></div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          {result === null ? (
            <>
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Upcoming visits to replace</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--moss)' }}>{future.length}</span>
                </div>
              </div>
              <div className="field">
                <label>Keep visits scheduled out to…</label>
                <div className="seg">{[4, 8, 12].map((w) => <button key={w} type="button" className={weeks === w ? 'on' : ''} onClick={() => setWeeks(w)}>{w} weeks</button>)}</div>
              </div>
              <div className="page-sub" style={{ fontSize: 12.5 }}>
                Replaces this service's <b>upcoming</b> visits with the <b>{freq?.toLowerCase()}</b> schedule (from today). <b>Past visits are kept</b>, and existing coverage isn't shortened.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6efe0', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <Icon.repeat style={{ width: 26, height: 26, color: '#3f6b3d' }} />
              </div>
              <div className="card-title">Schedule updated</div>
              <div className="page-sub" style={{ marginTop: 6 }}>Replaced {result.removed} upcoming visit{result.removed !== 1 ? 's' : ''} with {result.added} on the {freq?.toLowerCase()} schedule.</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {result === null ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setResult(reschedule(client.id, serviceId, weeks))}><Icon.repeat /> Update visits</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>
  )
}
