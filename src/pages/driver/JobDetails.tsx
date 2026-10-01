import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  Timer,
} from 'lucide-react'
import {
  useDriverJob,
  useStartJob,
  useEndJob,
  useAddJobNote,
  useAddCompletionDetails,
  useDisputeJob,
  useCancelTakenJob,
  useAcceptJobOffer,
  useRejectJobOffer,
} from '@/hooks/useDriver'
import { useAuth } from '@/hooks/useAuth'
import { getOfferForDriver } from '@/utils/driverOffers'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { formatStairsDisplay } from '@/utils/stairsAccess'
import {
  formatBookingPeopleLabel,
  formatBookingVehicleLabel,
  formatDurationLabel,
  getBookingDriversAndHelpers,
  isHelpersRateTier,
  serviceExtrasFromBooking,
} from '@/utils/manualBookingExtras'
import { formatFullAddress } from '@/utils/addressFormat'
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

function getGeolocation(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({})
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

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
  const [jobNote, setJobNote] = useState('')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [actionError, setActionError] = useState('')

  const startJobMutation = useStartJob()
  const endJobMutation = useEndJob()
  const addNoteMutation = useAddJobNote()
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
    setJobNote('')
  }, [id])

  const jobStartedAt = (job as any)?.jobStartedAt
  const jobEndedAt = (job as any)?.jobEndedAt
  const jobIsLive =
    !!job &&
    (job.status === 'job-started' || job.status === 'in-progress') &&
    !!jobStartedAt &&
    !jobEndedAt

  useEffect(() => {
    if (!jobIsLive || !jobStartedAt) {
      setElapsedMs(0)
      return
    }
    const tick = () => {
      setElapsedMs(Date.now() - new Date(jobStartedAt).getTime())
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [jobIsLive, jobStartedAt])

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
    if (!id || !confirm('Start this job now? GPS location will be recorded.')) return
    setActionError('')
    try {
      const coords = await getGeolocation()
      await startJobMutation.mutateAsync({
        id,
        pickupPhotos: pickupPhotos.slice(0, 3),
        ...coords,
      })
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to start job')
    }
  }

  const handleEndJob = async () => {
    if (!id || !confirm('Record end of job with current GPS?')) return
    setActionError('')
    try {
      const coords = await getGeolocation()
      await endJobMutation.mutateAsync({ id, ...coords })
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to end job')
    }
  }

  const handleFinishJob = async () => {
    if (!id || !confirm('Mark this job as finished?')) return
    setActionError('')
    try {
      const coords = await getGeolocation()
      await addCompletionMutation.mutateAsync({
        id,
        data: {
          notes: completionNotes || undefined,
          pickupPhotos: pickupPhotos.slice(0, 3),
          dropoffPhotos: dropoffPhotos.slice(0, 3),
          ...coords,
        },
      })
      setCompletionNotes('')
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to finish job')
    }
  }

  const handleAddNote = async () => {
    if (!id || !jobNote.trim()) return
    setActionError('')
    try {
      await addNoteMutation.mutateAsync({ id, text: jobNote.trim() })
      setJobNote('')
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to add note')
    }
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

        {jobIsLive && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-4">
              <Timer className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Live job timer</p>
                <p className="text-2xl font-semibold tabular-nums">{formatElapsed(elapsedMs)}</p>
                <p className="text-xs text-muted-foreground">
                  Started {formatDateTime(jobStartedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {actionError}
          </div>
        )}

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
              <ReadField label="Vehicle / vans" value={formatBookingVehicleLabel(j)} />
              <ReadField label="Crew" value={formatBookingPeopleLabel(j)} />
              <ReadField label="Drivers" value={String(driversCount)} />
              <ReadField label="Additional helpers" value={String(helpersCount)} />
              {(j.helpersRateTier != null || isHelpersRateTier(j.manRequired)) && (
                <ReadField
                  label="Helpers rate tier"
                  value={String(j.helpersRateTier ?? j.manRequired)}
                />
              )}
              <ReadField label="Dismantle items" value={String(extras.dismantleItems)} />
              <ReadField label="Assembly items" value={String(extras.assemblyItems)} />
              <ReadField label="Packing boxes" value={String(extras.packingBoxes)} />
              <ReadField
                label="Price"
                value={formatCurrency(offeredPrice)}
              />
              <ReadField
                label="Hours booked"
                value={formatDurationLabel(j.durationRequired, j.hours)}
              />
              {j.miles != null && <ReadField label="Miles" value={j.miles} />}
              {(j.jobStartedAt || j.jobEndedAt) && (
                <>
                  <ReadField label="Started" value={formatDateTime(j.jobStartedAt)} />
                  <ReadField
                    label="Start GPS"
                    value={
                      j.jobStartLat != null && j.jobStartLng != null
                        ? `${j.jobStartLat}, ${j.jobStartLng}`
                        : undefined
                    }
                  />
                  <ReadField label="Ended" value={formatDateTime(j.jobEndedAt)} />
                  <ReadField
                    label="End GPS"
                    value={
                      j.jobEndLat != null && j.jobEndLng != null
                        ? `${j.jobEndLat}, ${j.jobEndLng}`
                        : undefined
                    }
                  />
                </>
              )}
              <ReadField label="Special instructions" value={j.specialInstructions} />
            </div>
          </SectionShell>

          <SectionShell title="Pickup details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField
                label="Street"
                value={j.pickupStreet || job.pickupAddress}
              />
              <ReadField label="City" value={job.pickupCity} />
              <ReadField
                label="Full address"
                value={formatFullAddress({
                  houseName: j.pickupHouseName,
                  houseNumber: j.pickupHouseNumber,
                  address: j.pickupStreet || job.pickupAddress,
                  city: job.pickupCity,
                  zipCode: job.pickupZipCode,
                })}
              />
              <ReadField label="Postcode" value={job.pickupZipCode} />
              <ReadField label="Date" value={formatDate(job.pickupDate)} />
              <ReadField label="Time" value={job.pickupTime} />
              <ReadField label="Access" value={formatStairsDisplay(j.collectionStairs)} />
            </div>
            <div className="pt-2">
              <GoogleMapsLink
                address={j.pickupStreet || job.pickupAddress}
                city={job.pickupCity}
                zipCode={job.pickupZipCode}
              />
            </div>
          </SectionShell>

          {stops.length > 0 && (
            <SectionShell title="Intermediate stops" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
              <div className="space-y-3">
                {stops.map((stop: any, index: number) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-2 rounded-lg border p-3">
                    <ReadField label={`Stop ${index + 1} address`} value={stop.address} />
                    <ReadField label="City" value={stop.city} />
                    <ReadField label="Postcode" value={stop.zipCode} />
                    <ReadField
                      label="Access"
                      value={
                        stop.accessLabel
                          ? formatStairsDisplay(stop.accessLabel)
                          : stop.access || '—'
                      }
                    />
                  </div>
                ))}
              </div>
            </SectionShell>
          )}

          <SectionShell title="Drop-off details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField
                label="Street"
                value={j.deliveryStreet || job.deliveryAddress}
              />
              <ReadField label="City" value={job.deliveryCity} />
              <ReadField
                label="Full address"
                value={formatFullAddress({
                  houseName: j.deliveryHouseName,
                  houseNumber: j.deliveryHouseNumber,
                  address: j.deliveryStreet || job.deliveryAddress,
                  city: job.deliveryCity,
                  zipCode: job.deliveryZipCode,
                })}
              />
              <ReadField label="Postcode" value={job.deliveryZipCode} />
              <ReadField label="Access" value={formatStairsDisplay(j.deliveryStairs)} />
            </div>
            <div className="pt-2">
              <GoogleMapsLink
                address={j.deliveryStreet || job.deliveryAddress}
                city={job.deliveryCity}
                zipCode={job.deliveryZipCode}
              />
            </div>
          </SectionShell>

          {((j.pickupPhotos && j.pickupPhotos.length > 0) ||
            (j.dropoffPhotos && j.dropoffPhotos.length > 0) ||
            (job.completionPictures && job.completionPictures.length > 0)) && (
            <SectionShell title="Job photos">
              <div className="grid gap-4 sm:grid-cols-2">
                {j.pickupPhotos?.length > 0 && (
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
                {(j.dropoffPhotos?.length > 0 || (job.completionPictures?.length || 0) > 0) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Drop-off</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(j.dropoffPhotos?.length ? j.dropoffPhotos : job.completionPictures || []).map(
                        (pic: string, index: number) => (
                          <img
                            key={`dropoff-${index}`}
                            src={pic}
                            alt={`Drop-off ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SectionShell>
          )}

          {(j.driverNotes || (j.driverNoteEntries && j.driverNoteEntries.length > 0)) && (
            <SectionShell title="Driver notes">
              {j.driverNoteEntries?.length > 0 ? (
                <div className="space-y-2">
                  {j.driverNoteEntries.map((note: any, idx: number) => (
                    <div key={idx} className="rounded-lg border bg-background p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">
                        {note.createdAt ? formatDateTime(note.createdAt) : 'Note'}
                      </p>
                      <p>{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{j.driverNotes}</p>
              )}
            </SectionShell>
          )}

          {job.isDisputed && (
            <SectionShell title="Dispute">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <p>{job.disputeReason || 'This job is disputed'}</p>
              </div>
            </SectionShell>
          )}

          {isOfferExpired && canRespondToOffer === false && offer && (
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
                          <Label htmlFor="completionNotes">Completion notes (optional)</Label>
                          <Textarea
                            id="completionNotes"
                            className="mt-1.5"
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Any notes about finishing the job..."
                          />
                        </div>
                        <div className="space-y-2 rounded-lg border p-3">
                          <Label htmlFor="jobNote">Add a job note</Label>
                          <Input
                            id="jobNote"
                            value={jobNote}
                            onChange={(e) => setJobNote(e.target.value)}
                            placeholder="Quick note while on the job..."
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddNote}
                            disabled={!jobNote.trim() || addNoteMutation.isLoading}
                          >
                            {addNoteMutation.isLoading ? 'Saving...' : 'Save note'}
                          </Button>
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
                      {jobIsStarted && !jobEndedAt && (
                        <Button
                          variant="secondary"
                          onClick={handleEndJob}
                          disabled={endJobMutation.isLoading || cancelMutation.isLoading}
                          className="flex-1"
                        >
                          {endJobMutation.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Ending...
                            </>
                          ) : (
                            'End Job'
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
