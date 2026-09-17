export type VanCounts = {
  small: number
  medium: number
  large: number
  luton: number
}

export type BookingStopForm = {
  address: string
  city: string
  zipCode: string
  access: 'lift' | 'stairs' | 'ground'
  stairsCount: number
}

export type ServiceExtrasForm = {
  dismantleItems: number
  assemblyItems: number
  packingBoxes: number
}

export const DISMANTLE_PRICE_PER_ITEM = 40
export const ASSEMBLY_PRICE_PER_ITEM = 50
export const PACKING_PRICE_PER_5_BOXES = 65

export const emptyVanCounts = (): VanCounts => ({
  small: 1,
  medium: 0,
  large: 0,
  luton: 0,
})

export const emptyServiceExtras = (): ServiceExtrasForm => ({
  dismantleItems: 0,
  assemblyItems: 0,
  packingBoxes: 0,
})

export const emptyStop = (): BookingStopForm => ({
  address: '',
  city: '',
  zipCode: '',
  access: 'ground',
  stairsCount: 1,
})

export function totalVans(counts: VanCounts): number {
  return counts.small + counts.medium + counts.large + counts.luton
}

export function formatVanCountsLabel(counts?: Partial<VanCounts> | null): string {
  if (!counts) return '—'
  const parts: string[] = []
  if (counts.small) parts.push(`${counts.small}× Small`)
  if (counts.medium) parts.push(`${counts.medium}× Medium`)
  if (counts.large) parts.push(`${counts.large}× Large`)
  if (counts.luton) parts.push(`${counts.luton}× Luton`)
  return parts.length ? parts.join(', ') : '—'
}

export function suggestedExtrasTotal(extras: ServiceExtrasForm): number {
  return (
    extras.dismantleItems * DISMANTLE_PRICE_PER_ITEM +
    extras.assemblyItems * ASSEMBLY_PRICE_PER_ITEM +
    (extras.packingBoxes / 5) * PACKING_PRICE_PER_5_BOXES
  )
}

export function formatServiceExtrasLabel(extras?: Partial<ServiceExtrasForm> | null): string {
  if (!extras) return '—'
  const parts: string[] = []
  if (extras.dismantleItems) {
    parts.push(`Dismantle ×${extras.dismantleItems} (+£${extras.dismantleItems * DISMANTLE_PRICE_PER_ITEM})`)
  }
  if (extras.assemblyItems) {
    parts.push(`Assembly ×${extras.assemblyItems} (+£${extras.assemblyItems * ASSEMBLY_PRICE_PER_ITEM})`)
  }
  if (extras.packingBoxes) {
    parts.push(
      `Packing ${extras.packingBoxes} boxes (+£${(extras.packingBoxes / 5) * PACKING_PRICE_PER_5_BOXES})`
    )
  }
  return parts.length ? parts.join('; ') : 'None'
}

export function vanCountsFromBooking(booking: any): VanCounts {
  if (booking?.vanCounts) {
    return {
      small: Number(booking.vanCounts.small) || 0,
      medium: Number(booking.vanCounts.medium) || 0,
      large: Number(booking.vanCounts.large) || 0,
      luton: Number(booking.vanCounts.luton) || 0,
    }
  }
  const type = booking?.vehicleType
  if (type === 'small' || type === 'medium' || type === 'large' || type === 'luton') {
    return { small: 0, medium: 0, large: 0, luton: 0, [type]: Math.max(1, Number(booking?.vans) || 1) }
  }
  return emptyVanCounts()
}

export function stopsFromBooking(booking: any): BookingStopForm[] {
  if (!Array.isArray(booking?.stops)) return []
  return booking.stops.slice(0, 3).map((stop: any) => ({
    address: stop.address || '',
    city: stop.city || '',
    zipCode: stop.zipCode || '',
    access: (stop.access as BookingStopForm['access']) || 'ground',
    stairsCount: stop.stairsCount || 1,
  }))
}

export function serviceExtrasFromBooking(booking: any): ServiceExtrasForm {
  return {
    dismantleItems: Number(booking?.serviceExtras?.dismantleItems) || 0,
    assemblyItems: Number(booking?.serviceExtras?.assemblyItems) || 0,
    packingBoxes: Number(booking?.serviceExtras?.packingBoxes) || 0,
  }
}
