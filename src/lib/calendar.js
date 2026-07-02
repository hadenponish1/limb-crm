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
