import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { money } from '../lib/format'
import { StatusBadge, TypeBadge } from '../components/ui'
import { clientColor, clientMRR, clientWonProjects } from '../lib/metrics'
import { hasGoogleMaps } from '../lib/googleMaps'
import GoogleMapView from '../components/GoogleMapView'

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
  const pts = clients.filter((c) => c.lat && c.lng)
  const center = pts.length ? [pts[0].lat, pts[0].lng] : [40.68, -79.95]
  const withoutCoords = clients.length - pts.length
  const useGoogle = hasGoogleMaps()

  return (
    <div className="stack">
      <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="card-title">Property map</div>
          <div className="page-sub">{pts.length} located properties{withoutCoords > 0 ? ` · ${withoutCoords} missing an address` : ''}{useGoogle ? '' : ' · OpenStreetMap'}</div>
        </div>
        <div className="legend">
          <span><i style={{ background: '#6B7F65' }} />Recurring</span>
          <span><i style={{ background: '#c99a4b' }} />Project</span>
          <span><i style={{ background: '#4d6b7a' }} />Lead</span>
        </div>
      </div>

      {useGoogle ? <GoogleMapView clients={clients} /> : (
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
