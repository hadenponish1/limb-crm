import { useState } from 'react'
import { Icon } from './icons'
import { isoLocal } from '../lib/store'
import { money, fmtTime } from '../lib/format'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const pillColor = (job) => (job.type === 'project' ? '#c99a4b' : '#6B7F65')

export default function MonthCalendar({ jobs, byId, onDayClick, onJobClick, initialMode = 'month', lockMode = false, compact = false }) {
  const [mode, setMode] = useState(initialMode) // month | week
  const [cursor, setCursor] = useState(() => new Date())
  const todayIso = isoLocal(new Date())

  // jobs grouped by date
  const byDate = {}
  jobs.forEach((j) => { (byDate[j.date] ||= []).push(j) })
  Object.values(byDate).forEach((list) => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')))

  const prev = () => setCursor(mode === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1) : addDays(cursor, -7))
  const next = () => setCursor(mode === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) : addDays(cursor, 7))
  const goToday = () => setCursor(new Date())

  // visible range
  let rangeStart, rangeDays, label
  if (mode === 'month') {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    rangeStart = addDays(first, -first.getDay())
    rangeDays = 42
    label = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else {
    rangeStart = addDays(cursor, -cursor.getDay())
    rangeDays = 7
    const end = addDays(rangeStart, 6)
    const sameMonth = rangeStart.getMonth() === end.getMonth()
    label = `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const cells = Array.from({ length: rangeDays }, (_, i) => addDays(rangeStart, i))
  const inView = (iso) => { const d = new Date(iso + 'T00:00:00'); return d >= rangeStart && d < addDays(rangeStart, rangeDays) }
  const rangeTotal = jobs.filter((j) => inView(j.date)).reduce((s, j) => s + (j.amount || 0), 0)
  const curMonth = cursor.getMonth()

  return (
    <div className="card card-pad">
      <div className="cal-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" onClick={prev} aria-label="Previous">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="card-title" style={{ minWidth: 190, textAlign: 'center' }}>{label}</div>
          <button className="icon-btn" onClick={next} aria-label="Next">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!lockMode && (
            <div className="seg" style={{ background: 'var(--cream)', borderRadius: 9, padding: 3 }}>
              <button className={mode === 'week' ? 'on' : ''} onClick={() => setMode('week')} style={{ border: 'none', padding: '6px 13px' }}>Week</button>
              <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')} style={{ border: 'none', padding: '6px 13px' }}>Month</button>
            </div>
          )}
          <span className="money" style={{ color: 'var(--green)' }}>{money(rangeTotal)} scheduled</span>
        </div>
      </div>

      {mode === 'month' ? (
        <>
          <div className="cal-grid cal-dow">{WEEKDAYS.map((w) => <div key={w} className="cal-dow-cell">{w}</div>)}</div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              const iso = isoLocal(d)
              const list = byDate[iso] || []
              const isToday = iso === todayIso
              return (
                <div key={i} className={`cal-cell${d.getMonth() === curMonth ? '' : ' out'}${isToday ? ' today' : ''}`} onClick={() => onDayClick(iso)}>
                  <div className="cal-date">{isToday ? <span className="cal-today-dot">{d.getDate()}</span> : d.getDate()}</div>
                  <div className="cal-pills">
                    {list.slice(0, 3).map((j) => (
                      <button key={j.id} className="cal-pill" style={{ ['--pc']: pillColor(j) }}
                        onClick={(e) => { e.stopPropagation(); onJobClick(j) }} title={`${byId[j.clientId]?.name} — ${j.title}`}>
                        <span className="cal-pill-time">{fmtTime(j.time).replace(':00', '')}</span>{byId[j.clientId]?.name || j.title}
                      </button>
                    ))}
                    {list.length > 3 && <div className="cal-more">+{list.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="cal-scroll"><div className="week-grid">
          {cells.map((d, i) => {
            const iso = isoLocal(d)
            const list = byDate[iso] || []
            const isToday = iso === todayIso
            return (
              <div key={i} className={`week-col${isToday ? ' today' : ''}${compact ? ' compact' : ''}`}>
                <button className="week-head" onClick={() => onDayClick(iso)}>
                  <span className="week-dow">{WEEKDAYS[d.getDay()]}</span>
                  <span className={`week-num${isToday ? ' on' : ''}`}>{d.getDate()}</span>
                </button>
                <div className="week-body" onClick={() => onDayClick(iso)}>
                  {list.map((j) => (
                    <button key={j.id} className="week-job" style={{ ['--pc']: pillColor(j) }}
                      onClick={(e) => { e.stopPropagation(); onJobClick(j) }}>
                      <span className="week-job-time">{fmtTime(j.time)}</span>
                      <span className="week-job-name">{byId[j.clientId]?.name}</span>
                      <span className="week-job-svc">{j.title}</span>
                    </button>
                  ))}
                  {list.length === 0 && <div className="week-empty">+ add</div>}
                </div>
              </div>
            )
          })}
        </div></div>
      )}

      <div className="legend" style={{ marginTop: 16 }}>
        <span><i style={{ background: '#6B7F65' }} />Recurring visit</span>
        <span><i style={{ background: '#c99a4b' }} />One-off / project</span>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>Click a day to see its jobs · click a job to view</span>
      </div>
    </div>
  )
}
