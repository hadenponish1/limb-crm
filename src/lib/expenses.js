import { freqPerMonth } from './store'

// Expense categories for a landscaping business. Order = display order.
export const EXPENSE_CATEGORIES = [
  'Materials',
  'Fuel / Gas',
  'Tools & Equipment',
  'Subcontractor / Labor',
  'Vehicle & Maintenance',
  'Dump / Disposal',
  'Subscriptions',
  'Insurance',
  'Office / Admin',
  'Other',
]

// A stable-ish color per category (hashed, from the shared palette).
const CAT_COLORS = ['#8a6d3b', '#9a5b4a', '#4d6b7a', '#7a6b8a', '#5c7a4d', '#b08544', '#6B7F65', '#4a7a6b', '#8a7d3b', '#7a5b6b']
export function categoryColor(cat) {
  const i = Math.max(0, EXPENSE_CATEGORIES.indexOf(cat))
  return CAT_COLORS[i % CAT_COLORS.length]
}

export const isRecurringExpense = (e) => !!e.recurring

// Monthly cost of one recurring expense (0 for one-offs). Uses the same 4-week-month
// convention as MRR so a "monthly" subscription counts once per month.
export function expenseMonthly(e) {
  return e.recurring ? (Number(e.amount) || 0) * freqPerMonth(e.frequency) : 0
}

// Total monthly recurring expense (MRE) across all recurring lines — the cost analog of MRR.
export function monthlyRecurringExpense(expenses) {
  return expenses.reduce((s, e) => s + expenseMonthly(e), 0)
}

// Actual one-off expenses keyed 'YYYY-MM'. Recurring lines are excluded here (they're accrued separately).
export function monthlyOneoffExpenses(expenses) {
  const map = {}
  expenses.forEach((e) => {
    if (e.recurring) return
    const key = (e.date || '').slice(0, 7)
    if (key) map[key] = (map[key] || 0) + (Number(e.amount) || 0)
  })
  return map
}

const monthIdxOf = (iso) => { const [y, m] = (iso || '').split('-').map(Number); return y && m ? y * 12 + (m - 1) : null }

// Total expense attributable to a given 'YYYY-MM': one-off entries dated that month
// plus every recurring line that had started by then (accrued at its monthly rate).
export function expenseForMonthKey(expenses, key) {
  const target = monthIdxOf(key + '-01')
  let total = 0
  expenses.forEach((e) => {
    if (e.recurring) {
      const start = monthIdxOf(e.date)
      if (start == null || start <= target) total += expenseMonthly(e)
    } else if ((e.date || '').slice(0, 7) === key) {
      total += Number(e.amount) || 0
    }
  })
  return total
}

// Per-category YTD spend: one-off entries dated this year + recurring accrued for the
// months elapsed this year (from the later of January or the line's start month).
export function categoryTotalsYTD(expenses, now = new Date()) {
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() // 0-based
  const map = {}
  const add = (cat, v) => { if (v) map[cat] = (map[cat] || 0) + v }
  expenses.forEach((e) => {
    const cat = e.category || 'Other'
    if (e.recurring) {
      const start = monthIdxOf(e.date)
      const janIdx = curYear * 12
      const from = start == null ? janIdx : Math.max(start, janIdx)
      const to = curYear * 12 + curMonth
      const months = Math.max(0, to - from + 1)
      add(cat, expenseMonthly(e) * months)
    } else if ((e.date || '').slice(0, 4) === String(curYear)) {
      add(cat, Number(e.amount) || 0)
    }
  })
  return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)
}

// Total expenses for the current calendar year (one-off dated this year + recurring accrued).
export function expensesYTD(expenses, now = new Date()) {
  return categoryTotalsYTD(expenses, now).reduce((s, r) => s + r.value, 0)
}

// This-calendar-month expense total (for the KPI).
export function expensesThisMonth(expenses, now = new Date()) {
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return expenseForMonthKey(expenses, key)
}
