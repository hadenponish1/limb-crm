// Directions link that opens Apple Maps (routing from the driver's current
// location) on iPhone/Mac, and the Apple Maps web page elsewhere.
export const directionsUrl = (address) => `https://maps.apple.com/?daddr=${encodeURIComponent(address || '')}`
