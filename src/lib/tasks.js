import { isoLocal } from './store'

// One-tap presets that prefill the reminder text
export const TASK_PRESETS = [
  { label: 'Estimate', text: 'Send estimate' },
  { label: 'Follow-up', text: 'Follow up' },
  { label: 'Call', text: 'Call' },
]

const daysUntil = (due) => {
  const d = new Date(due + 'T00:00:00')
  const n = new Date(isoLocal(new Date()) + 'T00:00:00')
  return Math.round((d - n) / 86400000)
}

// classify a due date relative to today → drives the pill color
export function dueStatus(due) {
  if (!due) return ''
  const n = daysUntil(due)
  if (n < 0) return 'overdue'
  if (n === 0) return 'today'
  return n <= 3 ? 'soon' : 'later'
}

// short human label for a due date ("Today", "Tomorrow", "2d overdue", "Aug 3")
export function dueLabel(due) {
  if (!due) return ''
  const n = daysUntil(due)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n < 0) return `${-n}d overdue`
  if (n <= 6) return `In ${n}d`
  return new Date(due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// order tasks: open first, dated (soonest) before undated, newest first
export function sortTasks(tasks) {
  return [...(tasks || [])].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (!!a.due !== !!b.due) return a.due ? -1 : 1
    if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
}

// flatten OPEN tasks across all clients for the dashboard widget
export function openTasks(clients) {
  const out = []
  ;(clients || []).forEach((c) => (c.tasks || []).forEach((t) => {
    if (!t.done) out.push({ ...t, clientId: c.id, clientName: c.name })
  }))
  return sortTasks(out)
}

export const openTaskCount = (clients) =>
  (clients || []).reduce((n, c) => n + (c.tasks || []).filter((t) => !t.done).length, 0)
