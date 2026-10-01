export type AddressParts = {
  houseName?: string | null
  houseNumber?: string | null
  address?: string | null
  city?: string | null
  zipCode?: string | null
}

/** Compose a single-line UK-style address for display/emails. */
export function formatFullAddress(parts: AddressParts): string {
  const head = [parts.houseName, parts.houseNumber].filter(Boolean).join(' ').trim()
  const street = (parts.address || '').trim()
  const line1 = [head, street].filter(Boolean).join(', ')
  const rest = [parts.city, parts.zipCode].filter(Boolean).join(', ')
  return [line1, rest].filter(Boolean).join(', ')
}
