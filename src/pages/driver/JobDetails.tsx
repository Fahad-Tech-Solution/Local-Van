import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
} from 'lucide-react'
import {
  useDriverJob,
  useStartJob,
  useAddCompletionDetails,
  useDisputeJob,
  useCancelTakenJob,
  useAcceptJobOffer,
  useRejectJobOffer,
} from '@/hooks/useDriver'
import { useAuth } from '@/hooks/useAuth'
import { getOfferForDriver } from '@/utils/driverOffers'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { formatStairsDisplay, formatAccessFromAdmin } from '@/utils/stairsAccess'
import {
  formatVanCountsLabel,
  formatDurationLabel,
  getBookingDriversAndHelpers,
  serviceExtrasFromBooking,
} from '@/utils/manualBookingExtras'
import { GoogleMapsLink } from '@/components/GoogleMapsLink'
import { ReadField, SectionShell } from '@/components/booking/SectionShell'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const serviceLabel = (value?: string) => {
  if (value === 'long-distance') return 'Long Distance'
  if (value === 'interstate') return 'Interstate'
  if (value === 'local') return 'Local'
  return value || '—'
}

const vehicleLabel = (value?: string) =>
  value?.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || '—'

const JobDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: job, isLoading } = useDriverJob(id || '')
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [pickupPhotos, setPickupPhotos] = useState<string[]>([])
  const [dropoffPhotos, setDropoffPhotos] = useState<string[]>([])
  const [disputeReason, setDisputeReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [photosHydrated, setPhotosHydrated] = useState(false)

  const startJobMutation = useStartJob()
  const addCompletionMutation = useAddCompletionDetails()
  const disputeMutation = useDisputeJob()
  const cancelMutation = useCancelTakenJob()
  const acceptMutation = useAcceptJobOffer()
  const rejectMutation = useRejectJobOffer()

  useEffect(() => {
    setPhotosHydrated(false)
    setPickupPhotos([])
    setDropoffPhotos([])
    setCompletionNotes('')
  }, [id])

  const handleAcceptOffer = async () => {
    if (!id || !confirm('Are you sure you want to accept this job offer?')) return
    await acceptMutation.mutateAsync(id)
  }

  const handleRejectOffer = async () => {
    if (!id || !confirm('Are you sure you want to reject this job offer?')) return
    await rejectMutation.mutateAsync(id)
    navigate('/driver/available-jobs')
  }

  const handleStartJob = async () => {
    if (!id || !confirm('Start this job now?')) return
    await startJobMutation.mutateAsync({
      id,
      pickupPhotos: pickupPhotos.slice(0, 3),
    })
  }

  const handleFinishJob = async () => {
    if (!id || !confirm('Mark this job as finished?')) return
    await addCompletionMutation.mutateAsync({
      id,
      data: {
        notes: completionNotes || undefined,
        pickupPhotos: pickupPhotos.slice(0, 3),
        dropoffPhotos: dropoffPhotos.slice(0, 3),
      },
    })
    setCompletionNotes('')
  }

  const handleDispute = async () => {
    if (!id || !disputeReason) return
    await disputeMutation.mutateAsync({ id, reason: disputeReason })
    setIsDisputeDialogOpen(false)
    setDisputeReason('')
  }

  const handleCancelJob = async () => {
    if (!id) return
    await cancelMutation.mutateAsync({
      id,
      reason: cancelReason.trim() || undefined,
    })
    setIsCancelDialogOpen(false)
    setCancelReason('')
    navigate('/driver/jobs')
  }

  useEffect(() => {
    if (!job || photosHydrated) return
    const j = job as any
    const existingPickup = Array.isArray(j.pickupPhotos) ? j.pickupPhotos : []
    const existingDropoff = Array.isArray(j.dropoffPhotos)
      ? j.dropoffPhotos
      : Array.isArray(job.completionPictures)
        ? job.completionPictures
        : []
    setPickupPhotos(existingPickup.slice(0, 3))
    setDropoffPhotos(existingDropoff.slice(0, 3))
    setPhotosHydrated(true)
  }, [job, photosHydrated])

  if (isLoading) {
    return (
      <DashboardLayout role="driver">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!job) {
    return (
      <DashboardLayout role="driver">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found</p>
          <Button onClick={() => navigate('/driver/jobs')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const offer = getOfferForDriver(job, user)
  const isOfferExpired =
    !!job.offerExpiresAt && new Date(job.offerExpiresAt) <= new Date()
  const hasAssignedDriver = !!(job as any).driver
  const canRespondToOffer =
    ['pending', 'offered'].includes(job.status) &&
    !hasAssignedDriver &&
    !isOfferExpired
  const canStartJob = job.status === 'confirmed'
  const jobIsStarted = job.status === 'job-started' || job.status === 'in-progress'
  const canCancelJob =
    hasAssignedDriver &&
    ['confirmed', 'job-started', 'in-progress'].includes(job.status)
  const canDispute =
    ['confirmed', 'job-started', 'in-progress', 'completed'].includes(job.status) &&
    !job.isDisputed
  const offeredPrice = offer?.offeredPrice ?? job.finalPrice ?? job.estimatedPrice
  const j = job as any
  const extras = serviceExtrasFromBooking(j)
  const { drivers: driversCount, helpers: helpersCount } =
    getBookingDriversAndHelpers(j)
  const stops = Array.isArray(j.stops) ? j.stops : []

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Job Details</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {job.orderCode && <Badge variant="outline">#{job.orderCode}</Badge>}
              <StatusBadge status={job.status} />
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/driver/jobs')}>
            Back to Jobs
          </Button>
        </div>

        <div className="space-y-5">
          <SectionShell title="General details" icon={<Package className="h-4 w-4 text-muted-foreground" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {!canRespondToOffer && (
                <>
                  <ReadField
                    label="Customer"
                    value={typeof job.customer === 'object' ? job.customer.name : 'Unknown'}
                  />
                  <ReadField
                    label="Email"
                    value={
                      typeof job.customer === 'object' ? job.customer.email : job.contactEmail
                    }
                  />
                  <ReadField label="Phone" value={job.contactPhone} />
                </>
              )}
              <ReadField label="Service type" value={serviceLabel(j.serviceType)} />
              <ReadField
                label="Vehicle / vans"
                value={
                  formatVanCountsLabel(j.vanCounts) !== '—'
                    ? formatVanCountsLabel(j.vanCounts)
                    : vehicleLabel(j.vehicleType)
                }
              />
              <ReadField
                label="Drivers"
                value={String(driversCount)}
              />
              <ReadField
                label="Helpers"
                value={String(helpersCount)}
              />
              <ReadField
                label="Dismantle items"
                value={String(extras.dismantleItems)}
              />
              <ReadField
                label="Assembly items"
                value={String(extras.assemblyItems)}
              />
              <ReadField
                label="Packing boxes"
                value={String(extras.packingBoxes)}
              />
              <ReadField
                label={canRespondToOffer ? 'Offered pay' : 'Price'}
                value={formatCurrency(offeredPrice)}
              />
              {(j.durationRequired || j.hours != null) && (
                <ReadField
                  label="Duration"
                  value={formatDurationLabel(j.durationRequired, j.hours)}
                />
              )}
              {j.miles != null && <ReadField label="Miles" value={j.miles} />}
              {job.offerExpiresAt && canRespondToOffer && (
                <ReadField
                  label="Offer expires"
                  value={formatDateTime(job.offerExpiresAt)}
                />
              )}
              <ReadField label="Special instructions" value={j.specialInstructions} />
            </div>
            {Array.isArray(j.items) && j.items.length > 0 && (
              <div className="rounded-lg border bg-white p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Listed items</p>
                <ul className="text-sm space-y-1">
                  {j.items.map((item: any, index: number) => (
                    <li key={index}>
                      {item.quantity ? `${item.quantity}× ` : ''}
                      {item.name || 'Item'}
                      {item.description ? ` — ${item.description}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!canRespondToOffer && j.additionalWorkPayment ? (
              <div className="grid gap-4 sm:grid-cols-2 rounded-lg border bg-white p-3">
                <ReadField
                  label="Additional work"
                  value={formatCurrency(j.additionalWorkPayment)}
                />
                <ReadField
                  label="Additional work notes"
                  value={j.additionalWorkDescription}
                />
              </div>
            ) : null}
            {canRespondToOffer && (
              <p className="text-xs text-muted-foreground">
                Showing job logistics only. Customer contact details and booking list price are
                hidden until you accept.
              </p>
            )}
          </SectionShell>

          <SectionShell title="Pickup details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Address" value={job.pickupAddress} />
              <ReadField label="City" value={job.pickupCity} />
              <ReadField label="Postcode" value={job.pickupZipCode} />
              <ReadField label="Date" value={formatDate(job.pickupDate)} />
              <ReadField label="Time" value={job.pickupTime} />
              <ReadField label="Access" value={formatStairsDisplay(j.collectionStairs)} />
            </div>
            <GoogleMapsLink
              address={job.pickupAddress}
              city={job.pickupCity}
              zipCode={job.pickupZipCode}
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
              <ReadField label="Address" value={job.deliveryAddress} />
              <ReadField label="City" value={job.deliveryCity} />
              <ReadField label="Postcode" value={job.deliveryZipCode} />
              <ReadField label="Access" value={formatStairsDisplay(j.deliveryStairs)} />
            </div>
            <GoogleMapsLink
              address={job.deliveryAddress}
              city={job.deliveryCity}
              zipCode={job.deliveryZipCode}
            />
          </SectionShell>

          {(Array.isArray(j.pickupPhotos) && j.pickupPhotos.length > 0) ||
          (Array.isArray(j.dropoffPhotos) && j.dropoffPhotos.length > 0) ||
          (job.completionPictures && job.completionPictures.length > 0) ? (
            <SectionShell title="Job photos">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.isArray(j.pickupPhotos) && j.pickupPhotos.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Pickup</p>
                    <div className="grid grid-cols-3 gap-2">
                      {j.pickupPhotos.map((pic: string, index: number) => (
                        <img
                          key={`pickup-${index}`}
                          src={pic}
                          alt={`Pickup ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {((Array.isArray(j.dropoffPhotos) && j.dropoffPhotos.length > 0) ||
                  (job.completionPictures && job.completionPictures.length > 0)) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Drop-off</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(j.dropoffPhotos?.length
                        ? j.dropoffPhotos
                        : job.completionPictures || []
                      ).map((pic: string, index: number) => (
                        <img
                          key={`dropoff-${index}`}
                          src={pic}
                          alt={`Drop-off ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionShell>
          ) : null}

          {job.driverNotes && (
            <SectionShell title="Driver notes">
              <p className="text-sm">{job.driverNotes}</p>
            </SectionShell>
          )}

          {job.isDisputed && (
            <SectionShell title="Dispute">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reason: {job.disputeReason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {job.disputeResolved ? 'Resolved' : 'Pending resolution'}
                  </p>
                </div>
              </div>
            </SectionShell>
          )}

          {isOfferExpired && ['pending', 'offered'].includes(job.status) && (
            <SectionShell title="Offer expired">
              <p className="text-sm text-muted-foreground">
                This job offer has expired and can no longer be accepted or rejected.
              </p>
            </SectionShell>
          )}

          {(canRespondToOffer || canStartJob || jobIsStarted || canDispute || canCancelJob) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {canRespondToOffer && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleAcceptOffer}
                      disabled={acceptMutation.isLoading || rejectMutation.isLoading}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Offer ({formatCurrency(offeredPrice)})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRejectOffer}
                      disabled={acceptMutation.isLoading || rejectMutation.isLoading}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {(canStartJob || jobIsStarted) && (
                  <div className="space-y-4">
                    <MultiImageUpload
                      label="Pickup photos (optional)"
                      description="Up to 3 photos from the pickup location"
                      values={pickupPhotos}
                      onChange={setPickupPhotos}
                      max={3}
                      folder="jobs/pickup"
                      disabled={job.status === 'completed' || job.isDisputed}
                    />

                    {jobIsStarted && (
                      <>
                        <MultiImageUpload
                          label="Drop-off photos (optional)"
                          description="Up to 3 photos from the drop-off location"
                          values={dropoffPhotos}
                          onChange={setDropoffPhotos}
                          max={3}
                          folder="jobs/dropoff"
                          disabled={job.status === 'completed' || job.isDisputed}
                        />
                        <div>
                          <Label htmlFor="completionNotes">Notes (optional)</Label>
                          <Textarea
                            id="completionNotes"
                            className="mt-1.5"
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Any notes about the job..."
                          />
                        </div>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {canStartJob && (
                        <Button
                          onClick={handleStartJob}
                          disabled={startJobMutation.isLoading || cancelMutation.isLoading}
                          className="flex-1"
                        >
                          {startJobMutation.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            'Start the job'
                          )}
                        </Button>
                      )}
                      {jobIsStarted && (
                        <Button
                          onClick={handleFinishJob}
                          disabled={addCompletionMutation.isLoading || cancelMutation.isLoading}
                          className="flex-1"
                        >
                          {addCompletionMutation.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Finishing...
                            </>
                          ) : (
                            'Finish the job'
                          )}
                        </Button>
                      )}
                      {canCancelJob && (
                        <Button
                          variant="outline"
                          onClick={() => setIsCancelDialogOpen(true)}
                          disabled={cancelMutation.isLoading}
                          className="flex-1 sm:flex-none"
                        >
                          Cancel job
                        </Button>
                      )}
                      {canDispute && (
                        <Button
                          variant="destructive"
                          onClick={() => setIsDisputeDialogOpen(true)}
                          className="flex-1 sm:flex-none"
                        >
                          Dispute
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {!canRespondToOffer &&
                  !canStartJob &&
                  !jobIsStarted &&
                  (canCancelJob || canDispute) && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {canCancelJob && (
                        <Button
                          variant="outline"
                          onClick={() => setIsCancelDialogOpen(true)}
                          disabled={cancelMutation.isLoading}
                        >
                          Cancel job
                        </Button>
                      )}
                      {canDispute && (
                        <Button
                          variant="destructive"
                          onClick={() => setIsDisputeDialogOpen(true)}
                        >
                          Dispute
                        </Button>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel this job?</DialogTitle>
              <DialogDescription>
                The job will be released and become available for admin to reassign. Admin will be
                notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling this job?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Keep job
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelJob}
                disabled={cancelMutation.isLoading}
              >
                {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dispute Job</DialogTitle>
              <DialogDescription>Provide a reason for disputing this job</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you are disputing this job..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDisputeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDispute}
                disabled={!disputeReason || disputeMutation.isLoading}
              >
                {disputeMutation.isLoading ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default JobDetailsPage
