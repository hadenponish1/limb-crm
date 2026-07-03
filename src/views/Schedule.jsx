import { useState } from 'react'
import { Icon } from '../components/icons'
import { TypeBadge } from '../components/ui'
import MonthCalendar from '../components/MonthCalendar'
import JobModal from '../components/JobModal'
import DayPanel from '../components/DayPanel'
import { money, dayParts, fmtTime, fmtDate } from '../lib/format'
import { googleCalendarUrl, downloadICS } from '../lib/calendar'

export default function Schedule(store) {
  const { clients, jobs, addJob, deleteJob, updateJob, upsertService, generateSeries, previewRecurring, generateRecurring } = store
  const [view, setView] = useState('calendar')
  const [addOpen, setAddOpen] = useState(false)
  const [addDate, setAddDate] = useState(null)
  const [genOpen, setGenOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [dayPanel, setDayPanel] = useState(null) // ISO date | null
  const byId = Object.fromEntries(clients.map((c) => [c.id, c]))

  const openAdd = (date = null) => { setAddDate(date); setAddOpen(true) }

  return (
    <div className="stack">
      <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: 'linear-gradient(120deg,#eef3ea,#faf8f2)' }}>
        <div>
          <div className="card-title">Job schedule</div>
          <div className="page-sub">Pick a client and service — recurring visits auto-fill, one-offs drop a single job.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="seg" style={{ background: '#fff', borderRadius: 10, padding: 3, border: '1px solid var(--line)' }}>
            <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')} style={{ border: 'none', padding: '7px 14px' }}>
              <Icon.calendar style={{ width: 15, height: 15, verticalAlign: '-3px', marginRight: 6 }} />Calendar
            </button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} style={{ border: 'none', padding: '7px 14px' }}>
              <Icon.dashboard style={{ width: 15, height: 15, verticalAlign: '-3px', marginRight: 6 }} />List
            </button>
          </div>
          <button className="btn btn-ghost" onClick={() => setGenOpen(true)}><Icon.repeat /> Auto-fill recurring</button>
          <button className="btn btn-primary" onClick={() => openAdd()}><Icon.plus /> Schedule job</button>
        </div>
      </div>

      {view === 'calendar'
        ? <MonthCalendar jobs={jobs} byId={byId} onDayClick={setDayPanel} onJobClick={setDetail} />
        : <ListView jobs={jobs} byId={byId} onJobClick={setDetail} />}

      {dayPanel && (
        <DayPanel date={dayPanel} jobs={jobs} byId={byId} deleteJob={deleteJob} updateJob={updateJob}
          onClose={() => setDayPanel(null)}
          onJobClick={(j) => setDetail(j)}
          onNewJob={(date) => { setDayPanel(null); openAdd(date) }} />
      )}
      {addOpen && <JobModal clients={clients} initialDate={addDate} onClose={() => setAddOpen(false)} addJob={addJob} upsertService={upsertService} generateSeries={generateSeries} />}
      {genOpen && <GenerateModal previewRecurring={previewRecurring} generateRecurring={generateRecurring} onClose={() => setGenOpen(false)} />}
      {detail && <JobDetail job={detail} client={byId[detail.clientId]} onClose={() => setDetail(null)} onDelete={(id) => { deleteJob(id); setDetail(null) }} />}
    </div>
  )
}

