// Free geocoding via OpenStreetMap Nominatim (fine for a prototype / low volume).
// Returns { lat, lng } or null.
export async function geocode(address) {
  if (!address) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch (e) { /* offline / rate-limited */ }
  return null
}
