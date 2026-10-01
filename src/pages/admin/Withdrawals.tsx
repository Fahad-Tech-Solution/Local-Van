import { useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Banknote } from 'lucide-react'
import { useAdminWithdrawals, useProcessWithdrawal } from '@/hooks/useAdmin'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const statusVariant = (status: string) => {
  if (status === 'paid' || status === 'approved') return 'default' as const
  if (status === 'rejected') return 'destructive' as const
  return 'secondary' as const
}

const AdminWithdrawalsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading, refetch } = useAdminWithdrawals({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const processMutation = useProcessWithdrawal()

  const handleProcess = async (
    id: string,
    status: 'approved' | 'rejected' | 'paid'
  ) => {
    try {
      const result = await processMutation.mutateAsync({ id, status })
      setMessage(result.message || `Withdrawal marked ${status}`)
      setTimeout(() => setMessage(''), 3000)
      refetch()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update withdrawal')
      setTimeout(() => setError(''), 4000)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Withdrawals</h2>
          <p className="text-muted-foreground">Review and process driver withdrawal requests</p>
        </div>

        {message && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Requests</CardTitle>
              <CardDescription>Approve, reject, or mark as paid</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.withdrawals?.length ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No withdrawals found</p>
            ) : (
              <div className="space-y-3">
                {data.withdrawals.map((item: any) => {
                  const driver =
                    typeof item.driver === 'object' ? item.driver : null
                  return (
                    <Card key={item._id}>
                      <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {driver?.name || 'Driver'}
                            </p>
                            <Badge variant={statusVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {driver?.email || '—'}
                            {driver?.phone ? ` · ${driver.phone}` : ''}
                          </p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested {formatDateTime(item.createdAt)}
                          </p>
                          {item.note && (
                            <p className="text-sm">Note: {item.note}</p>
                          )}
                          {item.adminNote && (
                            <p className="text-sm text-muted-foreground">
                              Admin: {item.adminNote}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleProcess(item._id, 'approved')}
                                disabled={processMutation.isLoading}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleProcess(item._id, 'rejected')}
                                disabled={processMutation.isLoading}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {(item.status === 'pending' || item.status === 'approved') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcess(item._id, 'paid')}
                              disabled={processMutation.isLoading}
                            >
                              <Banknote className="h-4 w-4 mr-1" />
                              Mark paid
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AdminWithdrawalsPage
