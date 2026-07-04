import { useState } from 'react'
import { isoLocal } from '../lib/store'
import { money } from '../lib/format'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const chevron = (d) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d === 'l' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </svg>
)

// Month calendar where each day shows the $ earned that day; weekly totals down
// the right, monthly total in the header. Click a day to open its jobs.
export default function RevenueCalendar({ jobs, onDayClick }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const todayIso = isoLocal(new Date())
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(start.getDate() - first.getDay())

  const byDate = {}
  jobs.forEach((j) => { byDate[j.date] = (byDate[j.date] || 0) + (j.amount || 0) })

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const arr = []
    for (let d = 0; d < 7; d++) { const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d); arr.push(dt) }
    weeks.push(arr)
  }
  const rows = weeks.filter((wk) => wk.some((d) => d.getMonth() === month))
  const inMonth = (d) => d.getMonth() === month
  const dayAmt = (d) => (inMonth(d) ? byDate[isoLocal(d)] || 0 : 0)
  const monthTotal = rows.flat().reduce((s, d) => s + dayAmt(d), 0)
  const maxDay = Math.max(1, ...rows.flat().map(dayAmt))

  return (
    <div className="card card-pad">
      <div className="cal-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous">{chevron('l')}</button>
          <div className="card-title" style={{ minWidth: 170, textAlign: 'center' }}>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <button className="icon-btn" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next">{chevron('r')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}>Today</button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>MONTH TOTAL</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--moss)', lineHeight: 1 }}>{money(monthTotal)}</div>
        </div>
      </div>

      <div className="rev-grid rev-head">
        {WEEKDAYS.map((w) => <div key={w} className="rev-dow">{w}</div>)}
        <div className="rev-dow" style={{ textAlign: 'right', color: 'var(--green)' }}>Week</div>
      </div>

      {rows.map((wk, i) => {
        const weekTotal = wk.reduce((s, d) => s + dayAmt(d), 0)
        return (
          <div className="rev-grid" key={i}>
            {wk.map((d, j) => {
              const amt = dayAmt(d)
              const im = inMonth(d)
              const isToday = isoLocal(d) === todayIso
              const intensity = amt > 0 ? 0.1 + 0.5 * (amt / maxDay) : 0
              return (
                <button key={j} className={`rev-cell${im ? '' : ' out'}${isToday ? ' today' : ''}`}
                  style={amt > 0 ? { background: `rgba(107,127,101,${intensity.toFixed(2)})` } : undefined}
                  onClick={() => im && onDayClick(isoLocal(d))}>
                  <span className="rev-date">{d.getDate()}</span>
                  {amt > 0 && <span className="rev-amt">{money(amt)}</span>}
                </button>
              )
            })}
            <div className="rev-week">{weekTotal > 0 ? money(weekTotal) : ''}</div>
          </div>
        )
      })}
    </div>
  )
}
