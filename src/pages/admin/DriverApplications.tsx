import { useState, type ReactNode } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, Eye, ExternalLink, FileText } from 'lucide-react'
import {
  useAdminUsers,
  useApproveDriverApplication,
  useRejectDriverApplication,
} from '@/hooks/useAdmin'
import { formatDate } from '@/utils/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

const categoryLabel = (value?: string) => {
  if (!value) return '—'
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const DetailRow = ({
  label,
  value,
}: {
  label: string
  value?: ReactNode
}) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2 text-sm items-start">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium break-words">{value || '—'}</span>
  </div>
)

const DocRow = ({ label, url }: { label: string; url?: string }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2 text-sm items-center">
    <span className="text-muted-foreground">{label}</span>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-primary font-medium underline underline-offset-2 hover:text-primary/80 w-fit"
      >
        <FileText className="h-3.5 w-3.5 shrink-0" />
        View document
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    ) : (
      <span className="text-muted-foreground italic">Not provided</span>
    )}
  </div>
)

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="rounded-lg border bg-muted/20 p-4 space-y-1">
    <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2">
      {title}
    </h4>
    <div className="divide-y">{children}</div>
  </section>
)

const DriverApplicationsPage = () => {
  const [page] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [message, setMessage] = useState('')

  const { data, isLoading, refetch } = useAdminUsers({
    page,
    limit: 10,
    role: 'driver',
    applicationStatus: 'pending',
  })

  const approveMutation = useApproveDriverApplication()
  const rejectMutation = useRejectDriverApplication()

  const applications = data?.users || []

  const handleApprove = async (id: string) => {
    try {
      const result = await approveMutation.mutateAsync(id)
      setMessage(result.message)
      setSelected(null)
      refetch()
      setTimeout(() => setMessage(''), 4000)
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to approve')
    }
  }

  const handleReject = async () => {
    if (!selected) return
    try {
      const result = await rejectMutation.mutateAsync({ id: selected._id, note: rejectNote })
      setMessage(result.message)
      setIsRejectOpen(false)
      setSelected(null)
      setRejectNote('')
      refetch()
      setTimeout(() => setMessage(''), 4000)
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to reject')
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Applications</h2>
          <p className="text-muted-foreground">Review and approve or decline driver interest forms</p>
        </div>

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pending applications</CardTitle>
            <CardDescription>{data?.pagination?.total || 0} awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : applications.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No pending applications</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div
                    key={app._id}
                    className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{app.name}</h3>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{app.email}</p>
                      {app.applicationSubmittedAt && (
                        <p className="text-xs text-muted-foreground">
                          Submitted {formatDate(app.applicationSubmittedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setSelected(app)}>
                        <Eye className="h-4 w-4 mr-1" /> Review
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(app._id)} disabled={approveMutation.isLoading}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelected(app)
                          setIsRejectOpen(true)
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected && !isRejectOpen} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selected?.name}</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">{selected?.email}</span>
              {selected?.applicationSubmittedAt && (
                <span className="block text-xs">
                  Submitted {formatDate(selected.applicationSubmittedAt)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <Section title="Contact">
                <DetailRow label="Phone" value={selected.phone} />
                <DetailRow label="Username" value={selected.username} />
                <DetailRow label="Business" value={selected.businessName} />
                <DetailRow label="Address" value={selected.address} />
              </Section>

              <Section title="Documents">
                <DocRow label="Driving licence" url={selected.drivingLicence} />
                <DocRow label="GIT insurance" url={selected.goodsInTransitInsurance} />
                <DocRow label="Public liability" url={selected.publicLiability} />
                <DocRow label="Proof of address" url={selected.proofOfAddress} />
              </Section>

              <Section title="Vehicle">
                <DetailRow
                  label="Make / Model"
                  value={[selected.vehicleMake, selected.vehicleModel].filter(Boolean).join(' ') || undefined}
                />
                <DetailRow label="Registration" value={selected.vehicleRegistration} />
                <DetailRow label="Category" value={categoryLabel(selected.vehicleCategory)} />
                <DetailRow label="Type" value={selected.vehicleType} />
                <DetailRow label="Fuel" value={selected.vehicleFuelType} />
                <DetailRow label="Seats" value={selected.vehicleSeats} />
                <DetailRow label="Base location" value={selected.vehicleBaseLocation} />
                <DetailRow
                  label="Tail lift"
                  value={
                    selected.vehicleTailLift === true
                      ? 'Yes'
                      : selected.vehicleTailLift === false
                        ? 'No'
                        : undefined
                  }
                />
                <DetailRow
                  label="Trailer"
                  value={
                    selected.vehicleTrailer === true
                      ? 'Yes'
                      : selected.vehicleTrailer === false
                        ? 'No'
                        : undefined
                  }
                />
                <DocRow
                  label="Reg. document"
                  url={selected.vehicleRegistrationDocument}
                />
                {selected.vehicleRegistrationDocumentType && (
                  <DetailRow
                    label="Doc type"
                    value={String(selected.vehicleRegistrationDocumentType).toUpperCase()}
                  />
                )}
                <DocRow label="Vehicle photo" url={selected.vehiclePhoto} />
              </Section>

              <Section title="Bank details">
                <DetailRow label="Account name" value={selected.bankDetails?.accountName} />
                <DetailRow label="Bank name" value={selected.bankDetails?.bankName} />
                <DetailRow label="Sort code" value={selected.bankDetails?.sortCode} />
                <DetailRow label="Account number" value={selected.bankDetails?.accountNumber} />
                <DocRow label="Bank statement" url={selected.bankDetails?.bankStatement} />
              </Section>

              <Section title="Introduction">
                  {selected.introductionVideoUrl ? (
                    <div className="pt-1 space-y-3">
                      {selected.introductionVideoUrl.includes('cloudinary') ||
                      selected.introductionVideoUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                        <video
                          src={selected.introductionVideoUrl}
                          controls
                          className="max-h-52 w-full rounded-md border bg-black"
                        />
                      ) : null}
                      <a
                        href={selected.introductionVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary font-medium underline underline-offset-2 hover:text-primary/80"
                      >
                        Open video link
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <DetailRow
                      label="Video"
                      value={
                        <span className="italic font-normal text-muted-foreground">Not provided</span>
                      }
                    />
                  )}
                </Section>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsRejectOpen(true)}
              disabled={!selected}
            >
              Decline
            </Button>
            <Button onClick={() => selected && handleApprove(selected._id)} disabled={approveMutation.isLoading}>
              {approveMutation.isLoading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline application</DialogTitle>
            <DialogDescription>
              The driver will receive an email. You can include an optional note.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="rejectNote">Note (optional)</Label>
            <Textarea id="rejectNote" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isLoading}>
              Decline & notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default DriverApplicationsPage
