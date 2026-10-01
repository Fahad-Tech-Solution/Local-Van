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

/** `manRequired` / helpersRateTier are pricing tiers 1–3, not a headcount. */
export function isHelpersRateTier(value: unknown): boolean {
  return /^[123]$/.test(String(value ?? '').trim())
}

const VEHICLE_DISPLAY_NAMES: Record<string, string> = {
  small: 'Small Van',
  medium: 'Medium Van',
  large: 'Large Van',
  luton: 'Luton Van',
  'small-van': 'Small Van',
  'medium-van': 'Medium Van',
  'large-van': 'Large Van',
  truck: 'Luton Van',
  'multi-van': 'Multi Van',
}

/**
 * Vehicle line for read views.
 * Luton is never shown as Large or as a generic truck.
 * Multi-van fleets use the exact qty label.
 */
export function formatBookingVehicleLabel(booking: any): string {
  if (!booking) return '—'

  const counts = booking.vanCounts
  const small = Number(counts?.small) || 0
  const medium = Number(counts?.medium) || 0
  const large = Number(counts?.large) || 0
  const luton = Number(counts?.luton) || 0
  const total = small + medium + large + luton
  const mixedFleet = total > 1 || (luton > 0 && (large > 0 || medium > 0 || small > 0))

  if (mixedFleet) {
    const vansLabel = String(booking.vansLabel || '').trim()
    if (vansLabel) return vansLabel
    const formatted = formatVanCountsLabel(counts)
    if (formatted !== '—') return formatted
  }

  const vanSize = String(booking.vanSize || '').toLowerCase()
  const vehicleType = String(booking.vehicleType || '')
  const singleLuton =
    (luton > 0 && large === 0 && medium === 0 && small === 0) ||
    ((vanSize === 'luton' || vehicleType === 'luton' || vehicleType === 'truck') &&
      large === 0 &&
      total <= 1)

  const name = String(booking.vehicleName || '').trim()
  if (singleLuton) {
    if (name && /luton/i.test(name)) return name
    return 'Luton Van'
  }

  if (name) {
    if (
      /large/i.test(name) &&
      (vanSize === 'luton' || vehicleType === 'truck' || vehicleType === 'luton' || luton > 0)
    ) {
      return 'Luton Van'
    }
    return name
  }

  const vansLabel = String(booking.vansLabel || '').trim()
  if (vansLabel) return vansLabel

  if (vanSize && VEHICLE_DISPLAY_NAMES[vanSize]) return VEHICLE_DISPLAY_NAMES[vanSize]
  if (vehicleType && VEHICLE_DISPLAY_NAMES[vehicleType]) return VEHICLE_DISPLAY_NAMES[vehicleType]

  const formatted = formatVanCountsLabel(counts)
  if (formatted !== '—') return formatted
  return '—'
}

/** People line for driver/admin read views. Crew size is drivers + additional helpers. */
export function formatBookingPeopleLabel(booking: any): string {
  if (!booking) return '—'
  const { drivers, helpers } = getBookingDriversAndHelpers(booking)
  const label = String(booking.helpersLabel || '').trim()

  if (drivers > 0 || helpers > 0) {
    if (label) return label
    const driverPart = `${drivers} driver${drivers === 1 ? '' : 's'}`
    const helperPart =
      helpers > 0
        ? ` + ${helpers} additional ${helpers === 1 ? 'person' : 'people'}`
        : ''
    return `${driverPart}${helperPart}`
  }

  if (label) return label

  const manRequired = String(booking.manRequired || '').trim()
  if (manRequired && !isHelpersRateTier(manRequired)) return manRequired

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

const LEGACY_VAN_SIZE: Record<string, keyof VanCounts> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
  luton: 'luton',
  'small-van': 'small',
  'medium-van': 'medium',
  'large-van': 'large',
  truck: 'luton',
}

export function vanCountsFromBooking(booking: any): VanCounts {
  if (booking?.vanCounts) {
    const counts = {
      small: Number(booking.vanCounts.small) || 0,
      medium: Number(booking.vanCounts.medium) || 0,
      large: Number(booking.vanCounts.large) || 0,
      luton: Number(booking.vanCounts.luton) || 0,
    }
    if (counts.small + counts.medium + counts.large + counts.luton > 0) {
      return counts
    }
  }
  const sizeKey = LEGACY_VAN_SIZE[String(booking?.vanSize || '').toLowerCase()]
  const typeKey = LEGACY_VAN_SIZE[String(booking?.vehicleType || '')]
  const key = sizeKey || typeKey
  if (key) {
    return {
      small: 0,
      medium: 0,
      large: 0,
      luton: 0,
      [key]: Math.max(1, Number(booking?.vans) || 1),
    }
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
