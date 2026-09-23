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

/** People line for driver/admin read views — prefers website helpersLabel when present. */
export function formatBookingPeopleLabel(booking: any): string {
  if (!booking) return '—'
  const { drivers, helpers } = getBookingDriversAndHelpers(booking)
  if (drivers > 0 || helpers > 0) {
    return `${drivers} driver${drivers === 1 ? '' : 's'}${
      helpers > 0 ? ` + ${helpers} helper${helpers === 1 ? '' : 's'}` : ''
    }`
  }
  if (booking.helpersLabel && String(booking.helpersLabel).trim()) {
    return String(booking.helpersLabel).trim()
  }
  if (booking.manRequired && String(booking.manRequired).trim()) {
    return String(booking.manRequired).trim()
  }
  const men = Number(booking.men)
  if (!Number.isNaN(men) && men > 0) {
    return men === 1 ? '1 person' : `${men} people`
  }
  return '—'
}

/**
 * Resolve driver/helper counts for display.
 * Uses numeric fields when set; otherwise parses helpersLabel like "Driver + 1 helper".
 */
export function getBookingDriversAndHelpers(booking: any): {
  drivers: number
  helpers: number
} {
  if (!booking) return { drivers: 0, helpers: 0 }

  const driversNum = Number(booking.drivers)
  const helpersNum = Number(booking.helpers)
  const hasMeaningfulNums =
    (!Number.isNaN(driversNum) && driversNum > 0) ||
    (!Number.isNaN(helpersNum) && helpersNum > 0)

  if (hasMeaningfulNums) {
    return {
      drivers: Number.isNaN(driversNum) ? 0 : Math.max(0, driversNum),
      helpers: Number.isNaN(helpersNum) ? 0 : Math.max(0, helpersNum),
    }
  }

  const label = String(booking.helpersLabel || '').trim()
  if (label) {
    const helperMatch = label.match(/(\d+)\s*helpers?/i)
    const hasHelperWord = /\bhelpers?\b/i.test(label)
    const helpers = helperMatch ? Number(helperMatch[1]) : hasHelperWord ? 1 : 0

    const driverMatch = label.match(/(\d+)\s*drivers?/i)
    const hasDriverWord = /\bdrivers?\b/i.test(label)
    const drivers = driverMatch ? Number(driverMatch[1]) : hasDriverWord ? 1 : 0

    if (drivers > 0 || helpers > 0) {
      return { drivers, helpers }
    }
  }

  // Fallback: vans often equals drivers; men = drivers + helpers
  const vans = Number(booking.vans)
  const men = Number(booking.men)
  if (!Number.isNaN(vans) && vans > 0) {
    const drivers = vans
    const helpers =
      !Number.isNaN(men) && men > drivers ? men - drivers : 0
    return { drivers, helpers }
  }

  return { drivers: 0, helpers: 0 }
}

/** Duration for display — bare numbers become "N hours". */
export function formatDurationLabel(
  durationRequired?: string | number | null,
  hours?: number | null
): string {
  const raw =
    durationRequired != null && String(durationRequired).trim() !== ''
      ? String(durationRequired).trim()
      : hours != null && !Number.isNaN(Number(hours))
        ? String(hours)
        : ''
  if (!raw) return '—'
  if (/hour/i.test(raw)) return raw
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw)
    return `${raw} hour${n === 1 ? '' : 's'}`
  }
  return raw
}

export function formatStopsSummary(stops?: any[] | null): string | null {
  if (!Array.isArray(stops) || stops.length === 0) return null
  return `${stops.length} stop${stops.length === 1 ? '' : 's'}`
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
