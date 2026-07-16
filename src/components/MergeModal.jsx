import { useState } from 'react'
import { Icon } from './icons'
import { Avatar } from './ui'

// Merge 2+ duplicate clients into one. Pick the record to keep; the others' jobs,
// services and notes move onto it and the duplicates are deleted.
export default function MergeModal({ clients, jobs, onMerge, onClose }) {
  const [primaryId, setPrimaryId] = useState(clients[0]?.id)
  const jobCountFor = (id) => (jobs || []).filter((j) => j.clientId === id).length

  function doMerge() {
    onMerge(primaryId, clients.filter((c) => c.id !== primaryId).map((c) => c.id))
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">Merge {clients.length} clients</div>
            <div className="page-sub">Pick the record to keep — the rest merge into it</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          <div className="stack" style={{ gap: 8 }}>
            {clients.map((c) => (
              <label key={c.id} className={`merge-row${c.id === primaryId ? ' on' : ''}`}>
                <input type="radio" name="primary" checked={c.id === primaryId} onChange={() => setPrimaryId(c.id)} style={{ width: 16, height: 16 }} />
                <Avatar name={c.name} service={c.services?.[0]?.service} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address || 'no address'}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{jobCountFor(c.id)} job{jobCountFor(c.id) !== 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
          <div className="page-sub" style={{ marginTop: 14, fontSize: 12.5 }}>
            All jobs, services and notes move onto the kept record. Blank fields on it get filled from the others. The other {clients.length - 1} record{clients.length - 1 !== 1 ? 's are' : ' is'} deleted. This can't be undone.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doMerge}><Icon.users /> Merge into 1</button>
        </div>
      </div>
    </div>
  )
}
