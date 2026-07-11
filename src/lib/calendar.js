// Lightweight Google Calendar integration for the prototype.
// Uses Google's "render" template URL — opens Google Calendar with the event
// pre-filled so it can be saved to the user's calendar with one click.
// (Full two-way sync requires OAuth + the Calendar API — see README.)

function toGCal(dateISO, time, durationMin) {
  const start = new Date(`${dateISO}T${time || '09:00'}:00`)
  const end = new Date(start.getTime() + (durationMin || 60) * 60000)
  const fmt = (d) =>
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') + 'T' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') + '00'
  return `${fmt(start)}/${fmt(end)}`
}

export function googleCalendarUrl({ title, dateISO, time, durationMin, details, location }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Landscape job',
    dates: toGCal(dateISO, time, durationMin),
    details: details || '',
    location: location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadICS({ title, dateISO, time, durationMin, details, location }) {
  const start = new Date(`${dateISO}T${time || '09:00'}:00`)
  const end = new Date(start.getTime() + (durationMin || 60) * 60000)
  const stamp = (d) =>
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') + 'T' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') + '00'
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Limb CRM//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@limb-crm`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title || 'Landscape job'}`,
    `DESCRIPTION:${(details || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(title || 'job').replace(/\s+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function icsStamp(d) {
  return d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') + 'T' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') + '00'
}
const icsEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

// How many upcoming (today-onward) jobs a bulk sync would include.
export function upcomingCount(jobs) {
  const n = new Date()
  const t = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  return (jobs || []).filter((j) => j.date >= t).length
}

// Download one .ics containing all jobs (upcoming by default) for a one-shot
// import into Google Calendar. Stable per-job UIDs mean re-importing updates
// events instead of duplicating them.
export function downloadBulkICS(jobs, clients, { upcomingOnly = true } = {}) {
  const byId = Object.fromEntries((clients || []).map((c) => [c.id, c]))
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const list = (jobs || [])
    .filter((j) => (upcomingOnly ? j.date >= todayIso : true))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const dtstamp = icsStamp(now)

  const events = list.map((j) => {
    const c = byId[j.clientId]
    const start = new Date(`${j.date}T${j.time || '08:00'}:00`)
    const end = new Date(start.getTime() + (j.duration || 60) * 60000)
    return [
      'BEGIN:VEVENT',
      `UID:${j.id}@limb-crm`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsEsc(`${c?.name || 'Job'} — ${j.title || 'Job'}`)}`,
      c?.address ? `LOCATION:${icsEsc(c.address)}` : null,
      `DESCRIPTION:${icsEsc(`${j.title || ''}${c?.phone ? ' · ' + c.phone : ''}`)}`,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  }).join('\r\n')

  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Limb CRM//EN', 'CALSCALE:GREGORIAN', events, 'END:VCALENDAR'].filter(Boolean).join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'limb-schedule.ics'
  a.click()
  URL.revokeObjectURL(url)
  return list.length
}
