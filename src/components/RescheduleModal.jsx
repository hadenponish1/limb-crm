import { useState } from 'react'
import { Icon } from './icons'
import { freqLabel, normFreq, isoLocal } from '../lib/store'
import FrequencyPicker from './FrequencyPicker'

// Change a recurring service's cadence and reflow its UPCOMING visits to match.
// Past visits are kept; existing coverage isn't shortened.
export default function RescheduleModal({ client, serviceId, jobs, reschedule, upsertService, onClose }) {
  const line = (client.services || []).find((s) => s.id === serviceId)
  const [newFreq, setNewFreq] = useState(() => normFreq(line?.frequency))
  const [weeks, setWeeks] = useState(8)
  const [result, setResult] = useState(null)

  const curLabel = line ? freqLabel(line.frequency) : ''
  const newLabel = freqLabel(newFreq)
  const changed = JSON.stringify(normFreq(newFreq)) !== JSON.stringify(normFreq(line?.frequency))
  const todayIso = isoLocal(new Date())
  const future = (jobs || []).filter((j) => j.clientId === client.id && j.serviceId === serviceId && j.date >= todayIso)

  function apply() {
    // persist the new cadence first (synchronous store update) so the reflow uses it
    if (changed && upsertService) upsertService(client.id, { ...line, frequency: newFreq })
    setResult(reschedule(client.id, serviceId, weeks))
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">Change visit cadence</div>
            <div className="page-sub">{line?.service} · currently <b>{curLabel}</b></div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          {result === null ? (
            <>
              <div className="field">
                <label>New cadence</label>
                <FrequencyPicker value={newFreq} onChange={setNewFreq} />
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', margin: '4px 0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Upcoming visits to reflow</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--moss)' }}>{future.length}</span>
                </div>
                <div className="page-sub" style={{ fontSize: 12.5, marginTop: 6 }}>
                  {changed ? <>Their <b>{future.length}</b> upcoming <b>{curLabel.toLowerCase()}</b> visit{future.length !== 1 ? 's' : ''} will be replaced with a <b>{newLabel.toLowerCase()}</b> schedule.</>
                    : <>Reflows upcoming visits onto the <b>{newLabel.toLowerCase()}</b> schedule from today.</>}
                </div>
              </div>

              <div className="field">
                <label>Schedule the new cadence out to at least…</label>
                <div className="seg">{[4, 8, 12].map((w) => <button key={w} type="button" className={weeks === w ? 'on' : ''} onClick={() => setWeeks(w)}>{w} weeks</button>)}</div>
              </div>
              <div className="page-sub" style={{ fontSize: 12.5 }}>
                <b>Past visits are kept.</b> Existing coverage isn't shortened — if visits already reach further out, that far date is kept as the horizon.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6efe0', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <Icon.repeat style={{ width: 26, height: 26, color: '#3f6b3d' }} />
              </div>
              <div className="card-title">Cadence updated</div>
              <div className="page-sub" style={{ marginTop: 6 }}>Replaced {result.removed} upcoming visit{result.removed !== 1 ? 's' : ''} with {result.added} on the {newLabel.toLowerCase()} schedule.</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {result === null ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={apply}><Icon.repeat /> {changed ? `Switch to ${newLabel.toLowerCase()}` : 'Reflow visits'}</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>
  )
}
