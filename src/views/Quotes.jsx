import { useState } from 'react'
import { Icon } from './../components/icons'
import { Kpi } from '../components/ui'
import QuoteModal from '../components/QuoteModal'
import JobModal from '../components/JobModal'
import { money } from '../lib/format'
import { quoteRows, weightedPipeline } from '../lib/metrics'

const FILTERS = [
  { id: 'quoted', label: 'Open' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'all', label: 'All' },
]

function fmtStart(iso) {
  if (!iso) return <span style={{ color: 'var(--muted)' }}>—</span>
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const STAGE_BADGE = {
  quoted: { cls: 'lead', text: 'Quoted' },
  won: { cls: 'active', text: 'Won' },
  lost: { cls: 'src', text: 'Lost' },
}

export default function Quotes({ clients, timeOff = [], addClient, upsertService, removeService, addJob, generateSeries, onOpenClient }) {
  const [filter, setFilter] = useState('quoted')
  const [sort, setSort] = useState({ key: 'startDate', dir: 'asc' })
  const [modal, setModal] = useState(null)       // { editing } for QuoteModal
  const [schedule, setSchedule] = useState(null)  // row to schedule a job for

  const rows = quoteRows(clients, filter)
  const openPipeline = weightedPipeline(clients)
  const openRows = quoteRows(clients, 'quoted')
  const openPotential = openRows.reduce((s, r) => s + r.amount, 0)

  const sorted = [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    let av = a[sort.key], bv = b[sort.key]
    if (sort.key === 'name') return dir * String(av).localeCompare(String(bv))
    if (sort.key === 'startDate') { av = av || '9999-99'; bv = bv || '9999-99'; return dir * String(av).localeCompare(String(bv)) }
    return dir * ((av || 0) - (bv || 0))
  })

  const setStage = (row, stage) => upsertService(row.clientId, { ...row.line, stage })
  const markWon = (row) => { setStage(row, 'won'); setSchedule({ ...row, line: { ...row.line, stage: 'won' } }) }
  const del = (row) => { if (window.confirm(`Delete this estimate (${row.desc || row.service}) for ${row.name}?`)) removeService(row.clientId, row.id) }

  const th = (key, label, align) => (
    <th onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: align || 'left', whiteSpace: 'nowrap' }}>
      {label}{sort.key === key ? <span style={{ color: 'var(--muted)' }}> {sort.dir === 'asc' ? '▲' : '▼'}</span> : ''}
    </th>
  )

  return (
    <div className="stack">
      <div className="grid kpi-grid">
        <Kpi label="Open estimates" value={openRows.length} icon="quote" meta={<span style={{ color: 'var(--muted)' }}>awaiting a yes/no</span>} />
        <Kpi label="Weighted pipeline" value={money(openPipeline)} icon="trend" meta={<span style={{ color: 'var(--muted)' }}>by your confidence · in projections</span>} />
        <Kpi label="Potential value" value={money(openPotential)} icon="dollar" meta={<span style={{ color: 'var(--muted)' }}>if every open quote lands</span>} />
      </div>

      <div className="card">
        <div className="card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="seg">
            {FILTERS.map((f) => <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>{f.label}</button>)}
          </div>
          <button className="btn btn-primary" onClick={() => setModal({ editing: null })}><Icon.plus /> New estimate</button>
        </div>
        <div style={{ padding: '0 12px 12px', overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                {th('name', 'Client')}
                <th>Estimate</th>
                {th('startDate', 'Est. start')}
                {th('confidence', 'Confidence')}
                {th('amount', 'Ballpark', 'right')}
                {filter === 'all' && <th>Stage</th>}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b onClick={onOpenClient ? () => onOpenClient(r.clientId) : undefined} style={onOpenClient ? { cursor: 'pointer', color: 'var(--green)' } : undefined}>{r.name}</b>
                    {r.source ? <span className="badge src" style={{ marginLeft: 8, background: '#e7edf6', color: '#3a5f8a' }}>{r.source}</span> : null}
                  </td>
                  <td>
                    <div>{r.desc || r.service}</div>
                    {r.desc && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.service}</div>}
                  </td>
                  <td>{fmtStart(r.startDate)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 44, height: 6, borderRadius: 3, background: '#e8e2d3', overflow: 'hidden' }}>
                        <div style={{ width: `${r.confidence}%`, height: '100%', background: 'var(--green)' }} />
                      </div>
                      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{r.confidence}%</span>
                    </div>
                  </td>
                  <td className="money" style={{ textAlign: 'right' }}>
                    {money(r.amount)}
                    {r.stage === 'quoted' && <div style={{ fontSize: 12, color: 'var(--muted)' }}>≈ {money(r.weighted)} weighted</div>}
                  </td>
                  {filter === 'all' && <td><span className={`badge ${STAGE_BADGE[r.stage].cls}`}>{STAGE_BADGE[r.stage].text}</span></td>}
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {r.stage === 'quoted' && <button className="btn btn-sm btn-primary" onClick={() => markWon(r)}>Mark won</button>}
                      {r.stage === 'quoted' && <button className="btn btn-sm btn-ghost" onClick={() => setStage(r, 'lost')}>Lost</button>}
                      {r.stage === 'won' && <button className="btn btn-sm btn-primary" onClick={() => setSchedule(r)}>Schedule</button>}
                      {r.stage === 'lost' && <button className="btn btn-sm btn-ghost" onClick={() => setStage(r, 'quoted')}>Reopen</button>}
                      <button className="icon-btn" title="Edit" onClick={() => setModal({ editing: { clientId: r.clientId, service: r.line } })}><Icon.pencil style={{ width: 16, height: 16 }} /></button>
                      <button className="icon-btn" title="Delete" onClick={() => del(r)}><Icon.trash style={{ width: 16, height: 16 }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={filter === 'all' ? 7 : 6} className="empty" style={{ padding: 34 }}>
                  {filter === 'quoted' ? 'No open estimates. Click “New estimate” to ballpark a project.' : `No ${filter === 'all' ? '' : filter + ' '}estimates yet.`}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <QuoteModal clients={clients} editing={modal.editing} onClose={() => setModal(null)} addClient={addClient} upsertService={upsertService} />}
      {schedule && (
        <JobModal
          clients={clients}
          timeOff={timeOff}
          lockClientId={schedule.clientId}
          initialServiceId={schedule.id}
          initialJobType="oneoff"
          initialDate={schedule.startDate || undefined}
          onClose={() => setSchedule(null)}
          addJob={addJob}
          upsertService={upsertService}
          generateSeries={generateSeries}
        />
      )}
    </div>
  )
}
