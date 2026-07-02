import { useEffect, useRef, useState } from 'react'
import { hasGoogleMaps, loadGoogleMaps } from '../lib/googleMaps'

// Address field with Google Places autocomplete when a key is configured.
// Falls back to a plain text input (geocoded via Nominatim on save) otherwise.
// onChange(text) updates the address string; onSelect({address, lat, lng}) fires
// when a suggestion is picked (giving us exact coordinates for free).
export default function AddressAutocomplete({ value, onChange, onSelect, placeholder }) {
  const boxRef = useRef(null)
  const [useWidget, setUseWidget] = useState(false)

  useEffect(() => {
    if (!hasGoogleMaps()) return
    let el
    let cancelled = false
    loadGoogleMaps().then((maps) => {
      if (cancelled || !maps.places?.PlaceAutocompleteElement) return
      el = new maps.places.PlaceAutocompleteElement()
      el.style.width = '100%'
      boxRef.current?.appendChild(el)
      setUseWidget(true)
      el.addEventListener('gmp-select', async (e) => {
        try {
          const pred = e.placePrediction || e.detail?.placePrediction
          const place = pred.toPlace()
          await place.fetchFields({ fields: ['formattedAddress', 'location'] })
          const address = place.formattedAddress || ''
          const lat = place.location?.lat?.()
          const lng = place.location?.lng?.()
          onChange(address)
          onSelect?.({ address, lat, lng })
        } catch (err) { /* ignore malformed selections */ }
      })
    }).catch(() => { /* stays on plain input */ })
    return () => { cancelled = true; if (el?.remove) el.remove() }
  }, [])

  return (
    <>
      <div ref={boxRef} className="gmp-box" style={{ display: useWidget ? 'block' : 'none' }} />
      {!useWidget && (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </>
  )
}
