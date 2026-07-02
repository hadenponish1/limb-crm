import { useState } from 'react'
import { Icon } from '../components/icons'
import { StatusBadge, Avatar, SourceBadge } from '../components/ui'
import ClientDrawer from '../components/ClientDrawer'
import ImportModal from '../components/ImportModal'
import { money } from '../lib/format'
import { recurringLines, projectLines, clientMRR, clientWonProjects, clientKind } from '../lib/metrics'

const KIND_LABEL = { recurring: 'Recurring', project: 'Project', mixed: 'Recurring + Project', none: '—' }
const KIND_CLASS = { recurring: 'recurring', project: 'project', mixed: 'recurring', none: 'lead' }

export default function Clients({ clients, updateClient, deleteClient, deleteClients, addNote, deleteNote, onNew, jobs, addJob, deleteJob, generateSeries, upsertService, bulkImport }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [checked, setChecked] = useState(() => new Set())
  const [showImport, setShowImport] = useState(false)

  const sources = [...new Set(clients.map((c) => c.source).filter(Boolean))].sort()

  const filtered = clients.filter((c) => {
    if (filter === 'recurring' && recurringLines(c).length === 0) return false
    if (filter === 'project' && projectLines(c).length === 0) return false
    if (filter === 'leads' && c.status !== 'lead') return false
    if (sourceFilter !== 'all' && (c.source || '') !== sourceFilter) return false
    const hay = `${c.name} ${c.contact} ${c.address} ${c.source || ''} ${(c.services || []).map((s) => s.service).join(' ')}`.toLowerCase()
    if (q && !hay.includes(q.toLowerCase())) return false
    return true
  })

  const selected = clients.find((c) => c.id === selectedId) || null

  const toggle = (id) => setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allChecked = filtered.length > 0 && filtered.every((c) => checked.has(c.id))
  const toggleAll = () => setChecked((prev) => {
    const n = new Set(prev)
    if (allChecked) filtered.forEach((c) => n.delete(c.id))
    else filtered.forEach((c) => n.add(c.id))
    return n
  })
  const clearChecked = () => setChecked(new Set())
  const bulkDelete = () => {
    const ids = [...checked]
    if (confirm(`Delete ${ids.length} client${ids.length !== 1 ? 's' : ''} and all their jobs? This can't be undone.`)) {
      deleteClients(ids)
      clearChecked()
    }
  }

  return (
    <div className="stack">
      <div className="card card-pad" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Search clients, addresses, services…" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10 }} />
        <div className="seg" style={{ flex: '0 0 auto' }}>
          {['all', 'recurring', 'project', 'leads'].map((k) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)} style={{ textTransform: 'capitalize', padding: '9px 14px' }}>{k}</button>
          ))}
        </div>
        {sources.length > 0 && (
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', color: 'var(--moss)', fontWeight: 600 }}>
            <option value="all">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button className="btn btn-ghost" onClick={() => setShowImport(true)}><Icon.download /> Import</button>
        <button className="btn btn-primary" onClick={onNew}><Icon.plus /> New lead</button>
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 4 }}>
          {checked.size > 0 ? (
            <div className="bulk-bar">
              <span><b>{checked.size}</b> selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={clearChecked}>Clear</button>
                <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={bulkDelete}><Icon.trash /> Delete {checked.size}</button>
              </div>
            </div>
          ) : (
            <div className="card-title">Clients & leads <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 14 }}>({filtered.length})</span></div>
          )}
        </div>
        <div style={{ padding: '4px 12px 10px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }}><input type="checkbox" className="chk" checked={allChecked} onChange={toggleAll} title="Select all" /></th>
                <th>Client</th><th>Services</th><th>Mix</th><th>Monthly / Projects</th><th>Status</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const svcs = c.services || []
                const kind = clientKind(c)
                const mrr = clientMRR(c)
                const won = clientWonProjects(c)
                return (
                  <tr key={c.id} className={`click${checked.has(c.id) ? ' row-checked' : ''}`} onClick={() => setSelectedId(c.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="chk" checked={checked.has(c.id)} onChange={() => toggle(c.id)} />
                    </td>
                    <td>
                      <div className="cell-name">
                        <Avatar name={c.name} service={svcs[0]?.service} />
                        <div>
                          <b>{c.name}</b> <SourceBadge source={c.source} />
                          <small>{[c.contact, c.phone].filter(Boolean).join(' · ')}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="chip-row">
                        {svcs.slice(0, 2).map((s) => <span key={s.id} className="svc-chip">{s.service}</span>)}
                        {svcs.length > 2 && <span className="svc-chip more">+{svcs.length - 2}</span>}
                        {svcs.length === 0 && <span style={{ color: 'var(--muted)' }}>—</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${KIND_CLASS[kind]}`}>{KIND_LABEL[kind]}</span></td>
                    <td className="money">
                      {mrr > 0 && <span>{money(mrr)}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/mo</span></span>}
                      {mrr > 0 && won > 0 && <br />}
                      {won > 0 && <span style={{ color: 'var(--gold)' }}>{money(won)}<span style={{ color: 'var(--muted)', fontWeight: 400 }}> won</span></span>}
                      {mrr === 0 && won === 0 && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{money((c.services || []).reduce((a, s) => a + Number(s.amount || 0), 0))} quoted</span>}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--muted)' }}>{(c.notes?.length || 0) > 0 ? `${c.notes.length}` : '—'}</td>
                    <td style={{ color: 'var(--muted)' }}><Icon.external style={{ width: 15, height: 15 }} /></td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="empty">No clients match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ClientDrawer client={selected} onClose={() => setSelectedId(null)}
          updateClient={updateClient} deleteClient={deleteClient} addNote={addNote} deleteNote={deleteNote}
          jobs={jobs} addJob={addJob} deleteJob={deleteJob} generateSeries={generateSeries} upsertService={upsertService} />
      )}

      {showImport && (
        <ImportModal existingClients={clients} onClose={() => setShowImport(false)}
          onImport={({ clients: nc, jobs: nj }) => bulkImport({ clients: nc, jobs: nj })} />
      )}
    </div>
  )
}
