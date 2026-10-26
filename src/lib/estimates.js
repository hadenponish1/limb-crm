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
// with the v2 template's "Job Setup" tab: clientName→C6, address→C7, phoneEmail→C8,
// estimateId→C9, date→C10, jobName→C13, scope→C14. (C11 valid-days stays at the
// template default and C12 valid-until is a formula, so neither is written.)
export function estimatePayload({ estimateId, row, client }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const address = row.address || client?.address || ''
  const street = address.split(',')[0].trim()
  const phone = client?.phone || ''
  const email = client?.email || ''
  return {
    estimateId,
    date: today,
    clientId: row.clientId,
    clientName: row.name,
    contact: client?.contact || '',
    email,
    phone,
    phoneEmail: [phone, email].filter(Boolean).join(' · '),
    address,
    service: row.service || '',
    description: row.desc || '',
    // e.g. "13631 Trilithon Rd - Mulch & Beds Estimate"
    jobName: [street, `${row.service || 'Landscape'} Estimate`].filter(Boolean).join(' - '),
    scope: row.desc || '',
    amount: row.amount || 0,
    // link the sheet back to this client in the CRM
    clientLink: origin ? `${origin}/?client=${row.clientId}` : '',
  }
}
