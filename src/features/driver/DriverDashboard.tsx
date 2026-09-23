import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Truck,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  Briefcase,
  MapPin,
  Calendar,
  PoundSterling,
  XCircle,
} from 'lucide-react'
import { useDriverStats, useDriverJobs } from '@/hooks/useDriver'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { driverApi } from '@/api/driver'
import { useAuth } from '@/hooks/useAuth'
import { getOfferForDriver } from '@/utils/driverOffers'
import { formatCurrency, formatCurrencyWhole, formatDate } from '@/utils/format'
import { DriverJobCard } from '@/components/driver/DriverJobCard'

const DriverDashboard = () => {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDriverStats()
  const { data: completedJobsData, isLoading: isCompletedLoading } = useDriverJobs({
    status: 'completed',
    page: 1,
    limit: 5,
  })

  const queryClient = useQueryClient()

  const { data: availableJobsData, isLoading: isAvailableLoading } = useQuery(
    'availableJobsDashboard',
    driverApi.getAvailableJobs,
    {
      refetchInterval: 30000,
    }
  )

  const acceptMutation = useMutation(
    (id: string) => driverApi.acceptJobOffer(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('availableJobsDashboard')
        queryClient.invalidateQueries('driverJobs')
        queryClient.invalidateQueries('driverStats')
      },
    }
  )

  const rejectMutation = useMutation(
    (id: string) => driverApi.rejectJobOffer(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('availableJobsDashboard')
      },
    }
  )

  const handleAccept = async (id: string) => {
    if (confirm('Are you sure you want to accept this job offer?')) {
      await acceptMutation.mutateAsync(id)
    }
  }

  const handleReject = async (id: string) => {
    if (confirm('Are you sure you want to reject this job offer?')) {
      await rejectMutation.mutateAsync(id)
    }
  }

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your jobs and vehicle information.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-sky-100 bg-sky-50/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Job Offers</CardTitle>
                  <Briefcase className="h-4 w-4 text-sky-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-sky-800">
                    {stats?.offeredJobs ?? availableJobsData?.bookings?.length ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting your response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Confirmed / in progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.completedJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Total completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <PoundSterling className="h-4 w-4 text-emerald-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrencyWhole(stats?.totalEarnings || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">From completed jobs</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions | New Job Offers (swapped with Job Status) */}
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start h-11">
                    <Link to="/driver/jobs">
                      <FileText className="mr-2 h-4 w-4" />
                      View My Jobs
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-11">
                    <Link to="/driver/available-jobs">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Available Jobs
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-11">
                    <Link to="/driver/jobs">
                      <FileText className="mr-2 h-4 w-4" />
                      Job Sheet
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-11">
                    <Link to="/driver/vehicle">
                      <Truck className="mr-2 h-4 w-4" />
                      Manage Vehicle Info
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>New Job Offers</CardTitle>
                  <Badge variant="secondary">
                    {availableJobsData?.bookings?.length ?? 0}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAvailableLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableJobsData?.bookings && availableJobsData.bookings.length > 0 ? (
                    <>
                      {availableJobsData.bookings.slice(0, 3).map((booking: any) => {
                        const offer = getOfferForDriver(booking, user)
                        const offeredPrice =
                          offer?.offeredPrice ?? booking.finalPrice ?? booking.estimatedPrice
                        return (
                          <DriverJobCard
                            key={booking._id}
                            booking={booking}
                            price={offeredPrice}
                            priceLabel="Offer"
                            showStatus={false}
                            footer={
                              <div className="flex flex-col gap-2 pt-1">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleAccept(booking._id)}
                                    disabled={
                                      acceptMutation.isLoading || rejectMutation.isLoading
                                    }
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleReject(booking._id)}
                                    disabled={
                                      acceptMutation.isLoading || rejectMutation.isLoading
                                    }
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Reject
                                  </Button>
                                </div>
                                <Button asChild size="sm" variant="ghost" className="w-full">
                                  <Link to={`/driver/jobs/${booking._id}`}>View details</Link>
                                </Button>
                              </div>
                            }
                          />
                        )
                      })}
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link to="/driver/available-jobs">View all job offers</Link>
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No new job offers right now.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Job Status | Earnings | Completed */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Job Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-sky-50/50 px-3 py-2.5">
                    <span className="text-sm text-sky-800">Job Offers</span>
                    <span className="text-sm font-semibold rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-sky-800">
                      {stats?.offeredJobs ?? availableJobsData?.bookings?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2.5">
                    <span className="text-sm text-slate-700">Pending</span>
                    <span className="text-sm font-semibold rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-slate-700">
                      {stats?.pendingJobs || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-amber-50/60 px-3 py-2.5">
                    <span className="text-sm text-amber-900">Active</span>
                    <span className="text-sm font-semibold rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-amber-900">
                      {stats?.activeJobs || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-emerald-50/60 px-3 py-2.5">
                    <span className="text-sm text-emerald-800">Completed</span>
                    <span className="text-sm font-semibold rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-800">
                      {stats?.completedJobs || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border bg-emerald-50/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-800/80">
                      Total earnings
                    </p>
                    <p className="text-3xl font-bold text-emerald-900 mt-1 tabular-nums">
                      {formatCurrencyWhole(stats?.totalEarnings || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {stats?.completedJobs || 0} completed job
                      {(stats?.completedJobs || 0) === 1 ? '' : 's'}
                    </p>
                  </div>

                  {stats?.recentEarnings && stats.recentEarnings.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Recent payouts
                      </p>
                      {stats.recentEarnings.slice(0, 5).map((earning) => (
                        <Link
                          key={earning._id}
                          to={`/driver/jobs/${earning._id}`}
                          className="block"
                        >
                          <div className="rounded-xl border p-3.5 hover:bg-muted/40 transition-colors space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {earning.customerName || 'Customer'}
                                </p>
                                {earning.orderCode && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    #{earning.orderCode}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {earning.pickupCity} → {earning.deliveryCity}
                                  </span>
                                </div>
                              </div>
                              <p className="text-base font-semibold text-emerald-700 tabular-nums shrink-0">
                                {formatCurrencyWhole(earning.amount || 0)}
                              </p>
                            </div>
                            {earning.completedAt && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Completed {formatDate(earning.completedAt)}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <PoundSterling className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Complete a job to see earnings here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recently Completed</CardTitle>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/driver/jobs?status=completed">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCompletedLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : completedJobsData?.bookings && completedJobsData.bookings.length > 0 ? (
                    completedJobsData.bookings.slice(0, 4).map((booking: any) => (
                      <Link
                        key={booking._id}
                        to={`/driver/jobs/${booking._id}`}
                        className="block"
                      >
                        <div className="rounded-xl border p-3.5 hover:bg-muted/40 transition-colors space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {typeof booking.customer === 'object'
                                  ? booking.customer.name
                                  : 'Customer'}
                              </p>
                              {booking.orderCode && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  #{booking.orderCode}
                                </p>
                              )}
                            </div>
                            <StatusBadge status="completed" className="text-xs shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {booking.pickupCity} → {booking.deliveryCity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {booking.completedAt
                                  ? formatDate(booking.completedAt)
                                  : formatDate(booking.pickupDate)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold tabular-nums">
                              {formatCurrency(
                                booking.finalPrice || booking.estimatedPrice || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        You have not completed any jobs yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DriverDashboard
