import { useState } from 'react'
import { Icon } from './icons'
import { isoLocal } from '../lib/store'
import { EXPENSE_CATEGORIES } from '../lib/expenses'
import { fmtDate } from '../lib/format'
import FrequencyPicker from './FrequencyPicker'
import ClientSearchSelect from './ClientSearchSelect'

// Create/edit an expense. One-off (a dated cost) or recurring (accrues monthly).
export default function ExpenseModal({ clients = [], jobs = [], editing, onClose, addExpense, updateExpense }) {
  const isEdit = !!editing
  const [recurring, setRecurring] = useState(editing?.recurring || false)
  const [amount, setAmount] = useState(editing?.amount != null ? String(editing.amount) : '')
  const [category, setCategory] = useState(editing?.category || EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(editing?.date || isoLocal(new Date()))
  const [frequency, setFrequency] = useState(editing?.frequency || { every: 1, unit: 'month' })
  const [vendor, setVendor] = useState(editing?.vendor || '')
  const [note, setNote] = useState(editing?.note || '')
  const [linked, setLinked] = useState(!!editing?.clientId)
  const [clientId, setClientId] = useState(editing?.clientId || '')
  const [jobId, setJobId] = useState(editing?.jobId || '')

  const clientJobs = clientId ? jobs.filter((j) => j.clientId === clientId).sort((a, b) => (b.date || '').localeCompare(a.date || '')) : []

  function submit(e) {
    e.preventDefault()
    const payload = {
      amount: Number(amount) || 0,
      category,
      date,
      vendor: vendor.trim(),
      note: note.trim(),
      recurring,
      frequency: recurring ? frequency : null,
      clientId: linked ? (clientId || null) : null,
      jobId: linked ? (jobId || null) : null,
    }
    if (isEdit) updateExpense(editing.id, payload)
    else addExpense(payload)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="card-title">{isEdit ? 'Edit expense' : 'New expense'}</div>
            <div className="page-sub">{recurring ? 'A recurring cost that accrues every month' : 'A one-time cost'}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Expense type</label>
            <div className="seg">
              <button type="button" className={!recurring ? 'on' : ''} onClick={() => setRecurring(false)}>One-off</button>
              <button type="button" className={recurring ? 'on' : ''} onClick={() => setRecurring(true)}>
                <Icon.repeat style={{ width: 14, height: 14, verticalAlign: '-2px', marginRight: 6 }} />Recurring
              </button>
            </div>
          </div>

          <div className="field-row">
            <div className="field"><label>Amount</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required autoFocus /></div>
            <div className="field"><label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          </div>

          {recurring ? (
            <div className="field-row">
              <div className="field"><label>Start date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
              <div className="field"><label>Frequency</label><FrequencyPicker value={frequency} onChange={setFrequency} /></div>
            </div>
          ) : (
            <div className="field"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
          )}

          <div className="field"><label>Vendor / description</label><input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. SiteOne — mulch, Sheetz fuel" /></div>

          <div className="field">
            <label>Link</label>
            <div className="seg">
              <button type="button" className={!linked ? 'on' : ''} onClick={() => setLinked(false)}>General</button>
              <button type="button" className={linked ? 'on' : ''} onClick={() => setLinked(true)} disabled={!clients.length}>Tie to a client</button>
            </div>
          </div>

          {linked && (
            <>
              <div className="field">
                <label>Client</label>
                <ClientSearchSelect clients={clients} value={clientId} onChange={(id) => { setClientId(id); setJobId('') }} />
              </div>
              {clientJobs.length > 0 && (
                <div className="field">
                  <label>Job <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                  <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
                    <option value="">— whole account —</option>
                    {clientJobs.map((j) => <option key={j.id} value={j.id}>{fmtDate(j.date)} · {j.title || 'Job'}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="field"><label>Notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="anything worth remembering" /></div>

          {recurring && (
            <div className="page-sub" style={{ fontSize: 12 }}>
              Counts as {amount ? `$${Number(amount).toLocaleString()}` : 'this amount'} of expense every {frequency.every > 1 ? `${frequency.every} ${frequency.unit}s` : frequency.unit} in your net-profit numbers, starting {date ? fmtDate(date) : 'its start date'}.
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{isEdit ? 'Save changes' : 'Save expense'}</button>
        </div>
      </form>
    </div>
  )
}
