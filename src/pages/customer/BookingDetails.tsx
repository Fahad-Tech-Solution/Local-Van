import { useParams, Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBooking, useCancelBooking, useAmendBooking } from '@/hooks/useBookings'
import {
  MapPin,
  Package,
  AlertCircle,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  formatVanCountsLabel,
  formatDurationLabel,
  getBookingDriversAndHelpers,
  serviceExtrasFromBooking,
} from '@/utils/manualBookingExtras'
import { formatStairsDisplay, formatAccessFromAdmin } from '@/utils/stairsAccess'
import { GoogleMapsLink } from '@/components/GoogleMapsLink'
import { ReadField, SectionShell } from '@/components/booking/SectionShell'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const vehicleLabel = (value?: string) =>
  value?.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || '—'

const serviceLabel = (value?: string) => {
  if (value === 'long-distance') return 'Long Distance'
  if (value === 'interstate') return 'Interstate'
  if (value === 'local') return 'Local'
  return value || '—'
}

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: booking, isLoading, error } = useBooking(id || '')
  const cancelBooking = useCancelBooking()
  const amendBooking = useAmendBooking()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [amendDialogOpen, setAmendDialogOpen] = useState(false)
  const [amendData, setAmendData] = useState({
    hours: '',
    men: '',
    vans: '',
    pickupDate: '',
    pickupTime: '',
  })
  const [amendError, setAmendError] = useState('')
  const [amendSuccess, setAmendSuccess] = useState('')

  useEffect(() => {
    if (booking) {
      setAmendData({
        hours: booking.hours?.toString() || '',
        men: booking.men?.toString() || '',
        vans: booking.vans?.toString() || '1',
        pickupDate: booking.pickupDate
          ? new Date(booking.pickupDate).toISOString().split('T')[0]
          : '',
        pickupTime: booking.pickupTime || '',
      })
    }
  }, [booking])

  const handleCancel = async () => {
    if (!id) return
    try {
      await cancelBooking.mutateAsync(id)
      setCancelDialogOpen(false)
      navigate('/customer/bookings')
    } catch (err) {
      console.error('Failed to cancel booking:', err)
      throw err
    }
  }

  const handleAmend = async () => {
    if (!id) return
    setAmendError('')
    setAmendSuccess('')

    try {
      const payload: any = {}
      if (amendData.hours) payload.hours = parseInt(amendData.hours)
      if (amendData.men) payload.men = parseInt(amendData.men)
      if (amendData.vans) payload.vans = parseInt(amendData.vans)
      if (amendData.pickupDate) payload.pickupDate = amendData.pickupDate
      if (amendData.pickupTime) payload.pickupTime = amendData.pickupTime

      const result = await amendBooking.mutateAsync({ id, data: payload })
      let message = result?.message || 'Booking amended successfully!'
      if (result?.newPrice !== undefined) {
        message += ` New price: ${formatCurrency(result.newPrice)}`
      }
      setAmendSuccess(message)
      setAmendDialogOpen(false)
      setTimeout(() => setAmendSuccess(''), 5000)
    } catch (err: any) {
      setAmendError(err?.response?.data?.message || 'Failed to amend booking')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout role="customer">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !booking) {
    return (
      <DashboardLayout role="customer">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive">Booking not found</p>
          <Button asChild className="mt-4">
            <Link to="/customer/bookings">Back to bookings</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const b = booking as any
  const pickupDate = new Date(booking.pickupDate)
  const hoursUntilPickup =
    (pickupDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
  const canCancelWithin48Hours = hoursUntilPickup < 48
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'
  const canAmend = booking.status === 'pending' || booking.status === 'confirmed'
  const extras = serviceExtrasFromBooking(b)
  const { drivers, helpers } = getBookingDriversAndHelpers(b)
  const stops = Array.isArray(b.stops) ? b.stops : []
  const price = booking.finalPrice ?? booking.estimatedPrice
  const orderLabel = b.orderCode
    ? `#${b.orderCode}`
    : `Booking #${booking._id.slice(-6).toUpperCase()}`

  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{orderLabel}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <Badge variant="outline" className="capitalize">
                {booking.paymentStatus}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/customer/bookings">Back to bookings</Link>
            </Button>
            {canAmend && (
              <Dialog open={amendDialogOpen} onOpenChange={setAmendDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Amend
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Amend booking</DialogTitle>
                    <DialogDescription>
                      Update hours, men, vans, or pickup date/time. Price will be recalculated.
                    </DialogDescription>
                  </DialogHeader>
                  {amendError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{amendError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-4 py-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="1"
                        value={amendData.hours}
                        onChange={(e) =>
                          setAmendData({ ...amendData, hours: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="men">Number of men</Label>
                      <Input
                        id="men"
                        type="number"
                        min="1"
                        value={amendData.men}
                        onChange={(e) =>
                          setAmendData({ ...amendData, men: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vans">Number of vans</Label>
                      <Input
                        id="vans"
                        type="number"
                        min="1"
                        value={amendData.vans}
                        onChange={(e) =>
                          setAmendData({ ...amendData, vans: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime">Pickup time</Label>
                      <Input
                        id="pickupTime"
                        type="text"
                        placeholder="e.g. 10:00 - 11:00 am"
                        value={amendData.pickupTime}
                        onChange={(e) =>
                          setAmendData({ ...amendData, pickupTime: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="pickupDate">Pickup date</Label>
                      <Input
                        id="pickupDate"
                        type="date"
                        value={amendData.pickupDate}
                        onChange={(e) =>
                          setAmendData({ ...amendData, pickupDate: e.target.value })
                        }
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAmendDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAmend} disabled={amendBooking.isLoading}>
                      {amendBooking.isLoading ? 'Updating...' : 'Update booking'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {canCancel && (
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={canCancelWithin48Hours}>
                    Cancel booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel booking</DialogTitle>
                    <DialogDescription>
                      {canCancelWithin48Hours ? (
                        <span className="text-destructive">
                          Cannot cancel within 48 hours of the move date. Contact
                          info@local-van.com
                        </span>
                      ) : (
                        'Are you sure you want to cancel this booking? This cannot be undone.'
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  {!canCancelWithin48Hours && (
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                        Keep booking
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={cancelBooking.isLoading}
                      >
                        {cancelBooking.isLoading ? 'Cancelling...' : 'Yes, cancel'}
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {amendSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Updated</AlertTitle>
            <AlertDescription>{amendSuccess}</AlertDescription>
          </Alert>
        )}

        {canCancelWithin48Hours && canCancel && (
          <p className="text-sm text-muted-foreground">
            Cancellation is not available within 48 hours of the move date.
          </p>
        )}

        <div className="space-y-5">
          <SectionShell
            title="General details"
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Service type" value={serviceLabel(booking.serviceType)} />
              <ReadField
                label="Vehicle / vans"
                value={
                  formatVanCountsLabel(b.vanCounts) !== '—'
                    ? formatVanCountsLabel(b.vanCounts)
                    : vehicleLabel(booking.vehicleType)
                }
              />
              <ReadField label="Drivers" value={String(drivers)} />
              <ReadField label="Helpers" value={String(helpers)} />
              <ReadField label="Dismantle items" value={String(extras.dismantleItems)} />
              <ReadField label="Assembly items" value={String(extras.assemblyItems)} />
              <ReadField label="Packing boxes" value={String(extras.packingBoxes)} />
              <ReadField label="Price" value={formatCurrency(price)} />
              {(b.durationRequired || booking.hours != null) && (
                <ReadField
                  label="Duration"
                  value={formatDurationLabel(b.durationRequired, booking.hours)}
                />
              )}
              {b.miles != null && <ReadField label="Miles" value={b.miles} />}
              <ReadField label="Created" value={formatDate(booking.createdAt)} />
              <ReadField label="Phone" value={booking.contactPhone} />
              <ReadField label="Email" value={booking.contactEmail} />
              <ReadField label="Special instructions" value={booking.specialInstructions} />
            </div>
            {booking.additionalWorkPayment ? (
              <div className="grid gap-4 sm:grid-cols-2 rounded-lg border bg-white p-3">
                <ReadField
                  label="Additional work"
                  value={formatCurrency(booking.additionalWorkPayment)}
                />
                <ReadField
                  label="Additional work notes"
                  value={booking.additionalWorkDescription}
                />
              </div>
            ) : null}
          </SectionShell>

          <SectionShell
            title="Pickup details"
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Address" value={booking.pickupAddress} />
              <ReadField label="City" value={booking.pickupCity} />
              <ReadField label="Postcode" value={booking.pickupZipCode} />
              <ReadField label="Date" value={formatDate(booking.pickupDate)} />
              <ReadField label="Time" value={booking.pickupTime} />
              <ReadField
                label="Access"
                value={formatStairsDisplay(b.collectionStairs)}
              />
            </div>
            <GoogleMapsLink
              address={booking.pickupAddress}
              city={booking.pickupCity}
              zipCode={booking.pickupZipCode}
            />
          </SectionShell>

          <SectionShell
            title="Intermediate stops"
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          >
            {stops.length > 0 ? (
              <div className="space-y-4">
                {stops.map((stop: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-white p-3 space-y-3"
                  >
                    <p className="text-sm font-medium">Stop {index + 1}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReadField label="Address" value={stop.address} />
                      <ReadField label="City" value={stop.city} />
                      <ReadField label="Postcode" value={stop.zipCode} />
                      <ReadField
                        label="Access"
                        value={
                          formatAccessFromAdmin(stop.access, stop.stairsCount) ||
                          stop.accessLabel ||
                          stop.access ||
                          '—'
                        }
                      />
                    </div>
                    <GoogleMapsLink
                      address={stop.address}
                      city={stop.city}
                      zipCode={stop.zipCode}
                      label="Open stop in Google Maps"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No intermediate stops</p>
            )}
          </SectionShell>

          <SectionShell
            title="Drop-off details"
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Address" value={booking.deliveryAddress} />
              <ReadField label="City" value={booking.deliveryCity} />
              <ReadField label="Postcode" value={booking.deliveryZipCode} />
              <ReadField
                label="Access"
                value={formatStairsDisplay(b.deliveryStairs)}
              />
            </div>
            <GoogleMapsLink
              address={booking.deliveryAddress}
              city={booking.deliveryCity}
              zipCode={booking.deliveryZipCode}
            />
          </SectionShell>

          {Array.isArray(booking.items) && booking.items.length > 0 && (
            <SectionShell title="Items to move">
              <div className="space-y-2">
                {booking.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-white p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">Qty: {item.quantity}</Badge>
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          {booking.driver && (
            <SectionShell title="Assigned driver">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadField label="Name" value={booking.driver.name} />
                <ReadField label="Email" value={booking.driver.email} />
                <ReadField label="Phone" value={booking.driver.phone} />
              </div>
            </SectionShell>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default BookingDetails
