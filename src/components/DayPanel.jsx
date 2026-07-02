import { Icon } from './icons'
import { money, fmtTime, fmtDate } from '../lib/format'
import { isoLocal } from '../lib/store'
import { googleCalendarUrl } from '../lib/calendar'

// Slide-in panel showing every job on a given day, with an option to add one.
export default function DayPanel({ date, jobs, byId, onClose, onNewJob, onJobClick, deleteJob }) {
  const todayIso = isoLocal(new Date())
  const list = jobs.filter((j) => j.date === date).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  const total = list.reduce((s, j) => s + (j.amount || 0), 0)

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="card-title">{fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="page-sub">{list.length} job{list.length !== 1 ? 's' : ''} · <span className="money" style={{ color: 'var(--green)' }}>{money(total)}</span></div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="drawer-body">
          {list.length === 0 && <div className="page-sub" style={{ fontSize: 13 }}>Nothing scheduled this day.</div>}
          <div className="stack" style={{ gap: 8 }}>
            {list.map((j) => {
              const cl = byId[j.clientId]
              const past = j.date < todayIso
              const gcal = googleCalendarUrl({ title: `${cl?.name || 'Job'} — ${j.title}`, dateISO: j.date, time: j.time, durationMin: j.duration, details: j.title, location: cl?.address || '' })
              return (
                <div className={`mini-job${past ? ' done' : ''}`} key={j.id} onClick={() => onJobClick(j)} style={{ cursor: 'pointer' }}>
                  <div style={{ width: 58, flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(j.time)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{j.duration}m</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cl?.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                  </div>
                  {past && <span className="badge active" style={{ flexShrink: 0 }}>Done</span>}
                  <span className="money" style={{ fontSize: 12.5, flexShrink: 0 }}>{money(j.amount)}</span>
                  <a className="icon-btn" href={gcal} target="_blank" rel="noreferrer" title="Add to Google Calendar" onClick={(e) => e.stopPropagation()}><Icon.calendar style={{ width: 15, height: 15 }} /></a>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); deleteJob(j.id) }} title="Delete job"><Icon.trash style={{ width: 15, height: 15 }} /></button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="drawer-foot" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => onNewJob(date)}><Icon.plus /> New job this day</button>
        </div>
      </aside>
    </div>
  )
}
