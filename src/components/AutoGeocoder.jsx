import { useEffect, useRef } from 'react'
import { geocode } from '../lib/geocode'

// Background worker: any client that has an address but no lat/lng (e.g. a lead
// pushed in by n8n) gets geocoded and saved, so it lands on the map automatically.
// Renders nothing. Throttled to stay within the free geocoder's limits.
export default function AutoGeocoder({ clients, updateClient, enabled }) {
  const clientsRef = useRef(clients)
  const attempted = useRef(new Set()) // ids we've already tried this session
  const running = useRef(false)

  useEffect(() => { clientsRef.current = clients })

  useEffect(() => {
    if (!enabled || running.current) return
    const needs = (c) => c.address && (c.lat == null || c.lng == null) && !attempted.current.has(c.id)
    if (!clients.some(needs)) return

    running.current = true
    ;(async () => {
      // process sequentially, always reading the freshest client list
      while (true) {
        const next = clientsRef.current.find(needs)
        if (!next) break
        attempted.current.add(next.id)
        const coords = await geocode(next.address)
        if (coords) updateClient(next.id, { lat: coords.lat, lng: coords.lng })
        await new Promise((r) => setTimeout(r, 1200))
      }
      running.current = false
    })()
  }, [clients, enabled, updateClient])

  return null
}
