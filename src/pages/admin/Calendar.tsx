import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminBookingsCalendar } from '@/hooks/useAdmin'
import { formatDate } from '@/utils/format'

function monthBounds(year: number, month: number) {
  const from = new Date(Date.UTC(year, month, 1))
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
  return { from: from.toISOString(), to: to.toISOString() }
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const AdminCalendarPage = () => {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { from, to } = useMemo(() => monthBounds(year, month), [year, month])
  const { data, isLoading } = useAdminBookingsCalendar(from, to)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const jobsByDay = useMemo(() => {
    const map = new Map<number, any[]>()
    for (const booking of data?.bookings || []) {
      const d = new Date(booking.pickupDate)
      if (d.getFullYear() !== year || d.getMonth() !== month) continue
      const day = d.getDate()
      const list = map.get(day) || []
      list.push(booking)
      map.set(day, list)
    }
    return map
  }, [data?.bookings, year, month])

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
            <p className="text-muted-foreground">Jobs by pickup date</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="min-w-[160px] text-center font-medium">{monthLabel}</p>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{monthLabel}</CardTitle>
            <CardDescription>Click a job to open bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold uppercase text-muted-foreground py-1"
                  >
                    {day}
                  </div>
                ))}
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[88px] rounded-lg border border-dashed bg-muted/20" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const jobs = jobsByDay.get(day) || []
                  return (
                    <div
                      key={day}
                      className="min-h-[88px] rounded-lg border bg-white p-2 space-y-1 overflow-hidden"
                    >
                      <p className="text-xs font-semibold">{day}</p>
                      {jobs.slice(0, 3).map((job) => (
                        <button
                          key={job._id}
                          type="button"
                          className="w-full text-left rounded border px-1.5 py-1 hover:bg-muted/50"
                          onClick={() => navigate('/admin/bookings')}
                          title={`${job.orderCode || 'Job'} · ${formatDate(job.pickupDate)} ${job.pickupTime || ''}`}
                        >
                          <div className="flex items-center gap-1 flex-wrap">
                            {job.orderCode && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                #{job.orderCode}
                              </Badge>
                            )}
                            <StatusBadge status={job.status} />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {job.pickupCity || '—'} → {job.deliveryCity || '—'}
                          </p>
                        </button>
                      ))}
                      {jobs.length > 3 && (
                        <p className="text-[11px] text-muted-foreground">+{jobs.length - 3} more</p>
                      )}
                    </div>
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

export default AdminCalendarPage
