import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Loader2, Briefcase, CheckCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { driverApi } from '@/api/driver'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getOfferForDriver } from '@/utils/driverOffers'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { DriverJobCard } from '@/components/driver/DriverJobCard'

const AvailableJobsPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery('availableJobs', driverApi.getAvailableJobs, {
    refetchInterval: 30000,
  })

  const acceptMutation = useMutation((id: string) => driverApi.acceptJobOffer(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('availableJobs')
      queryClient.invalidateQueries('availableJobsDashboard')
      queryClient.invalidateQueries('availableJobsInJobSheet')
      queryClient.invalidateQueries('driverJobs')
      queryClient.invalidateQueries('driverStats')
    },
  })

  const rejectMutation = useMutation((id: string) => driverApi.rejectJobOffer(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('availableJobs')
      queryClient.invalidateQueries('availableJobsDashboard')
      queryClient.invalidateQueries('availableJobsInJobSheet')
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

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Available Jobs</h2>
          <p className="text-muted-foreground">
            Jobs offered to you — accept or reject offers
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data?.bookings && data.bookings.length > 0 ? (
          <div className="space-y-5">
            {data.bookings.map((booking: any) => {
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
                  hideContact
                  footer={
                    <div className="space-y-3 pt-1">
                      {booking.offerExpiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Offer expires {formatDateTime(booking.offerExpiresAt)}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
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
                      <Button asChild variant="ghost" className="w-full">
                        <Link to={`/driver/jobs/${booking._id}`}>View job details</Link>
                      </Button>
                    </div>
                  }
                />
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No jobs available at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for new job offers
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AvailableJobsPage
