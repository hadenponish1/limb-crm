// Loads the Google Maps JS API on demand, once, using VITE_GOOGLE_MAPS_API_KEY.
// If no key is set, the app falls back to the free Leaflet/OpenStreetMap map and
// a plain address input, so nothing breaks without Google configured.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export const hasGoogleMaps = () => !!KEY

let promise = null
export function loadGoogleMaps() {
  if (!KEY) return Promise.reject(new Error('No Google Maps API key'))
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    // Note: intentionally NOT using loading=async — that defers the constructors
    // (maps.Map, PlaceAutocompleteElement) behind importLibrary(); loading them
    // eagerly keeps `new maps.Map()` available the moment onload fires.
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places,marker&v=weekly`
    s.async = true
    s.defer = true
    s.onload = () => resolve(window.google.maps)
    s.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(s)
  })
  return promise
}
