import { useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import {
  useDriverStats,
  useDriverWithdrawals,
  useRequestWithdrawal,
} from '@/hooks/useDriver'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ReadField, SectionShell } from '@/components/booking/SectionShell'

const DriverBalancePage = () => {
  const { data: stats, isLoading: statsLoading } = useDriverStats()
  const { data: withdrawalsData, isLoading: historyLoading } = useDriverWithdrawals()
  const requestMutation = useRequestWithdrawal()

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const balance = stats?.balance || { current: 0, inReview: 0, available: 0 }

  const handleWithdraw = async () => {
    const value = parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid amount')
      setTimeout(() => setError(''), 3000)
      return
    }
    try {
      const result = await requestMutation.mutateAsync({
        amount: value,
        note: note.trim() || undefined,
      })
      setMessage(result.message || 'Withdrawal requested')
      setAmount('')
      setNote('')
      setTimeout(() => setMessage(''), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request withdrawal')
      setTimeout(() => setError(''), 4000)
    }
  }

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Balance</h2>
          <p className="text-muted-foreground">Earnings, available funds, and withdrawals</p>
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

        <SectionShell title="Current balance">
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <ReadField label="Current (total earned)" value={formatCurrency(balance.current)} />
              <ReadField label="In review (last 7 days)" value={formatCurrency(balance.inReview)} />
              <ReadField label="Available to withdraw" value={formatCurrency(balance.available)} />
            </div>
          )}
        </SectionShell>

        <Card>
          <CardHeader>
            <CardTitle>Request withdrawal</CardTitle>
            <CardDescription>
              You can withdraw up to {formatCurrency(balance.available)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdrawAmount">Amount (£)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="withdrawNote">Note (optional)</Label>
              <Textarea
                id="withdrawNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1.5"
                placeholder="Any note for admin..."
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={requestMutation.isLoading || balance.available <= 0}
            >
              {requestMutation.isLoading ? 'Submitting...' : 'Request withdrawal'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal history</CardTitle>
            <CardDescription>Recent requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !withdrawalsData?.withdrawals?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No withdrawals yet
              </p>
            ) : (
              <div className="space-y-3">
                {withdrawalsData.withdrawals.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </p>
                      {item.note && <p className="text-sm mt-1">{item.note}</p>}
                    </div>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DriverBalancePage
