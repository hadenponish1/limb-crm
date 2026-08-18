import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { money } from '../lib/format'
import { StatusBadge, TypeBadge } from '../components/ui'
import { clientColor, clientMRR, clientWonProjects } from '../lib/metrics'
import { hasGoogleMaps } from '../lib/googleMaps'
import { SERVICES } from '../lib/store'
import GoogleMapView from '../components/GoogleMapView'

// A client matches when its status matches and it has a service line matching the
// chosen type + service (multi-service clients match if ANY line qualifies).
function clientMatches(c, f) {
  if (f.status !== 'all' && c.status !== f.status) return false
  if (f.type === 'all' && f.service === 'all') return true
  return (c.services || []).some((s) =>
    (f.type === 'all' || s.type === f.type) &&
    (f.service === 'all' || s.service === f.service))
}

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) {
      const bounds = points.map((p) => [p.lat, p.lng])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [points, map])
  return null
}

// Leaflet measures the container once at init; if it isn't at its final size yet
// (mobile layout shift, tab mount) tiles only cover that first area. Recompute
// after layout settles and on any container resize so the map always fills.
function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize())
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [map])
  return null
}

export default function MapView({ clients }) {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [service, setService] = useState('all')
  const filter = { status, type, service }
  const active = status !== 'all' || type !== 'all' || service !== 'all'
  const clear = () => { setStatus('all'); setType('all'); setService('all') }

  const filtered = clients.filter((c) => clientMatches(c, filter))
  const pts = filtered.filter((c) => c.lat && c.lng)
  const totalLocated = clients.filter((c) => c.lat && c.lng).length
  const center = pts.length ? [pts[0].lat, pts[0].lng] : [40.68, -79.95]
  const withoutCoords = filtered.length - pts.length
  const useGoogle = hasGoogleMaps()

  return (
    <div className="stack">
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="card-title">Property map</div>
            <div className="page-sub">
              {active ? `${pts.length} of ${totalLocated} properties` : `${pts.length} located properties`}
              {withoutCoords > 0 ? ` · ${withoutCoords} missing an address` : ''}{useGoogle ? '' : ' · OpenStreetMap'}
            </div>
          </div>
          <div className="legend">
            <span><i style={{ background: '#6B7F65' }} />Recurring</span>
            <span><i style={{ background: '#c99a4b' }} />Project</span>
            <span><i style={{ background: '#4d6b7a' }} />Lead</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Filter</span>
          <div className="seg">
            <button className={status === 'all' ? 'on' : ''} onClick={() => setStatus('all')}>All</button>
            <button className={status === 'active' ? 'on' : ''} onClick={() => setStatus('active')}>Active</button>
            <button className={status === 'lead' ? 'on' : ''} onClick={() => setStatus('lead')}>Leads</button>
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 170 }}>
            <option value="all">All types</option>
            <option value="recurring">Recurring</option>
            <option value="project">Project</option>
          </select>
          <select value={service} onChange={(e) => setService(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="all">All services</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {active && <button className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>}
        </div>
      </div>

      {useGoogle ? <GoogleMapView clients={filtered} /> : (
      <div className="map-wrap">
        <MapContainer center={center} zoom={10} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoResize />
          <FitBounds points={pts} />
          {pts.map((c) => {
            const mrr = clientMRR(c)
            const won = clientWonProjects(c)
            return (
              <CircleMarker key={c.id} center={[c.lat, c.lng]} radius={10}
                pathOptions={{ color: '#fff', weight: 2, fillColor: clientColor(c), fillOpacity: 0.95 }}>
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                    <div style={{ color: '#6c7568', fontSize: 12.5, marginBottom: 8 }}>{c.address}</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={c.status} />
                      {(c.services || []).map((s) => <TypeBadge key={s.id} type={s.type} />)}
                    </div>
                    {(c.services || []).map((s) => (
                      <div key={s.id} style={{ fontSize: 12.5, padding: '1px 0' }}>{s.service} · <b>{money(s.amount)}</b>{s.type === 'recurring' ? '/visit' : ''}</div>
                    ))}
                    {(mrr > 0 || won > 0) && (
                      <div style={{ fontSize: 12, color: '#3f6b3d', marginTop: 6 }}>
                        {mrr > 0 && `${money(mrr)}/mo`}{mrr > 0 && won > 0 && ' · '}{won > 0 && `${money(won)} won`}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
      )}
    </div>
  )
}
