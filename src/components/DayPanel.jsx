import { useState } from 'react'
import { Icon } from './icons'
import { money, fmtTime, fmtDate } from '../lib/format'
import { isoLocal } from '../lib/store'
import { googleCalendarUrl } from '../lib/calendar'

const HOUR_H = 56 // px per hour
const SNAP = 15   // minutes

const timeToMin = (t) => { const [h, m] = (t || '08:00').split(':').map(Number); return h * 60 + (m || 0) }
const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const fmtHour = (h) => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`)

// Assign overlapping events to side-by-side columns (per overlap cluster).
function layout(list) {
  const items = list.map((ev) => ({ ev, s: timeToMin(ev.time), e: timeToMin(ev.time) + (ev.duration || 60) }))
    .sort((a, b) => a.s - b.s || a.e - b.e)
  const out = []
  let cluster = []
  let clusterEnd = -1
  const flush = () => {
    const cols = []
    cluster.forEach((it) => { let c = cols.findIndex((end) => end <= it.s); if (c === -1) { c = cols.length; cols.push(it.e) } else cols[c] = it.e; it.col = c })
    const n = cols.length || 1
    cluster.forEach((it) => out.push({ ...it, cols: n }))
    cluster = []; clusterEnd = -1
  }
  items.forEach((it) => { if (cluster.length && it.s >= clusterEnd) flush(); cluster.push(it); clusterEnd = Math.max(clusterEnd, it.e) })
  flush()
  return out
}

export default function DayPanel({ date, jobs, byId, onClose, onNewJob, onJobClick, deleteJob, updateJob }) {
  const [drag, setDrag] = useState(null) // { id, startY, origMin, curMin, moved }
  const todayIso = isoLocal(new Date())
  const list = jobs.filter((j) => j.date === date)
  const total = list.reduce((s, j) => s + (j.amount || 0), 0)

  // visible hour range: default 6am–8pm, expanded to fit any job
  let startH = 6, endH = 20
  list.forEach((j) => { const s = Math.floor(timeToMin(j.time) / 60); const e = Math.ceil((timeToMin(j.time) + (j.duration || 60)) / 60); startH = Math.min(startH, s); endH = Math.max(endH, e) })
  const rangeStart = startH * 60
  const rangeEnd = endH * 60
  const hours = endH - startH
  const gridH = hours * HOUR_H
  const placed = layout(list)

  function onDown(e, item) {
    if (e.target.closest('button, a')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ id: item.ev.id, startY: e.clientY, origMin: item.s, curMin: item.s, moved: false })
  }
  function onMove(e) {
    setDrag((d) => {
      if (!d) return d
      const dy = e.clientY - d.startY
      let m = d.origMin + Math.round((dy / HOUR_H) * 60 / SNAP) * SNAP
      m = Math.max(rangeStart, Math.min(rangeEnd - SNAP, m))
      return { ...d, curMin: m, moved: d.moved || Math.abs(dy) > 4 }
    })
  }
  function onUp(item) {
    setDrag((d) => {
      if (!d) return null
      if (!d.moved) onJobClick(item.ev)
      else if (d.curMin !== d.origMin) updateJob(item.ev.id, { time: minToTime(d.curMin) })
      return null
    })
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer day" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="card-title">{fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="page-sub">{list.length} job{list.length !== 1 ? 's' : ''} · <span className="money" style={{ color: 'var(--green)' }}>{money(total)}</span></div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="drawer-body" style={{ padding: '10px 14px' }}>
          {list.length === 0 && <div className="page-sub" style={{ fontSize: 13, padding: '10px 8px' }}>Nothing scheduled this day.</div>}
          <div className="tg" style={{ height: gridH }}>
            {Array.from({ length: hours + 1 }).map((_, i) => (
              <div key={i} className="tg-line" style={{ top: i * HOUR_H }}><span className="tg-hour">{fmtHour(startH + i)}</span></div>
            ))}
            <div className="tg-col">
              {placed.map((item) => {
                const j = item.ev
                const dragging = drag?.id === j.id
                const s = dragging ? drag.curMin : item.s
                const top = ((s - rangeStart) / 60) * HOUR_H
                const height = Math.max(22, ((item.e - item.s) / 60) * HOUR_H - 3)
                const past = j.date < todayIso
                const cl = byId[j.clientId]
                const gcal = googleCalendarUrl({ title: `${cl?.name || 'Job'} — ${j.title}`, dateISO: j.date, time: minToTime(s), durationMin: j.duration, details: j.title, location: cl?.address || '' })
                return (
                  <div key={j.id} className={`tg-event${past ? ' done' : ''}${j.type === 'project' ? ' project' : ''}${dragging ? ' dragging' : ''}`}
                    style={{ top, height, left: `calc(${(item.col * 100) / item.cols}% + 1px)`, width: `calc(${100 / item.cols}% - 3px)` }}
                    onPointerDown={(e) => onDown(e, item)} onPointerMove={onMove} onPointerUp={() => onUp(item)}>
                    <div className="tg-event-time">{fmtTime(minToTime(s))}{dragging && drag.moved ? '' : ''}</div>
                    <div className="tg-event-title">{cl?.name || j.title}</div>
                    {height > 40 && <div className="tg-event-sub">{j.title} · {money(j.amount)}</div>}
                    <div className="tg-event-actions">
                      <a className="icon-btn" href={gcal} target="_blank" rel="noreferrer" title="Add to Google Calendar" onPointerDown={(e) => e.stopPropagation()}><Icon.calendar style={{ width: 13, height: 13 }} /></a>
                      <button className="icon-btn" title="Delete" onPointerDown={(e) => e.stopPropagation()} onClick={() => deleteJob(j.id)}><Icon.trash style={{ width: 13, height: 13 }} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="drawer-foot" style={{ justifyContent: 'space-between' }}>
          <span className="page-sub" style={{ fontSize: 12 }}>Drag an event to reschedule</span>
          <button className="btn btn-primary" onClick={() => onNewJob(date)}><Icon.plus /> New job this day</button>
        </div>
      </aside>
    </div>
  )
}
