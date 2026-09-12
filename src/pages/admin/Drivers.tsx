import { useState, type ReactNode } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Mail, Eye, Edit } from 'lucide-react'
import { useAdminDrivers, useResendDriverApprovalInvite, useUpdateUser } from '@/hooks/useAdmin'
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

const DetailRow = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 py-2 text-sm items-start">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium break-words">{value || '—'}</span>
  </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border bg-muted/20 p-3 sm:p-4 space-y-1">
    <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2">
      {title}
    </h4>
    <div className="divide-y">{children}</div>
  </section>
)

const DriversPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [viewingDriver, setViewingDriver] = useState<any>(null)
  const [editingDriver, setEditingDriver] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data, isLoading, isFetching, refetch } = useAdminDrivers({
    page,
    limit: 10,
    search: search || undefined,
    activeStatus: activeFilter,
  })
  const resendApprovalMutation = useResendDriverApprovalInvite()
  const updateUserMutation = useUpdateUser()

  const handleResendApproval = async (driverId: string) => {
    try {
      const result = await resendApprovalMutation.mutateAsync(driverId)
      setMessage(result.message)
      refetch()
      setTimeout(() => setMessage(''), 4000)
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to resend approval email')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleOpenEdit = (driver: any) => {
    setEditingDriver({ ...driver, bankDetails: { ...(driver.bankDetails || {}) } })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingDriver) return
    try {
      await updateUserMutation.mutateAsync({
        id: editingDriver._id,
        data: {
          name: editingDriver.name,
          email: editingDriver.email,
          phone: editingDriver.phone,
          role: editingDriver.role || 'driver',
          isActive: editingDriver.isActive,
          username: editingDriver.username,
          address: editingDriver.address,
          businessName: editingDriver.businessName,
          bankDetails: editingDriver.bankDetails,
        },
      })
      setIsEditOpen(false)
      setEditingDriver(null)
      setMessage('Driver updated successfully')
      refetch()
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to update driver')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Management</h2>
          <p className="text-muted-foreground">View and manage all drivers</p>
        </div>

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Drivers</CardTitle>
            <CardDescription>Search and view driver information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:gap-4">
              <div className="flex-1 relative min-w-0 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={activeFilter}
                onValueChange={(value: 'all' | 'active' | 'inactive') => {
                  setActiveFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.drivers?.length ? (
              <p className="text-center text-muted-foreground py-12">
                {activeFilter === 'inactive'
                  ? 'No inactive drivers found'
                  : activeFilter === 'active'
                    ? 'No active drivers found'
                    : 'No drivers found'}
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {data?.drivers?.map((driver: any) => (
                    <div
                      key={driver._id}
                      className="p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-medium">{driver.name}</h3>
                            <Badge variant="default">Driver</Badge>
                            {driver.applicationStatus === 'approved' && (
                              <Badge variant="default">Approved</Badge>
                            )}
                            {driver.passwordSetupPending && (
                              <Badge variant="secondary">Pending setup</Badge>
                            )}
                            {!driver.isActive && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground break-words">{driver.email}</p>
                          {driver.phone && (
                            <p className="text-sm text-muted-foreground">{driver.phone}</p>
                          )}
                          {driver.stats && (
                            <div className="mt-2 flex gap-4 text-sm flex-wrap">
                              <span className="text-muted-foreground">
                                <strong>Total Jobs:</strong> {driver.stats.totalJobs}
                              </span>
                              <span className="text-muted-foreground">
                                <strong>Completed:</strong> {driver.stats.completedJobs}
                              </span>
                              <span className="text-muted-foreground">
                                <strong>Active:</strong> {driver.stats.activeJobs}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingDriver(driver)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(driver)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {driver.passwordSetupPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendApproval(driver._id)}
                              disabled={resendApprovalMutation.isLoading}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {data?.pagination && data.pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
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
                        onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                        disabled={page === data.pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewingDriver} onOpenChange={(open) => !open && setViewingDriver(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg max-h-[90dvh] overflow-hidden flex flex-col gap-3 p-4 sm:p-6">
          <DialogHeader className="shrink-0 pr-6 text-left">
            <DialogTitle>{viewingDriver?.name}</DialogTitle>
            <DialogDescription className="break-words">{viewingDriver?.email}</DialogDescription>
          </DialogHeader>
          {viewingDriver && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 -mx-1 px-1">
              <Section title="Status">
                <DetailRow
                  label="Application"
                  value={viewingDriver.applicationStatus || '—'}
                />
                <DetailRow
                  label="Setup"
                  value={viewingDriver.passwordSetupPending ? 'Pending password setup' : 'Complete'}
                />
                <DetailRow label="Active" value={viewingDriver.isActive ? 'Yes' : 'No'} />
              </Section>
              <Section title="Contact">
                <DetailRow label="Phone" value={viewingDriver.phone} />
                <DetailRow label="Username" value={viewingDriver.username} />
                <DetailRow label="Business" value={viewingDriver.businessName} />
                <DetailRow label="Address" value={viewingDriver.address} />
              </Section>
              <Section title="Vehicle">
                <DetailRow
                  label="Make / Model"
                  value={
                    [viewingDriver.vehicleMake, viewingDriver.vehicleModel].filter(Boolean).join(' ') ||
                    undefined
                  }
                />
                <DetailRow label="Registration" value={viewingDriver.vehicleRegistration} />
                <DetailRow label="Category" value={viewingDriver.vehicleCategory} />
                <DetailRow label="Type" value={viewingDriver.vehicleType} />
                <DetailRow label="Fuel" value={viewingDriver.vehicleFuelType} />
                <DetailRow label="Base location" value={viewingDriver.vehicleBaseLocation} />
              </Section>
              <Section title="Bank details">
                <DetailRow label="Account name" value={viewingDriver.bankDetails?.accountName} />
                <DetailRow label="Bank name" value={viewingDriver.bankDetails?.bankName} />
                <DetailRow label="Sort code" value={viewingDriver.bankDetails?.sortCode} />
                <DetailRow label="Account number" value={viewingDriver.bankDetails?.accountNumber} />
              </Section>
              {viewingDriver.stats && (
                <Section title="Jobs">
                  <DetailRow label="Total" value={viewingDriver.stats.totalJobs} />
                  <DetailRow label="Completed" value={viewingDriver.stats.completedJobs} />
                  <DetailRow label="Active" value={viewingDriver.stats.activeJobs} />
                </Section>
              )}
            </div>
          )}
          <DialogFooter className="shrink-0 gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setViewingDriver(null)} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (viewingDriver) {
                  handleOpenEdit(viewingDriver)
                  setViewingDriver(null)
                }
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg max-h-[90dvh] overflow-hidden flex flex-col gap-3 p-4 sm:p-6">
          <DialogHeader className="shrink-0 pr-6 text-left">
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver information</DialogDescription>
          </DialogHeader>
          {editingDriver && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 -mx-1 px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 min-w-0">
                  <Label>Name</Label>
                  <Input
                    value={editingDriver.name || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label>Username</Label>
                  <Input
                    value={editingDriver.username || ''}
                    onChange={(e) =>
                      setEditingDriver({ ...editingDriver, username: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={editingDriver.email || ''}
                  onChange={(e) => setEditingDriver({ ...editingDriver, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={editingDriver.phone || ''}
                  onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input
                  value={editingDriver.address || ''}
                  onChange={(e) => setEditingDriver({ ...editingDriver, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input
                  value={editingDriver.businessName || ''}
                  onChange={(e) =>
                    setEditingDriver({ ...editingDriver, businessName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={editingDriver.role || 'driver'}
                  onValueChange={(value) => setEditingDriver({ ...editingDriver, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Bank Details</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Account Name</Label>
                    <Input
                      value={editingDriver.bankDetails?.accountName || ''}
                      onChange={(e) =>
                        setEditingDriver({
                          ...editingDriver,
                          bankDetails: {
                            ...editingDriver.bankDetails,
                            accountName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label>Account Number</Label>
                      <Input
                        value={editingDriver.bankDetails?.accountNumber || ''}
                        onChange={(e) =>
                          setEditingDriver({
                            ...editingDriver,
                            bankDetails: {
                              ...editingDriver.bankDetails,
                              accountNumber: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label>Sort Code</Label>
                      <Input
                        value={editingDriver.bankDetails?.sortCode || ''}
                        onChange={(e) =>
                          setEditingDriver({
                            ...editingDriver,
                            bankDetails: {
                              ...editingDriver.bankDetails,
                              sortCode: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bank Name</Label>
                    <Input
                      value={editingDriver.bankDetails?.bankName || ''}
                      onChange={(e) =>
                        setEditingDriver({
                          ...editingDriver,
                          bankDetails: {
                            ...editingDriver.bankDetails,
                            bankName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input
                  type="checkbox"
                  id="driverIsActive"
                  checked={!!editingDriver.isActive}
                  onChange={(e) =>
                    setEditingDriver({ ...editingDriver, isActive: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="driverIsActive">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 gap-2 sm:gap-0 border-t pt-3">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateUserMutation.isLoading}
              className="w-full sm:w-auto"
            >
              {updateUserMutation.isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default DriversPage