function ListView({ jobs, byId, onJobClick }) {
  const sorted = [...jobs].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const groups = {}
  sorted.forEach((j) => { (groups[j.date] ||= []).push(j) })
  if (!sorted.length) return <div className="card card-pad empty">No jobs scheduled yet.</div>

  return (
    <>
      {Object.entries(groups).map(([date, list]) => {
        const dp = dayParts(date)
        const dayTotal = list.reduce((s, j) => s + (j.amount || 0), 0)
        return (
          <div className="card card-pad" key={date}>
            <div className="card-head">
              <div className="card-title" style={{ fontSize: 15 }}>{dp.weekday}, {dp.month} {dp.day}</div>
              <span className="money" style={{ color: 'var(--green)' }}>{money(dayTotal)}</span>
            </div>
            {list.map((j) => {
              const cl = byId[j.clientId]
              return (
                <div className="job-row" key={j.id} onClick={() => onJobClick(j)} style={{ cursor: 'pointer' }}>
                  <div className="job-date"><div className="d">{dp.day}</div><div className="m">{dp.month}</div></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{cl?.name} — {j.title} {j.recurring && <span className="badge recurring" style={{ marginLeft: 6 }}><Icon.repeat style={{ width: 11, height: 11 }} /> auto</span>}</div>
                    <div className="page-sub" style={{ display: 'flex', gap: 14, marginTop: 3, fontSize: 12.5 }}>
                      <span><Icon.clock style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> {fmtTime(j.time)} · {j.duration}m</span>
                      {cl?.address && <span><Icon.pin style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> {cl.address}</span>}
                    </div>
                  </div>
                  {j.type && <TypeBadge type={j.type} />}
                  <span className="money" style={{ width: 90, textAlign: 'right' }}>{money(j.amount)}</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

function JobDetail({ job, client, onClose, onDelete }) {
  const gcal = googleCalendarUrl({
    title: `${client?.name || 'Job'} — ${job.title}`,
    dateISO: job.date, time: job.time, durationMin: job.duration,
    details: `${job.title}\nClient: ${client?.contact || ''} ${client?.phone || ''}\nAmount: ${money(job.amount)}`,
    location: client?.address || '',
  })
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">{client?.name}</div>
            <div className="page-sub">{job.title}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          <div className="detail-row"><Icon.calendar /> <span>{fmtDate(job.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
          <div className="detail-row"><Icon.clock /> <span>{fmtTime(job.time)} · {job.duration} min</span></div>
          {client?.address && <div className="detail-row"><Icon.pin /> <span>{client.address}</span></div>}
          <div className="detail-row"><Icon.dollar /> <span className="money">{money(job.amount)}</span></div>
          {job.recurring && <div className="detail-row" style={{ color: 'var(--green)' }}><Icon.repeat /> <span>Auto-generated recurring visit</span></div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <a className="btn btn-primary btn-sm" href={gcal} target="_blank" rel="noreferrer" style={{ flex: 1, justifyContent: 'center' }}><Icon.calendar /> Google Calendar</a>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadICS({ title: `${client?.name} — ${job.title}`, dateISO: job.date, time: job.time, durationMin: job.duration, location: client?.address })}><Icon.download /> .ics</button>
          </div>
        </div>
        <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(job.id)}><Icon.trash /> Delete</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function GenerateModal({ previewRecurring, generateRecurring, onClose }) {
  const [weeks, setWeeks] = useState(8)
  const [done, setDone] = useState(null)
  const preview = previewRecurring(weeks)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">Auto-fill recurring visits</div>
            <div className="page-sub">Create jobs from every recurring service across active clients</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">
          {done === null ? (
            <>
              <div className="field">
                <label>Generate visits for the next…</label>
                <div className="seg">
                  {[4, 8, 12].map((w) => <button key={w} type="button" className={weeks === w ? 'on' : ''} onClick={() => setWeeks(w)}>{w} weeks</button>)}
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: preview.perClient.length ? 12 : 0 }}>
                  <span style={{ fontWeight: 600 }}>New visits to create</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--moss)' }}>{preview.total}</span>
                </div>
                {preview.perClient.map(({ client, count }) => (
                  <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', color: 'var(--muted)' }}>
                    <span>{client.name}</span><span>{count} visit{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {preview.total === 0 && <div className="page-sub" style={{ marginTop: 4 }}>All recurring visits in this window already exist. Nothing to add.</div>}
              </div>
              <div className="page-sub" style={{ marginTop: 12, fontSize: 12.5 }}>Covers every recurring service line. Existing visits won't be duplicated.</div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6efe0', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <Icon.repeat style={{ width: 26, height: 26, color: '#3f6b3d' }} />
              </div>
              <div className="card-title">{done} visit{done !== 1 ? 's' : ''} added</div>
              <div className="page-sub" style={{ marginTop: 6 }}>They're on your schedule now. Use each job's Google button to push to your calendar.</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {done === null ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setDone(generateRecurring(weeks))} disabled={preview.total === 0}><Icon.repeat /> Generate {preview.total || ''} visits</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>
  )
}
