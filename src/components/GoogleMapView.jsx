import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '../lib/googleMaps'
import { money } from '../lib/format'
import { clientColor, clientMRR, clientWonProjects } from '../lib/metrics'

// Google Maps rendering of client properties. Used when a Maps API key is set.
export default function GoogleMapView({ clients }) {
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const infoRef = useRef(null)
  const markersRef = useRef([])

  const pts = clients.filter((c) => c.lat && c.lng)

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then((maps) => {
      if (cancelled || !divRef.current) return
      if (!mapRef.current) {
        mapRef.current = new maps.Map(divRef.current, {
          center: pts.length ? { lat: pts[0].lat, lng: pts[0].lng } : { lat: 40.68, lng: -79.95 },
          zoom: 10, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        })
        infoRef.current = new maps.InfoWindow()
      }
      const map = mapRef.current
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      const bounds = new maps.LatLngBounds()
      pts.forEach((c) => {
        const marker = new maps.Marker({
          position: { lat: c.lat, lng: c.lng }, map, title: c.name,
          icon: { path: maps.SymbolPath.CIRCLE, scale: 9, fillColor: clientColor(c), fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        })
        marker.addListener('click', () => { infoRef.current.setContent(popupHtml(c)); infoRef.current.open(map, marker) })
        markersRef.current.push(marker)
        bounds.extend(marker.getPosition())
      })
      if (pts.length > 1) map.fitBounds(bounds, 60)
      else if (pts.length === 1) { map.setCenter({ lat: pts[0].lat, lng: pts[0].lng }); map.setZoom(13) }
    }).catch(() => { /* handled by MapView fallback */ })
    return () => { cancelled = true }
  }, [clients])

  return <div className="map-wrap"><div ref={divRef} style={{ width: '100%', height: '100%' }} /></div>
}

function popupHtml(c) {
  const mrr = clientMRR(c)
  const won = clientWonProjects(c)
  const svc = (c.services || []).map((s) => `<div style="font-size:12.5px;padding:1px 0">${s.service} · <b>${money(s.amount)}</b>${s.type === 'recurring' ? '/visit' : ''}</div>`).join('')
  const totals = (mrr > 0 || won > 0)
    ? `<div style="font-size:12px;color:#3f6b3d;margin-top:6px">${mrr > 0 ? money(mrr) + '/mo' : ''}${mrr > 0 && won > 0 ? ' · ' : ''}${won > 0 ? money(won) + ' won' : ''}</div>`
    : ''
  return `<div style="min-width:180px;font-family:Inter,sans-serif">
    <div style="font-weight:700;font-size:14px;margin-bottom:2px">${c.name}</div>
    <div style="color:#6c7568;font-size:12.5px;margin-bottom:6px">${c.address || ''}</div>
    ${svc}${totals}
  </div>`
}
