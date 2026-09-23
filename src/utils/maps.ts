/** Build a single-line address from booking location fields. */
export function formatLocationQuery(parts: {
  address?: string | null
  city?: string | null
  zipCode?: string | null
}): string {
  return [parts.address, parts.city, parts.zipCode]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(', ')
}

/** Google Maps search URL for a place/address (opens in app or browser). */
export function googleMapsSearchUrl(query: string): string | null {
  const q = query.trim()
  if (!q) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function googleMapsUrlForLocation(parts: {
  address?: string | null
  city?: string | null
  zipCode?: string | null
}): string | null {
  return googleMapsSearchUrl(formatLocationQuery(parts))
}
