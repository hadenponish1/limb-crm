import { useState } from 'react'
import { Icon } from '../components/icons'
import { Kpi } from '../components/ui'
import ExpenseModal from '../components/ExpenseModal'
import { money } from '../lib/format'
import { fmtDate } from '../lib/format'
import { freqLabel } from '../lib/store'
import {
  EXPENSE_CATEGORIES, categoryColor, expenseMonthly,
  monthlyRecurringExpense, expensesThisMonth, categoryTotalsYTD,
} from '../lib/expenses'

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'oneoff', label: 'One-off' },
  { id: 'recurring', label: 'Recurring' },
]

function CatBadge({ category }) {
  const c = categoryColor(category)
  return <span className="badge" style={{ background: c + '22', color: c, fontWeight: 600 }}>{category || 'Uncategorized'}</span>
}

export default function Expenses({ clients = [], jobs = [], expenses = [], addExpense, updateExpense, deleteExpense, onOpenClient }) {
  const [type, setType] = useState('all')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })
  const [modal, setModal] = useState(null) // { editing }

  const byClient = Object.fromEntries(clients.map((c) => [c.id, c]))
  const byJob = Object.fromEntries(jobs.map((j) => [j.id, j]))

  const mre = monthlyRecurringExpense(expenses)
  const thisMonth = expensesThisMonth(expenses)
  const catYTD = categoryTotalsYTD(expenses)
  const expYTD = catYTD.reduce((s, r) => s + r.value, 0)

  const rows = expenses
    .filter((e) => type === 'all' || (type === 'recurring' ? e.recurring : !e.recurring))
    .filter((e) => cat === 'all' || (e.category || 'Other') === cat)

  const sorted = [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'amount') return dir * ((Number(a.amount) || 0) - (Number(b.amount) || 0))
    if (sort.key === 'category') return dir * String(a.category || '').localeCompare(String(b.category || ''))
    return dir * String(a.date || '').localeCompare(String(b.date || ''))
  })

  const del = (e) => { if (window.confirm(`Delete this expense (${e.vendor || e.category} · ${money(e.amount)})?`)) deleteExpense(e.id) }

  const th = (key, label, align) => (
    <th onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: align || 'left', whiteSpace: 'nowrap' }}>
      {label}{sort.key === key ? <span style={{ color: 'var(--muted)' }}> {sort.dir === 'asc' ? '▲' : '▼'}</span> : ''}
    </th>
  )

  return (
    <div className="stack">
      <div className="grid kpi-grid">
        <Kpi label="Expenses this month" value={money(thisMonth)} icon="receipt" meta={<span style={{ color: 'var(--muted)' }}>one-off + recurring</span>} />
        <Kpi label="Recurring / month" value={money(mre)} icon="repeat" meta={<span style={{ color: 'var(--muted)' }}>≈ {money(mre * 12)}/yr overhead</span>} />
        <Kpi label="Expenses YTD" value={money(expYTD)} icon="dollar" meta={<span style={{ color: 'var(--muted)' }}>this calendar year</span>} />
        <Kpi label="Top category" value={catYTD[0]?.name || '—'} icon="tag" meta={<span style={{ color: 'var(--muted)' }}>{catYTD[0] ? `${money(catYTD[0].value)} YTD` : 'no spend yet'}</span>} />
      </div>

      <div className="card">
        <div className="card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="seg">
              {TYPE_FILTERS.map((f) => <button key={f.id} className={type === f.id ? 'on' : ''} onClick={() => setType(f.id)}>{f.label}</button>)}
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="all">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setModal({ editing: null })}><Icon.plus /> New expense</button>
        </div>
        <div style={{ padding: '0 12px 12px', overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                {th('date', 'Date')}
                <th>Description</th>
                {th('category', 'Category')}
                <th>Linked to</th>
                {th('amount', 'Amount', 'right')}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const client = e.clientId ? byClient[e.clientId] : null
                const job = e.jobId ? byJob[e.jobId] : null
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {fmtDate(e.date)}
                      {e.recurring && <span className="badge recurring" style={{ marginLeft: 8 }}><Icon.repeat style={{ width: 11, height: 11 }} /> {freqLabel(e.frequency)}</span>}
                    </td>
                    <td>{e.vendor || <span style={{ color: 'var(--muted)' }}>—</span>}{e.note && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{e.note}</div>}</td>
                    <td><CatBadge category={e.category} /></td>
                    <td>
                      {client ? (
                        <span className={onOpenClient ? '' : ''} onClick={onOpenClient ? () => onOpenClient(client.id) : undefined} style={onOpenClient ? { cursor: 'pointer', color: 'var(--green)', fontWeight: 600 } : undefined}>
                          {client.name}{job ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {fmtDate(job.date)}</span> : ''}
                        </span>
                      ) : <span style={{ color: 'var(--muted)' }}>General</span>}
                    </td>
                    <td className="money" style={{ textAlign: 'right' }}>
                      {money(e.amount)}
                      {e.recurring && <div style={{ fontSize: 12, color: 'var(--muted)' }}>≈ {money(expenseMonthly(e))}/mo</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" title="Edit" onClick={() => setModal({ editing: e })}><Icon.pencil style={{ width: 16, height: 16 }} /></button>
                        <button className="icon-btn" title="Delete" onClick={() => del(e)}><Icon.trash style={{ width: 16, height: 16 }} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="empty" style={{ padding: 34 }}>No expenses{type !== 'all' || cat !== 'all' ? ' match this filter' : ' logged yet. Click “New expense” to start tracking costs.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {catYTD.length > 0 && (
        <div className="card card-pad">
          <div className="card-head"><div className="card-title">Spend by category · YTD</div></div>
          <div className="stack" style={{ gap: 10, marginTop: 6 }}>
            {catYTD.map((r) => {
              const pct = expYTD ? Math.round((r.value / expYTD) * 100) : 0
              return (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 150, fontSize: 13, flexShrink: 0 }}>{r.name}</div>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#eee6d6', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: categoryColor(r.name) }} />
                  </div>
                  <div className="money" style={{ width: 90, textAlign: 'right', fontSize: 13 }}>{money(r.value)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modal && <ExpenseModal clients={clients} jobs={jobs} editing={modal.editing} onClose={() => setModal(null)} addExpense={addExpense} updateExpense={updateExpense} />}
    </div>
  )
}
