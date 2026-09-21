// Estimate sheets: the CRM asks an n8n webhook to copy a Google Sheets estimate
// template, prefill it with the client's data, and hand back the new sheet's URL
// (which we save on the quote). The webhook URL is set at build time via
// VITE_ESTIMATE_WEBHOOK_URL (Railway env var), so nothing secret ships in code.
const WEBHOOK = import.meta.env.VITE_ESTIMATE_WEBHOOK_URL || ''

export const hasEstimateWebhook = () => !!WEBHOOK

// Human-readable, roughly-unique id, e.g. EST-20260920-9F3A
export function newEstimateId() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `EST-${ymd}-${rand}`
}

// POST the client data to n8n; expect { url } (the new sheet) back.
export async function createEstimateSheet(payload) {
  if (!WEBHOOK) throw new Error('Estimate service not configured — set VITE_ESTIMATE_WEBHOOK_URL.')
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Estimate service returned ${res.status}`)
  const data = await res.json().catch(() => ({}))
  const url = data.url || data.sheetUrl || data.link
  if (!url) throw new Error('Estimate service did not return a sheet URL.')
  return { url, estimateId: data.estimateId || payload.estimateId }
}

// Build the payload sent to n8n from a quote row + its client. Field names line up
// with the template cells: clientName→C5, address→C6, phone·email→C7, estimateId→C8,
// date→C9, validUntil→C10, jobName→C11 (on the "Estimate" tab).
export function estimatePayload({ estimateId, row, client }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const today = new Date()
  const valid = new Date(today); valid.setDate(valid.getDate() + 30) // "valid until" = 30 days out
  const iso = (d) => d.toISOString().slice(0, 10)
  return {
    estimateId,
    date: iso(today),
    validUntil: iso(valid),
    clientId: row.clientId,
    clientName: row.name,
    contact: client?.contact || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: row.address || client?.address || '',
    service: row.service || '',
    description: row.desc || '',
    jobName: row.desc || `${row.service || 'Landscape'} estimate`,
    amount: row.amount || 0,
    // link the sheet back to this client in the CRM
    clientLink: origin ? `${origin}/?client=${row.clientId}` : '',
  }
}
