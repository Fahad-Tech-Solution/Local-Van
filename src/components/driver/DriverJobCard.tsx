import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { GoogleMapsLink } from '@/components/GoogleMapsLink'
import {
  formatServiceExtrasLabel,
  formatVanCountsLabel,
  formatBookingPeopleLabel,
  formatStopsSummary,
} from '@/utils/manualBookingExtras'
import { formatCurrency, formatDate } from '@/utils/format'
import { Calendar, Clock, MapPin, Package, Phone, Truck, Users } from 'lucide-react'

type DriverJobCardProps = {
  booking: any
  href?: string
  price?: number | null
  priceLabel?: string
  showStatus?: boolean
  /** Hide customer phone / contact line (e.g. pending job offers). */
  hideContact?: boolean
  footer?: ReactNode
  className?: string
}

function customerName(booking: any) {
  return typeof booking.customer === 'object' && booking.customer?.name
    ? booking.customer.name
    : 'Customer'
}

function vehicleText(booking: any) {
  const vans = formatVanCountsLabel(booking.vanCounts)
  if (vans !== '—') return vans
  if (!booking.vehicleType) return null
  return String(booking.vehicleType).replace(/-/g, ' ')
}

function serviceText(booking: any) {
  if (!booking.serviceType) return null
  if (booking.serviceType === 'long-distance') return 'Long Distance'
  if (booking.serviceType === 'interstate') return 'Interstate'
  if (booking.serviceType === 'local') return 'Local'
  return String(booking.serviceType)
}

export function DriverJobCard({
  booking,
  href,
  price,
  priceLabel = 'Pay',
  showStatus = true,
  hideContact = false,
  footer,
  className = '',
}: DriverJobCardProps) {
  const displayPrice =
    price ?? booking.finalPrice ?? booking.estimatedPrice ?? null
  const vehicle = vehicleText(booking)
  const people = formatBookingPeopleLabel(booking)
  const service = serviceText(booking)
  const extras = formatServiceExtrasLabel(booking.serviceExtras)
  const stopsSummary = formatStopsSummary(booking.stops)
  const phone = hideContact
    ? null
    : booking.contactPhone ||
      (typeof booking.customer === 'object' ? booking.customer?.phone : null)

  const inner = (
    <div
      className={`rounded-xl border bg-card p-4 sm:p-5 space-y-3 shadow-sm transition-colors ${
        href ? 'hover:bg-muted/40 cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-base truncate">{customerName(booking)}</h3>
            {showStatus && booking.status && <StatusBadge status={booking.status} />}
            {booking.orderCode && (
              <Badge variant="outline" className="font-normal">
                #{booking.orderCode}
              </Badge>
            )}
          </div>
          {phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              {phone}
            </p>
          )}
        </div>
        {displayPrice != null && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{priceLabel}</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(displayPrice)}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {booking.pickupCity || '—'} → {booking.deliveryCity || '—'}
            </p>
            {(booking.pickupAddress || booking.deliveryAddress) && (
              <p className="text-xs mt-0.5 line-clamp-2">
                {[booking.pickupAddress, booking.deliveryAddress].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(booking.pickupDate) || '—'}</span>
          </div>
          {booking.pickupTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{booking.pickupTime}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground border-t pt-3">
        {service && (
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {service}
          </span>
        )}
        {vehicle && (
          <span className="inline-flex items-center gap-1 capitalize">
            <Truck className="h-3.5 w-3.5" />
            {vehicle}
          </span>
        )}
        {people && people !== '—' && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {people}
          </span>
        )}
        {stopsSummary && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {stopsSummary}
          </span>
        )}
        {extras && extras !== 'None' && extras !== '—' && <span>Extras: {extras}</span>}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <GoogleMapsLink
          address={booking.pickupAddress}
          city={booking.pickupCity}
          zipCode={booking.pickupZipCode}
          label="Pickup map"
          className="text-xs"
          asButton={!!href}
        />
        <GoogleMapsLink
          address={booking.deliveryAddress}
          city={booking.deliveryCity}
          zipCode={booking.deliveryZipCode}
          label="Delivery map"
          className="text-xs"
          asButton={!!href}
        />
      </div>

      {footer}
    </div>
  )

  if (href) {
    return (
      <Link to={href} className="block">
        {inner}
      </Link>
    )
  }

  return inner
}
