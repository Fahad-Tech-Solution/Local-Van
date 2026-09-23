import { useState } from 'react'
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
} from 'lucide-react'
import {
  useDriverJob,
  useUpdateJobStatus,
  useAddCompletionDetails,
  useDisputeJob,
  useAcceptJobOffer,
  useRejectJobOffer,
} from '@/hooks/useDriver'
import { useAuth } from '@/hooks/useAuth'
import { getOfferForDriver } from '@/utils/driverOffers'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { formatStairsDisplay, formatAccessFromAdmin } from '@/utils/stairsAccess'
import {
  formatServiceExtrasLabel,
  formatVanCountsLabel,
} from '@/utils/manualBookingExtras'
import { GoogleMapsLink } from '@/components/GoogleMapsLink'
import { ReadField, SectionShell } from '@/components/booking/SectionShell'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const serviceLabel = (value?: string) => {
  if (value === 'long-distance') return 'Long Distance'
  if (value === 'interstate') return 'Interstate'
  if (value === 'local') return 'Local'
  return value || '—'
}

const vehicleLabel = (value?: string) =>
  value?.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || '—'

const formatPeopleSplit = (drivers?: number, helpers?: number, men?: number) => {
  if (drivers != null || helpers != null) {
    const d = Number(drivers) || 0
    const h = Number(helpers) || 0
    return `${d} driver${d === 1 ? '' : 's'}${h > 0 ? ` + ${h} helper${h === 1 ? '' : 's'}` : ''} (${d + h} total)`
  }
  if (!men || men < 1) return '—'
  return men === 1 ? '1 person' : `${men} people`
}

const JobDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: job, isLoading } = useDriverJob(id || '')
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [completionPictures, setCompletionPictures] = useState<string[]>([])
  const [disputeReason, setDisputeReason] = useState('')

  const updateStatusMutation = useUpdateJobStatus()
  const addCompletionMutation = useAddCompletionDetails()
  const disputeMutation = useDisputeJob()
  const acceptMutation = useAcceptJobOffer()
  const rejectMutation = useRejectJobOffer()

  const handleAcceptOffer = async () => {
    if (!id || !confirm('Are you sure you want to accept this job offer?')) return
    await acceptMutation.mutateAsync(id)
  }

  const handleRejectOffer = async () => {
    if (!id || !confirm('Are you sure you want to reject this job offer?')) return
    await rejectMutation.mutateAsync(id)
    navigate('/driver/available-jobs')
  }

  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return
    await updateStatusMutation.mutateAsync({ id, status: newStatus })
    setIsStatusDialogOpen(false)
    setNewStatus('')
  }

  const handleComplete = async () => {
    if (!id) return
    await addCompletionMutation.mutateAsync({
      id,
      data: {
        notes: completionNotes,
        pictures: completionPictures,
      },
    })
    setIsCompleteDialogOpen(false)
    setCompletionNotes('')
    setCompletionPictures([])
  }

  const handleDispute = async () => {
    if (!id || !disputeReason) return
    await disputeMutation.mutateAsync({ id, reason: disputeReason })
    setIsDisputeDialogOpen(false)
    setDisputeReason('')
  }

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
  const canUpdateStatus = ['confirmed', 'in-progress'].includes(job.status)
  const canComplete = ['confirmed', 'in-progress'].includes(job.status)
  const canDispute =
    ['confirmed', 'in-progress', 'completed'].includes(job.status) && !job.isDisputed
  const offeredPrice = offer?.offeredPrice ?? job.finalPrice ?? job.estimatedPrice
  const j = job as any

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
                label="People"
                value={formatPeopleSplit(j.drivers, j.helpers, j.men)}
              />
              <ReadField label="Extras" value={formatServiceExtrasLabel(j.serviceExtras)} />
              <ReadField
                label={canRespondToOffer ? 'Offered pay' : 'Price'}
                value={formatCurrency(offeredPrice)}
              />
              {j.durationRequired && (
                <ReadField label="Duration" value={j.durationRequired} />
              )}
              {j.miles != null && <ReadField label="Miles" value={j.miles} />}
              {job.offerExpiresAt && (
                <ReadField
                  label="Offer expires"
                  value={formatDateTime(job.offerExpiresAt)}
                />
              )}
              <ReadField label="Special instructions" value={j.specialInstructions} />
            </div>
            {j.additionalWorkPayment ? (
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
            {canRespondToOffer && offer?.offeredPrice != null && (
              <p className="text-xs text-muted-foreground">
                Admin offer (percentage of booking) — not customer list price
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

          {Array.isArray(j.stops) && j.stops.length > 0 && (
            <SectionShell
              title="Intermediate stops"
              icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            >
              <div className="space-y-4">
                {j.stops.map((stop: any, index: number) => (
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
            </SectionShell>
          )}

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

          {job.completionPictures && job.completionPictures.length > 0 && (
            <SectionShell title="Completion pictures">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {job.completionPictures.map((pic: string, index: number) => (
                  <img
                    key={index}
                    src={pic}
                    alt={`Completion ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </SectionShell>
          )}

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

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {canRespondToOffer && (
                <>
                  <Button
                    onClick={handleAcceptOffer}
                    disabled={acceptMutation.isLoading || rejectMutation.isLoading}
                    className="flex-1 min-w-[140px]"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Offer ({formatCurrency(offeredPrice)})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRejectOffer}
                    disabled={acceptMutation.isLoading || rejectMutation.isLoading}
                    className="flex-1 min-w-[140px]"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {canUpdateStatus && (
                <Button onClick={() => setIsStatusDialogOpen(true)}>Update Status</Button>
              )}
              {canComplete && (
                <Button variant="outline" onClick={() => setIsCompleteDialogOpen(true)}>
                  Complete Job
                </Button>
              )}
              {canDispute && (
                <Button variant="destructive" onClick={() => setIsDisputeDialogOpen(true)}>
                  Dispute Job
                </Button>
              )}
              {!canRespondToOffer && !canUpdateStatus && !canComplete && !canDispute && (
                <p className="text-sm text-muted-foreground">No actions available for this job.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Job Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateStatusMutation.isLoading}
              >
                {updateStatusMutation.isLoading ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Job</DialogTitle>
              <DialogDescription>Add completion details and notes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add any notes about the job completion..."
                />
              </div>
              <div>
                <Label>Pictures (URLs, comma-separated)</Label>
                <Input
                  value={completionPictures.join(', ')}
                  onChange={(e) =>
                    setCompletionPictures(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleComplete} disabled={addCompletionMutation.isLoading}>
                {addCompletionMutation.isLoading ? 'Completing...' : 'Complete Job'}
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
