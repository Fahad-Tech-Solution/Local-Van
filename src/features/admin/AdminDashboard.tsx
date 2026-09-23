import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Truck,
  FileText,
  Loader2,
  Search,
  MapPin,
  Package,
} from 'lucide-react'
import { useAdminStats, useAdminUsers } from '@/hooks/useAdmin'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatCurrencyWhole, formatDate } from '@/utils/format'
import { useState } from 'react'

const serviceLabel = (value?: string) => {
  if (value === 'long-distance') return 'Long Distance'
  if (value === 'interstate') return 'Interstate'
  if (value === 'local') return 'Local'
  return value || 'Booking'
}

const StatRow = ({
  label,
  value,
  valueClassName = 'text-foreground',
}: {
  label: string
  value: number | string
  valueClassName?: string
}) => (
  <div className="flex items-center justify-between py-2.5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${valueClassName}`}>{value}</span>
  </div>
)

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats()
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const { data: searchResults } = useAdminUsers({
    search: searchQuery || undefined,
    limit: 5,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/admin/users?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const activeAssigned =
    stats?.bookings.activeAssigned ??
    (stats?.bookings.confirmed || 0) + (stats?.bookings.inProgress || 0)

  const recentTransactions = stats?.recentTransactions || []

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Manage users, drivers, and bookings from here.
            </p>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Quick Search</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            {searchQuery && searchResults?.users && searchResults.users.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Quick Results:</p>
                {searchResults.users.slice(0, 5).map((user: any) => (
                  <Link
                    key={user._id}
                    to={`/admin/users?search=${encodeURIComponent(user.email)}`}
                    className="block p-2 border rounded hover:bg-muted/50 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground">{user.email}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.users.admins || 0} admins, {stats?.users.drivers || 0} drivers,{' '}
                    {stats?.users.customers || 0} customers
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users.drivers || 0}</div>
                  <p className="text-xs text-muted-foreground">Active drivers</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.bookings.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.bookings.pending || 0} pending, {activeAssigned} active assigned
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue (completed)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrencyWhole(stats?.revenue.total || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paid to date: {formatCurrencyWhole(stats?.revenue.totalSpent || 0)}
                  </p>
                  {(stats?.revenue.pipeline ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pipeline (confirmed/in-progress):{' '}
                      {formatCurrencyWhole(stats?.revenue.pipeline)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/drivers">
                      <Truck className="mr-2 h-4 w-4" />
                      Manage Drivers
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/bookings">
                      <FileText className="mr-2 h-4 w-4" />
                      Manage Bookings
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Booking Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div>
                    <StatRow label="Pending" value={stats?.bookings.pending || 0} />
                    <StatRow label="Offered" value={stats?.bookings.offered || 0} />
                    <StatRow label="Confirmed" value={stats?.bookings.confirmed || 0} />
                    <StatRow label="In Progress" value={stats?.bookings.inProgress || 0} />
                  </div>
                  <div className="border-t border-border mt-1 pt-1">
                    <StatRow label="Active assigned" value={activeAssigned} />
                    <StatRow label="Completed" value={stats?.bookings.completed || 0} />
                    <StatRow
                      label="Disputed"
                      value={stats?.bookings.disputed || 0}
                      valueClassName="text-destructive"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    User Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div>
                    <StatRow label="Total Users" value={stats?.users.total || 0} />
                    <StatRow label="Admins" value={stats?.users.admins || 0} />
                    <StatRow label="Drivers" value={stats?.users.drivers || 0} />
                    <StatRow label="Customers" value={stats?.users.customers || 0} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Recent Transactions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Latest completed booking revenue.
                  </CardDescription>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/admin/bookings?status=completed">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No completed bookings yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {recentTransactions.map((tx) => (
                      <Link
                        key={tx._id}
                        to="/admin/bookings"
                        className="flex items-center gap-3 sm:gap-4 py-3.5 hover:bg-muted/30 -mx-2 px-2 transition-colors"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-md bg-form-field flex items-center justify-center">
                          <Package className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {tx.customerName || 'Customer'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {serviceLabel(tx.serviceType)}
                            {tx.orderCode ? ` · #${tx.orderCode}` : ''}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 max-w-[160px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {tx.pickupCity} → {tx.deliveryCity}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0 w-[72px] text-right">
                          {tx.completedAt ? formatDate(tx.completedAt) : '—'}
                        </div>
                        <div className="text-sm font-semibold text-emerald-600 tabular-nums shrink-0 w-[88px] text-right">
                          +{formatCurrency(tx.amount || 0)}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
