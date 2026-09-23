import { Link } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { useBookings } from '@/hooks/useBookings'
import { FileText, Calendar, Clock, MapPin, Truck, Loader2 } from 'lucide-react'
import { Booking } from '@/api/bookings'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatVanCountsLabel } from '@/utils/manualBookingExtras'

const vehicleLabel = (booking: any) => {
  const vans = formatVanCountsLabel(booking.vanCounts)
  if (vans !== '—') return vans
  if (!booking.vehicleType) return '—'
  return String(booking.vehicleType)
    .split('-')
    .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

const serviceLabel = (value?: string) => {
  if (value === 'long-distance') return 'Long Distance'
  if (value === 'interstate') return 'Interstate'
  if (value === 'local') return 'Local'
  return value || '—'
}

const MyBookings = () => {
  const { data, isLoading, error } = useBookings()

  if (isLoading) {
    return (
      <DashboardLayout role="customer">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="customer">
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">Error loading bookings</p>
        </div>
      </DashboardLayout>
    )
  }

  const bookings = data?.bookings || []

  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
            <p className="text-muted-foreground">
              View and manage your moving service bookings
            </p>
          </div>
          <Button asChild>
            <Link to="/customer/book">New booking</Link>
          </Button>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4 text-center px-4">
              Book your first moving service to get started
            </p>
            <Button asChild>
              <Link to="/customer/book">Book now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: Booking) => {
              const b = booking as any
              const price = booking.finalPrice ?? booking.estimatedPrice
              const orderLabel =
                b.orderCode || `#${booking._id.slice(-6).toUpperCase()}`

              return (
                <Link
                  key={booking._id}
                  to={`/customer/bookings/${booking._id}`}
                  className="block"
                >
                  <div className="rounded-xl border bg-white p-4 sm:p-5 space-y-3 shadow-sm transition-colors hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base truncate">
                            {b.orderCode ? `#${b.orderCode}` : `Booking ${orderLabel}`}
                          </h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(price)}
                        </p>
                      </div>
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
                              {[booking.pickupAddress, booking.deliveryAddress]
                                .filter(Boolean)
                                .join(' · ')}
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
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Truck className="h-3.5 w-3.5" />
                        {vehicleLabel(b)}
                      </span>
                      <span>{serviceLabel(booking.serviceType)}</span>
                      {booking.additionalWorkPayment ? (
                        <span>
                          +{formatCurrency(booking.additionalWorkPayment)} additional
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default MyBookings
