import { useState } from 'react'
import { Icon } from './icons'
import { SERVICES, isoLocal } from '../lib/store'
import ClientSearchSelect from './ClientSearchSelect'
import AddressAutocomplete from './AddressAutocomplete'
import { geocode } from '../lib/geocode'

// Estimate creator/editor. A quote is a project service line with stage 'quoted'
// plus a ballpark amount, an estimated start date, and a win-likelihood %.
const CONFIDENCE = [
  { v: 25, label: '25% · long shot' },
  { v: 50, label: '50% · possible' },
  { v: 75, label: '75% · likely' },
  { v: 90, label: '90% · very likely' },
]
// Project-flavored services float to the top of the picker for estimates
const PROJECT_FIRST = ['Landscape Design', 'Hardscape / Patio', 'Seasonal Cleanup', 'Sod / Lawn Install', 'Tree & Shrub Care', 'Mulch & Beds', 'Hauling / Trash Clean-out']
const SVC_OPTIONS = [...PROJECT_FIRST, ...SERVICES.filter((s) => !PROJECT_FIRST.includes(s))]

export default function QuoteModal({ clients, editing, onClose, addClient, upsertService }) {
  const isEdit = !!editing
  const base = editing?.service
  const [target, setTarget] = useState(isEdit ? 'existing' : (clients.length ? 'existing' : 'new'))
  const [clientId, setClientId] = useState(editing?.clientId || clients[0]?.id || '')

  // new-prospect fields
  const [prospect, setProspect] = useState({ name: '', contact: '', phone: '', address: '' })
  const [picked, setPicked] = useState(null)
  const setP = (k) => (e) => setProspect((p) => ({ ...p, [k]: e.target.value }))

  const [svcName, setSvcName] = useState(base?.service || SVC_OPTIONS[0])
  const [desc, setDesc] = useState(base?.desc || '')
  const [amount, setAmount] = useState(base?.amount != null ? String(base.amount) : '')
  const [startDate, setStartDate] = useState(base?.startDate || isoLocal(new Date()))
  const [confidence, setConfidence] = useState(base?.confidence ?? 50)
  const [saving, setSaving] = useState(false)

  const editClient = isEdit ? clients.find((c) => c.id === editing.clientId) : null

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    const line = {
      service: svcName, type: 'project', stage: base?.stage || 'quoted',
      amount: Number(amount) || 0, startDate, confidence: Number(confidence), desc: desc.trim(),
    }
    if (isEdit) {
      upsertService(editing.clientId, { ...base, ...line })
    } else if (target === 'existing') {
      upsertService(clientId, line)
    } else {
      const coords = picked?.lat != null ? picked : await geocode(prospect.address)
      addClient({
        name: prospect.name, contact: prospect.contact, email: '', phone: prospect.phone,
        address: prospect.address, lat: coords?.lat ?? null, lng: coords?.lng ?? null,
        status: 'lead', source: 'Direct', createdAt: isoLocal(new Date()),
        services: [line], notes: [],
      })
    }
    setSaving(false)
    onClose()
  }

  const canSave = target === 'existing' ? !!clientId : prospect.name.trim().length > 0

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="card-title">{isEdit ? 'Edit estimate' : 'New estimate'}</div>
            <div className="page-sub">{isEdit ? editClient?.name : 'Ballpark a project so it shows in your projections'}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          {!isEdit && (
            <div className="field">
              <label>Who's this for?</label>
              <div className="seg">
                <button type="button" className={target === 'existing' ? 'on' : ''} onClick={() => setTarget('existing')} disabled={!clients.length}>Existing client</button>
                <button type="button" className={target === 'new' ? 'on' : ''} onClick={() => setTarget('new')}>New prospect</button>
              </div>
            </div>
          )}

          {!isEdit && target === 'existing' && (
            <div className="field">
              <label>Client</label>
              <ClientSearchSelect clients={clients} value={clientId} onChange={setClientId} />
            </div>
          )}

          {!isEdit && target === 'new' && (
            <>
              <div className="field">
                <label>Property / Account name</label>
                <input value={prospect.name} onChange={setP('name')} placeholder="e.g. The Delgado Residence" required autoFocus />
              </div>
              <div className="field-row">
                <div className="field"><label>Contact name</label><input value={prospect.contact} onChange={setP('contact')} placeholder="Jane Doe" /></div>
                <div className="field"><label>Phone</label><input value={prospect.phone} onChange={setP('phone')} placeholder="(724) 555-0100" /></div>
              </div>
              <div className="field">
                <label>Property address</label>
                <AddressAutocomplete
                  value={prospect.address}
                  placeholder="Start typing an address…"
                  onChange={(text) => { setProspect((p) => ({ ...p, address: text })); setPicked(null) }}
                  onSelect={(sel) => { setProspect((p) => ({ ...p, address: sel.address })); setPicked(sel) }}
                />
              </div>
            </>
          )}

          <div className="section-label" style={{ marginTop: 18 }}>The estimate</div>
          <div className="field">
            <label>Type of work</label>
            <select value={svcName} onChange={(e) => setSvcName(e.target.value)}>{SVC_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <div className="field">
            <label>Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. 400 sq ft paver patio + fire pit" />
          </div>
          <div className="field-row">
            <div className="field"><label>Ballpark amount</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required /></div>
            <div className="field"><label>Estimated start</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
          </div>
          <div className="field">
            <label>Confidence</label>
            <select value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}>
              {CONFIDENCE.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
            <div className="page-sub" style={{ marginTop: 6, fontSize: 12 }}>
              Projections count this quote at {confidence}% of {amount ? `$${Number(amount).toLocaleString()}` : 'its value'} in {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' }) : 'its start month'}.
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save estimate'}</button>
        </div>
      </form>
    </div>
  )
}
