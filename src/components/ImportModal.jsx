import { useState } from 'react'
import { Icon } from './icons'
import { SOURCES } from '../lib/store'
import { parseImport } from '../lib/importParse'
import { geocode } from '../lib/geocode'
import { money } from '../lib/format'

// Bulk import from a Google Sheets paste. Steps: paste → preview → geocode+import → done.
export default function ImportModal({ existingClients, onClose, onImport }) {
  const [step, setStep] = useState('paste') // paste | preview | importing | done
  const [text, setText] = useState('')
  const [source, setSource] = useState('TaskRabbit')
  const [status, setStatus] = useState('lead')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState(null)

  function doParse() {
    setError('')
    const res = parseImport(text, { defaultSource: source, defaultStatus: status, existingClients })
    if (res.error) { setError(res.error); return }
    if (!res.jobs.length) { setError('No valid rows found. Make sure Date and Address columns have values.'); return }
    setParsed(res)
    setStep('preview')
  }

  async function doImport() {
    setStep('importing')
    const toGeo = parsed.newClients.filter((c) => c.address)
    setProgress({ done: 0, total: toGeo.length })
    // Geocode new addresses (throttled so we stay within the free geocoder's limits)
    for (let i = 0; i < toGeo.length; i++) {
      const c = toGeo[i]
      const coords = await geocode(c.address)
      if (coords) { c.lat = coords.lat; c.lng = coords.lng }
      setProgress({ done: i + 1, total: toGeo.length })
      if (i < toGeo.length - 1) await new Promise((r) => setTimeout(r, 1100))
    }
    onImport({ clients: parsed.newClients, jobs: parsed.jobs })
    setResult(parsed.stats)
    setStep('done')
  }

  return (
    <div className="overlay" onClick={step === 'importing' ? undefined : onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">Import from a spreadsheet</div>
            <div className="page-sub">Paste rows copied from Google Sheets — one row per job</div>
          </div>
          {step !== 'importing' && <button className="icon-btn" onClick={onClose}><Icon.x /></button>}
        </div>

        <div className="modal-body">
          {step === 'paste' && (
            <>
              <div className="field-row">
                <div className="field">
                  <label>Default source for this batch</label>
                  <select value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
                <div className="field">
                  <label>Import these as</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="lead">Leads</option><option value="active">Active clients</option></select>
                </div>
              </div>
              <div className="field">
                <label>Paste your rows</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder={'Date\tEvent\tTime\tAddress\tName\tAmount\n2026-04-06\tMow - Jackie\t9:00 AM – 10:00 AM\t1214 Stanhope Ave, Richmond, VA\tJackie\t65'}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'monospace', fontSize: 12.5, resize: 'vertical', background: '#fff' }} />
                <div className="page-sub" style={{ marginTop: 6, fontSize: 12 }}>
                  Include the header row. Needs <b>Date</b> and <b>Address</b>; <b>Amount</b> drives revenue. Extra columns (Event/Time/Name/Source) are used automatically.
                </div>
              </div>
              {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            </>
          )}

          {step === 'preview' && parsed && (
            <>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                <PreviewStat label="New clients" value={parsed.stats.newClients} />
                <PreviewStat label="Jobs" value={parsed.stats.jobs} />
                <PreviewStat label="Revenue" value={money(parsed.stats.revenue)} />
              </div>
              {parsed.stats.matchedClients > 0 && <div className="page-sub" style={{ marginBottom: 10 }}>{parsed.stats.matchedClients} address(es) matched existing clients — their jobs will be added to those clients.</div>}
              {parsed.stats.skipped > 0 && <div className="page-sub" style={{ marginBottom: 10, color: 'var(--danger)' }}>{parsed.stats.skipped} row(s) skipped (missing date or address).</div>}
              {parsed.stats.revenue === 0 && <div className="page-sub" style={{ marginBottom: 10 }}>No amounts detected — add an Amount column to bring in revenue.</div>}
              <div className="section-label">First few clients</div>
              <div className="stack" style={{ gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {parsed.newClients.slice(0, 8).map((c) => (
                  <div key={c.id} className="mini-job">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</div>
                    </div>
                    <span className="badge src" style={{ background: '#e7edf6', color: '#3a5f8a' }}>{c.source}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{parsed.jobs.filter((j) => j.clientId === c.id).length} jobs</span>
                  </div>
                ))}
                {parsed.newClients.length > 8 && <div className="page-sub" style={{ fontSize: 12 }}>+{parsed.newClients.length - 8} more…</div>}
              </div>
            </>
          )}

          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="card-title" style={{ marginBottom: 10 }}>Importing…</div>
              <div className="page-sub">Looking up map locations for {progress.total} addresses ({progress.done}/{progress.total})</div>
              <div style={{ height: 8, background: 'var(--line)', borderRadius: 6, overflow: 'hidden', marginTop: 14 }}>
                <div style={{ height: '100%', width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: 'var(--green)', transition: 'width .2s' }} />
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div style={{ textAlign: 'center', padding: '14px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6efe0', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <Icon.download style={{ width: 26, height: 26, color: '#3f6b3d' }} />
              </div>
              <div className="card-title">Imported {result.newClients} clients & {result.jobs} jobs</div>
              <div className="page-sub" style={{ marginTop: 6 }}>{money(result.revenue)} in historical revenue is now in your Metrics. Find them under the <b>{source}</b> source filter.</div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step === 'paste' && (<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={doParse} disabled={!text.trim()}>Preview</button></>)}
          {step === 'preview' && (<><button className="btn btn-ghost" onClick={() => setStep('paste')}>Back</button><button className="btn btn-primary" onClick={doImport}><Icon.download /> Import {parsed.stats.newClients + parsed.stats.matchedClients ? '' : ''}{parsed.stats.jobs} jobs</button></>)}
          {step === 'importing' && <button className="btn btn-ghost" disabled>Working…</button>}
          {step === 'done' && <button className="btn btn-primary" onClick={onClose}>Done</button>}
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }) {
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--moss)', marginTop: 4 }}>{value}</div>
    </div>
  )
}
