import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useDriverJobs } from '@/hooks/useDriver'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { driverApi } from '@/api/driver'
import { useAuth } from '@/hooks/useAuth'
import { getOfferForDriver } from '@/utils/driverOffers'
import { formatCurrency } from '@/utils/format'
import { DriverJobCard } from '@/components/driver/DriverJobCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const VALID_STATUS_FILTERS = [
  'all',
  'pending',
  'confirmed',
  'in-progress',
  'completed',
  'disputed',
] as const

const DriverJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlStatus = searchParams.get('status')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    urlStatus && VALID_STATUS_FILTERS.includes(urlStatus as (typeof VALID_STATUS_FILTERS)[number])
      ? urlStatus
      : 'all'
  )
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (
      urlStatus &&
      VALID_STATUS_FILTERS.includes(urlStatus as (typeof VALID_STATUS_FILTERS)[number]) &&
      urlStatus !== statusFilter
    ) {
      setStatusFilter(urlStatus)
      setPage(1)
    }
  }, [urlStatus, statusFilter])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
    if (value === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status: value })
    }
  }

  const { data, isLoading } = useDriverJobs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 10,
  })

  const { data: availableJobsData, isLoading: isAvailableLoading } = useQuery(
    'availableJobsInJobSheet',
    driverApi.getAvailableJobs,
    { refetchInterval: 30000 }
  )

  const { data: confirmedJobsData, isLoading: isConfirmedLoading } = useDriverJobs({
    status: 'confirmed',
    page: 1,
    limit: 20,
  })
  const { data: inProgressJobsData, isLoading: isInProgressLoading } = useDriverJobs({
    status: 'in-progress',
    page: 1,
    limit: 20,
  })

  const acceptMutation = useMutation((id: string) => driverApi.acceptJobOffer(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('availableJobsInJobSheet')
      queryClient.invalidateQueries('availableJobs')
      queryClient.invalidateQueries('availableJobsDashboard')
      queryClient.invalidateQueries('driverJobs')
      queryClient.invalidateQueries('driverStats')
    },
  })

  const rejectMutation = useMutation((id: string) => driverApi.rejectJobOffer(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('availableJobsInJobSheet')
      queryClient.invalidateQueries('availableJobs')
      queryClient.invalidateQueries('availableJobsDashboard')
    },
  })

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

  const isUpcomingLoading = isConfirmedLoading || isInProgressLoading
  const upcomingJobs = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const combined = [
      ...(confirmedJobsData?.bookings || []),
      ...(inProgressJobsData?.bookings || []),
    ]
    return combined
      .filter((booking: any) => new Date(booking.pickupDate).getTime() >= todayStart.getTime())
      .sort((a: any, b: any) => {
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1
        if (b.status === 'in-progress' && a.status !== 'in-progress') return 1
        return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
      })
      .slice(0, 5)
  }, [confirmedJobsData?.bookings, inProgressJobsData?.bookings])

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Jobs</h2>
          <p className="text-muted-foreground">View and manage your assigned jobs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Offers Awaiting Response</CardTitle>
            <CardDescription>
              Accept or reject jobs offered to you directly from your job sheet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAvailableLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableJobsData?.bookings && availableJobsData.bookings.length > 0 ? (
              <div className="space-y-4">
                {availableJobsData.bookings.slice(0, 5).map((booking: any) => {
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
                        <div className="flex gap-2 pt-1">
                          <Button
                            onClick={() => handleAccept(booking._id)}
                            disabled={acceptMutation.isLoading || rejectMutation.isLoading}
                            className="flex-1"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept ({formatCurrency(offeredPrice)})
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(booking._id)}
                            disabled={acceptMutation.isLoading || rejectMutation.isLoading}
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      }
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pending offers right now.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Jobs</CardTitle>
            <CardDescription>Your active and upcoming jobs by pickup date</CardDescription>
          </CardHeader>
          <CardContent>
            {isUpcomingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingJobs.length > 0 ? (
              <div className="space-y-4">
                {upcomingJobs.map((booking: any) => (
                  <DriverJobCard
                    key={booking._id}
                    booking={booking}
                    href={`/driver/jobs/${booking._id}`}
                    priceLabel="Pay"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming jobs yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Jobs</CardTitle>
                <CardDescription>Filter by status</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {data?.bookings && data.bookings.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {data.bookings.map((booking: any) => (
                        <DriverJobCard
                          key={booking._id}
                          booking={booking}
                          href={`/driver/jobs/${booking._id}`}
                          priceLabel="Pay"
                        />
                      ))}
                    </div>

                    {data?.pagination && data.pagination.pages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">
                          Page {data.pagination.page} of {data.pagination.pages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPage((p) => Math.min(data.pagination.pages, p + 1))
                            }
                            disabled={page === data.pagination.pages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No jobs found. Check back later!</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DriverJobsPage
