import { useState } from 'react'
import { Icon } from './icons'
import { blankService, SOURCES } from '../lib/store'
import ServiceLineFields from './ServiceLineFields'
import AddressAutocomplete from './AddressAutocomplete'
import { geocode } from '../lib/geocode'

export default function LeadModal({ onClose, onSave }) {
  const [f, setF] = useState({
    name: '', contact: '', email: '', phone: '', address: '', status: 'lead', source: 'Direct',
  })
  const [picked, setPicked] = useState(null) // coords from a chosen autocomplete suggestion
  const [line, setLine] = useState(blankService({ amount: '' }))
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    // use the picked suggestion's coords if available, otherwise geocode the typed text
    const coords = (picked?.lat != null) ? picked : await geocode(f.address)
    const service = { ...line, amount: Number(line.amount) || 0 }
    if (service.type !== 'recurring') delete service.frequency
    onSave({
      ...f,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      createdAt: new Date().toISOString().slice(0, 10),
      services: [service],
      notes: [],
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="card-title">New Lead / Client</div>
            <div className="page-sub">Add contact and a first service — you can add more later</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="section-label">Contact</div>
          <div className="field">
            <label>Property / Account name</label>
            <input value={f.name} onChange={set('name')} placeholder="e.g. The Hartwell Residence" required autoFocus />
          </div>
          <div className="field-row">
            <div className="field"><label>Contact name</label><input value={f.contact} onChange={set('contact')} placeholder="Jane Doe" /></div>
            <div className="field"><label>Phone</label><input value={f.phone} onChange={set('phone')} placeholder="(724) 555-0100" /></div>
          </div>
          <div className="field"><label>Email</label><input type="email" value={f.email} onChange={set('email')} placeholder="jane@email.com" /></div>
          <div className="field">
            <label>Property address</label>
            <AddressAutocomplete
              value={f.address}
              placeholder="Start typing an address…"
              onChange={(text) => { setF((p) => ({ ...p, address: text })); setPicked(null) }}
              onSelect={(sel) => { setF((p) => ({ ...p, address: sel.address })); setPicked(sel) }}
            />
            <div className="page-sub" style={{ marginTop: 6, fontSize: 12 }}>Start typing and pick from the list — drops a pin on the map automatically.</div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Account stage</label>
              <select value={f.status} onChange={set('status')}>
                <option value="lead">Lead</option>
                <option value="active">Active client</option>
              </select>
            </div>
            <div className="field">
              <label>Source</label>
              <select value={f.source} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 20 }}>First service</div>
          <ServiceLineFields line={line} onChange={setLine} />
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save lead'}</button>
        </div>
      </form>
    </div>
  )
}
