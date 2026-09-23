import { useState, type ComponentProps, type ReactNode } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Textarea } from '@/components/ui/textarea'
import { Search, Loader2, Edit, Truck, Mail, AlertCircle, PoundSterling, MessageSquare, Users, CheckCircle2, XCircle, Plus, RefreshCcw, Eye, MapPin, Package, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  formatAccessFromAdmin,
  formatStairsDisplay,
  parseStairsAccess,
  type AccessType,
} from '@/utils/stairsAccess'
import {
  ASSEMBLY_PRICE_PER_ITEM,
  DISMANTLE_PRICE_PER_ITEM,
  PACKING_PRICE_PER_5_BOXES,
  emptyServiceExtras,
  emptyStop,
  emptyVanCounts,
  formatServiceExtrasLabel,
  formatVanCountsLabel,
  serviceExtrasFromBooking,
  stopsFromBooking,
  suggestedExtrasTotal,
  totalVans,
  vanCountsFromBooking,
  type BookingStopForm,
} from '@/utils/manualBookingExtras'
import { 
  useAdminBookings, 
  useUpdateBookingAdmin,
  useCreateBookingAdmin,
  useDeleteBookingAdmin,
  useAssignDriver,
  useReclaimBooking,
  useAdminDrivers, 
  useHandleDispute, 
  useSendEmailReminder,
  useOfferJobToDrivers,
  useAddBookingNote,
  useRecordAdditionalWorkPayment,
} from '@/hooks/useAdmin'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

const VAN_SIZE_FIELDS = [
  { key: 'small' as const, label: 'Small' },
  { key: 'medium' as const, label: 'Medium' },
  { key: 'large' as const, label: 'Large' },
  { key: 'luton' as const, label: 'Luton' },
]

const PACKING_BOX_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

/** Allows wiping a 0 so the next digit replaces it (instead of typing 01). */
function ClearableNumberInput({
  value,
  onValueChange,
  min = 0,
  max,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) => {
    let next = Math.max(min, n)
    if (max != null) next = Math.min(max, next)
    return next
  }

  return (
    <Input
      {...props}
      type="number"
      min={min}
      max={max}
      value={draft !== null ? draft : String(value)}
      onFocus={(e) => {
        setDraft(String(value))
        props.onFocus?.(e)
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        if (raw === '') return
        const n = parseInt(raw, 10)
        if (!Number.isNaN(n)) onValueChange(clamp(n))
      }}
      onBlur={(e) => {
        if (draft === null || draft === '' || Number.isNaN(parseInt(draft, 10))) {
          onValueChange(min)
        } else {
          onValueChange(clamp(parseInt(draft, 10)))
        }
        setDraft(null)
        props.onBlur?.(e)
      }}
    />
  )
}

const VEHICLE_TYPE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'luton', label: 'Luton' },
  { value: 'multi-van', label: 'Multi Van' },
] as const

const PICKUP_TIME_OPTIONS = [
  '6am-7am',
  '7am-8am',
  '8am-9am',
  '9am-10am',
  '10am-11am',
  '11am-12pm',
  '12pm-1pm',
  '1pm-2pm',
  '2pm-3pm',
  '3pm-4pm',
  '4pm-5pm',
  '5pm-6pm',
  '6pm-7pm',
  '7pm-8pm',
  '8pm-9pm',
] as const

const formatPeopleRequired = (men?: number): string | undefined => {
  if (!men || men < 1) return undefined
  return men === 1 ? '1 person' : `${men} people`
}

const formatPeopleSplit = (drivers?: number, helpers?: number, men?: number) => {
  if (drivers != null || helpers != null) {
    const d = Number(drivers) || 0
    const h = Number(helpers) || 0
    return `${d} driver${d === 1 ? '' : 's'}${h > 0 ? ` + ${h} helper${h === 1 ? '' : 's'}` : ''} (${d + h} total)`
  }
  return formatPeopleRequired(men) || '—'
}

const vehicleLabel = (value?: string) =>
  VEHICLE_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
  value?.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') ||
  '—'

const serviceLabel = (value?: string) => {
  if (value === 'long-distance') return 'Long Distance'
  if (value === 'interstate') return 'Interstate'
  if (value === 'local') return 'Local'
  return value || '—'
}

const paymentMethodLabel = (value?: string) => {
  const map: Record<string, string> = {
    'bank-transfer': 'Bank Transfer',
    cash: 'Cash',
    card: 'Card',
    other: 'Other',
  }
  return value ? map[value] || value : '—'
}

const SectionShell = ({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) => (
  <section className="rounded-xl border bg-white p-4 sm:p-5 space-y-4">
    <div className="flex items-center gap-2">
      {icon}
      <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        {title}
      </h4>
    </div>
    {children}
  </section>
)

const ReadField = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div className="space-y-1 min-w-0">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium break-words">{value || '—'}</p>
  </div>
)

const emptyManualOrder = () => ({
  customer: { name: '', email: '', phone: '' },
  pickupAddress: '',
  pickupCity: '',
  pickupZipCode: '',
  pickupDate: '',
  pickupTime: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryZipCode: '',
  serviceType: 'local' as 'local' | 'long-distance' | 'interstate',
  vanCounts: emptyVanCounts(),
  helpers: 0,
  stops: [] as BookingStopForm[],
  serviceExtras: emptyServiceExtras(),
  pickupAccess: 'ground' as 'lift' | 'stairs' | 'ground',
  pickupStairsCount: 1,
  deliveryAccess: 'ground' as 'lift' | 'stairs' | 'ground',
  deliveryStairsCount: 1,
  price: 0,
  paymentStatus: 'paid' as 'paid' | 'pending',
  paymentMethod: 'bank-transfer' as 'bank-transfer' | 'cash' | 'card' | 'other',
  paymentReference: '',
  specialInstructions: '',
  sendConfirmationEmail: true,
  status: 'pending' as 'pending' | 'survey',
})

const BookingsPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [isAdditionalWorkDialogOpen, setIsAdditionalWorkDialogOpen] = useState(false)
  const [bookingToAssign, setBookingToAssign] = useState<string | null>(null)
  const [bookingForOffer, setBookingForOffer] = useState<any>(null)
  const [viewingBooking, setViewingBooking] = useState<any>(null)
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [offerPercentage, setOfferPercentage] = useState<number>(50)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<'call' | 'issue' | 'general'>('general')
  const [additionalWorkAmount, setAdditionalWorkAmount] = useState<number>(0)
  const [additionalWorkDescription, setAdditionalWorkDescription] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [editError, setEditError] = useState('')

  const { data, isLoading, refetch } = useAdminBookings({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const { data: driversData } = useAdminDrivers({ limit: 100 })
  const updateBookingMutation = useUpdateBookingAdmin()
  const createBookingMutation = useCreateBookingAdmin()
  const deleteBookingMutation = useDeleteBookingAdmin()
  const assignDriverMutation = useAssignDriver()
  const reclaimBookingMutation = useReclaimBooking()
  const handleDisputeMutation = useHandleDispute()
  const sendReminderMutation = useSendEmailReminder()
  const offerJobMutation = useOfferJobToDrivers()
  const addNoteMutation = useAddBookingNote()
  const recordPaymentMutation = useRecordAdditionalWorkPayment()
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false)
  const [bookingToDispute, setBookingToDispute] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newManualOrder, setNewManualOrder] = useState(emptyManualOrder)

  const handleView = (booking: any) => {
    setViewingBooking(booking)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (booking: any) => {
    const pickup = parseStairsAccess(booking.collectionStairs)
    const delivery = parseStairsAccess(booking.deliveryStairs)
    const vanCounts = vanCountsFromBooking(booking)
    const drivers = totalVans(vanCounts)
    setEditingBooking({
      ...booking,
      pickupDate: booking.pickupDate
        ? new Date(booking.pickupDate).toISOString().split('T')[0]
        : '',
      pickupAccess: pickup.access,
      pickupStairsCount: pickup.stairsCount,
      deliveryAccess: delivery.access,
      deliveryStairsCount: delivery.stairsCount,
      vanCounts,
      drivers,
      helpers: Number(booking.helpers) || Math.max(0, (Number(booking.men) || drivers) - drivers),
      stops: stopsFromBooking(booking),
      serviceExtras: serviceExtrasFromBooking(booking),
      men: drivers + (Number(booking.helpers) || 0),
      finalPrice: booking.finalPrice ?? booking.estimatedPrice ?? 0,
      estimatedPrice: booking.estimatedPrice ?? booking.finalPrice ?? 0,
      paymentStatus: booking.paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentMethod: booking.paymentMethod || 'bank-transfer',
      paymentReference: booking.paymentReference || '',
      specialInstructions: booking.specialInstructions || '',
      vehicleType: booking.vehicleType || 'small',
      serviceType: booking.serviceType || 'local',
      contactEmail: booking.contactEmail || '',
      contactPhone: booking.contactPhone || '',
      sendConfirmationEmail: false,
    })
    setEditError('')
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingBooking) return
    setEditError('')
    try {
      const vanCounts = editingBooking.vanCounts || emptyVanCounts()
      const vansTotal = totalVans(vanCounts)
      if (vansTotal < 1) {
        setEditError('At least one van is required')
        return
      }
      const helpers = Math.max(0, Number(editingBooking.helpers) || 0)
      const drivers = vansTotal
      const men = drivers + helpers
      const extras = editingBooking.serviceExtras || emptyServiceExtras()
      if (Number(extras.packingBoxes) % 5 !== 0) {
        setEditError('Packing boxes must be in steps of 5')
        return
      }
      const price = Number(editingBooking.finalPrice) || 0
      const result = await updateBookingMutation.mutateAsync({
        id: editingBooking._id,
        data: {
          status: editingBooking.status,
          finalPrice: price,
          estimatedPrice: price,
          pickupAddress: editingBooking.pickupAddress,
          pickupCity: editingBooking.pickupCity,
          pickupZipCode: editingBooking.pickupZipCode,
          pickupDate: editingBooking.pickupDate
            ? new Date(editingBooking.pickupDate).toISOString()
            : editingBooking.pickupDate,
          pickupTime: editingBooking.pickupTime,
          deliveryAddress: editingBooking.deliveryAddress,
          deliveryCity: editingBooking.deliveryCity,
          deliveryZipCode: editingBooking.deliveryZipCode,
          contactEmail: editingBooking.contactEmail,
          contactPhone: editingBooking.contactPhone,
          serviceType: editingBooking.serviceType,
          vanCounts,
          helpers,
          drivers,
          stops: editingBooking.stops || [],
          serviceExtras: extras,
          paymentStatus: editingBooking.paymentStatus,
          paymentMethod:
            editingBooking.paymentStatus === 'paid'
              ? editingBooking.paymentMethod || undefined
              : undefined,
          paymentReference:
            editingBooking.paymentStatus === 'paid' && editingBooking.paymentReference?.trim()
              ? editingBooking.paymentReference.trim()
              : undefined,
          specialInstructions: editingBooking.specialInstructions || undefined,
          men,
          manRequired: formatPeopleRequired(men),
          collectionStairs: formatAccessFromAdmin(
            editingBooking.pickupAccess,
            editingBooking.pickupStairsCount
          ),
          deliveryStairs: formatAccessFromAdmin(
            editingBooking.deliveryAccess,
            editingBooking.deliveryStairsCount
          ),
          sendConfirmationEmail: editingBooking.sendConfirmationEmail === true,
        },
      })
      setIsEditDialogOpen(false)
      setEditingBooking(null)
      setEditError('')
      setSuccessMessage(result.message || 'Booking updated successfully')
      setTimeout(() => setSuccessMessage(''), 4000)
      refetch()
    } catch (error: any) {
      setEditError(error.response?.data?.message || 'Failed to update booking')
    }
  }

  const handleDeleteBooking = async (booking: any) => {
    const label = booking.orderCode || booking._id
    const confirmed = window.confirm(
      `Delete order ${label}? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteBookingMutation.mutateAsync(booking._id)
      if (editingBooking?._id === booking._id) {
        setIsEditDialogOpen(false)
        setEditingBooking(null)
        setEditError('')
      }
      if (viewingBooking?._id === booking._id) {
        setIsViewDialogOpen(false)
        setViewingBooking(null)
      }
      setSuccessMessage('Booking deleted successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      refetch()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete booking')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleOpenCreateDialog = () => {
    setNewManualOrder(emptyManualOrder())
    setIsCreateDialogOpen(true)
  }

  const isManualOrderValid = () => {
    const order = newManualOrder
    const vansTotal = totalVans(order.vanCounts)
    const hasCustomer =
      order.customer.name.trim() &&
      order.customer.email.trim() &&
      order.customer.phone.trim()
    const hasAddresses =
      order.pickupAddress.trim() &&
      order.pickupCity.trim() &&
      order.pickupZipCode.trim() &&
      order.deliveryAddress.trim() &&
      order.deliveryCity.trim() &&
      order.deliveryZipCode.trim() &&
      order.pickupDate &&
      order.pickupTime.trim()
    const hasPayment =
      order.paymentStatus === 'pending' ||
      (order.paymentStatus === 'paid' && order.paymentMethod)
    const hasAccess =
      (order.pickupAccess !== 'stairs' || order.pickupStairsCount >= 1) &&
      (order.deliveryAccess !== 'stairs' || order.deliveryStairsCount >= 1)
    const stopsOk = order.stops.every(
      (stop) =>
        stop.address.trim() &&
        stop.city.trim() &&
        stop.zipCode.trim() &&
        (stop.access !== 'stairs' || stop.stairsCount >= 1)
    )
    const packingOk = order.serviceExtras.packingBoxes % 5 === 0
    return (
      hasCustomer &&
      hasAddresses &&
      order.price > 0 &&
      hasPayment &&
      vansTotal >= 1 &&
      hasAccess &&
      stopsOk &&
      packingOk
    )
  }

  const handleCreateManualOrder = async () => {
    if (!isManualOrderValid()) return
    try {
      const vansTotal = totalVans(newManualOrder.vanCounts)
      const helpers = Math.max(0, Number(newManualOrder.helpers) || 0)
      const result = await createBookingMutation.mutateAsync({
        customer: {
          name: newManualOrder.customer.name.trim(),
          email: newManualOrder.customer.email.trim(),
          phone: newManualOrder.customer.phone.trim(),
        },
        pickupAddress: newManualOrder.pickupAddress.trim(),
        pickupCity: newManualOrder.pickupCity.trim(),
        pickupZipCode: newManualOrder.pickupZipCode.trim(),
        pickupDate: new Date(newManualOrder.pickupDate).toISOString(),
        pickupTime: newManualOrder.pickupTime,
        deliveryAddress: newManualOrder.deliveryAddress.trim(),
        deliveryCity: newManualOrder.deliveryCity.trim(),
        deliveryZipCode: newManualOrder.deliveryZipCode.trim(),
        serviceType: newManualOrder.serviceType,
        vanCounts: newManualOrder.vanCounts,
        helpers,
        drivers: vansTotal,
        stops: newManualOrder.stops,
        serviceExtras: newManualOrder.serviceExtras,
        price: newManualOrder.price,
        paymentStatus: newManualOrder.paymentStatus,
        paymentMethod:
          newManualOrder.paymentStatus === 'paid' ? newManualOrder.paymentMethod : undefined,
        paymentReference: newManualOrder.paymentReference.trim() || undefined,
        specialInstructions: newManualOrder.specialInstructions.trim() || undefined,
        sendConfirmationEmail: newManualOrder.sendConfirmationEmail,
        pickupAccess: newManualOrder.pickupAccess,
        pickupStairsCount:
          newManualOrder.pickupAccess === 'stairs' ? newManualOrder.pickupStairsCount : undefined,
        deliveryAccess: newManualOrder.deliveryAccess,
        deliveryStairsCount:
          newManualOrder.deliveryAccess === 'stairs' ? newManualOrder.deliveryStairsCount : undefined,
        men: vansTotal + helpers,
        status: newManualOrder.status,
      })

      setIsCreateDialogOpen(false)
      setNewManualOrder(emptyManualOrder())

      const emailParts: string[] = []
      if (result.emails.confirmation === 'sent') {
        emailParts.push('confirmation email sent')
      } else if (result.emails.confirmation === 'failed') {
        emailParts.push('confirmation email failed')
      }
      if (result.emails.onboardingInvite === 'sent') {
        emailParts.push('account setup invite sent')
      } else if (result.emails.onboardingInvite === 'failed') {
        emailParts.push('account setup invite failed')
      }

      const emailNote = emailParts.length > 0 ? ` (${emailParts.join(', ')})` : ''
      setSuccessMessage(`Manual order ${result.booking.orderCode || 'created'} added successfully${emailNote}`)
      setTimeout(() => setSuccessMessage(''), 5000)
      refetch()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to create manual order')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleAssignDriver = async (driverId: string) => {
    if (!bookingToAssign) return
    try {
      await assignDriverMutation.mutateAsync({
        bookingId: bookingToAssign,
        driverId,
      })
      setIsAssignDialogOpen(false)
      setBookingToAssign(null)
      setSuccessMessage('Driver assigned successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to assign driver')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleOfferJob = async () => {
    if (!bookingForOffer || selectedDrivers.length === 0) return
    try {
      await offerJobMutation.mutateAsync({
        id: bookingForOffer._id,
        driverIds: selectedDrivers,
        percentage: offerPercentage,
      })
      setIsOfferDialogOpen(false)
      setBookingForOffer(null)
      setSelectedDrivers([])
      setOfferPercentage(50)
      setSuccessMessage('Job offers sent to drivers successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      refetch()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to send job offers')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleAddNote = async () => {
    if (!bookingForOffer || !noteText.trim()) return
    try {
      await addNoteMutation.mutateAsync({
        id: bookingForOffer._id,
        text: noteText,
        type: noteType,
      })
      setNoteText('')
      setNoteType('general')
      setIsNotesDialogOpen(false)
      setBookingForOffer(null)
      setSuccessMessage('Note added successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      refetch()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to add note')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleRecordAdditionalWork = async () => {
    if (!bookingForOffer || additionalWorkAmount <= 0) return
    if (!additionalWorkDescription.trim()) {
      setErrorMessage('Please enter a note explaining the additional amount')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    try {
      await recordPaymentMutation.mutateAsync({
        id: bookingForOffer._id,
        amount: additionalWorkAmount,
        description: additionalWorkDescription.trim(),
      })
      setIsAdditionalWorkDialogOpen(false)
      setBookingForOffer(null)
      setAdditionalWorkAmount(0)
      setAdditionalWorkDescription('')
      setSuccessMessage('Additional work payment recorded successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      refetch()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to record payment')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const canOfferJob = (booking: any) =>
    ['pending', 'offered'].includes(booking.status) && !booking.driver

  const canReofferJob = (booking: any) =>
    !!booking.driver && ['confirmed', 'in-progress', 'job-started', 'offered'].includes(booking.status)

  const canAssignDriver = (booking: any) =>
    !['completed', 'cancelled'].includes(booking.status)

  const handleReofferJob = async (booking: any) => {
    const driverName =
      booking.driver && typeof booking.driver === 'object'
        ? booking.driver.name
        : 'the assigned driver'
    const confirmed = window.confirm(
      `Take this job back from ${driverName} and re-offer it to other drivers?`
    )
    if (!confirmed) return

    try {
      const result = await reclaimBookingMutation.mutateAsync({ id: booking._id })
      setBookingForOffer(result.booking)
      setSelectedDrivers([])
      setOfferPercentage(50)
      setIsOfferDialogOpen(true)
      setSuccessMessage('Job taken back. Select drivers to re-offer.')
      setTimeout(() => setSuccessMessage(''), 4000)
      refetch()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to take job back for re-offer')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Booking Management</h2>
            <p className="text-muted-foreground">Manage all bookings and assign drivers</p>
          </div>
          <Button onClick={handleOpenCreateDialog} className="w-fit shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Order
          </Button>
        </div>

        {successMessage && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>Search and filter bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:gap-4">
              <div className="flex-1 relative min-w-0 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or order code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="job-started">Job Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {data?.bookings?.map((booking: any) => {
                    const customer = typeof booking.customer === 'object' ? booking.customer : null
                    const driver = typeof booking.driver === 'object' ? booking.driver : null
                    const basePrice = booking.finalPrice || booking.estimatedPrice
                    const totalPrice = basePrice + (booking.additionalWorkPayment || 0)

                    return (
                      <Card key={booking._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1 space-y-3 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {customer?.name || 'Unknown Customer'}
                                </h3>
                                <StatusBadge status={booking.status} />
                                {booking.orderCode && (
                                  <Badge variant="outline">#{booking.orderCode}</Badge>
                                )}
                                {booking.isDisputed && (
                                  <Badge variant="destructive">Disputed</Badge>
                                )}
                                {booking.additionalWorkPayment ? (
                                  <Badge variant="secondary">
                                    +{formatCurrency(booking.additionalWorkPayment)} additional
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                  <p>
                                    <strong className="text-muted-foreground">Pickup:</strong>{' '}
                                    {booking.pickupAddress}, {booking.pickupCity}{' '}
                                    {booking.pickupZipCode}
                                  </p>
                                  <p>
                                    <strong className="text-muted-foreground">Delivery:</strong>{' '}
                                    {booking.deliveryAddress}, {booking.deliveryCity}{' '}
                                    {booking.deliveryZipCode}
                                  </p>
                                  <p>
                                    <strong className="text-muted-foreground">Date & Time:</strong>{' '}
                                    {formatDate(booking.pickupDate)} · {booking.pickupTime}
                                  </p>
                                  <p>
                                    <strong className="text-muted-foreground">Vans:</strong>{' '}
                                    {formatVanCountsLabel(booking.vanCounts) !== '—'
                                      ? formatVanCountsLabel(booking.vanCounts)
                                      : vehicleLabel(booking.vehicleType)}
                                  </p>
                                  <p>
                                    <strong className="text-muted-foreground">People:</strong>{' '}
                                    {formatPeopleSplit(booking.drivers, booking.helpers, booking.men)}
                                  </p>
                                  {(booking.collectionStairs || booking.deliveryStairs) && (
                                    <>
                                      <div className="border-t my-2" />
                                      {booking.collectionStairs && (
                                        <p>
                                          <strong className="text-muted-foreground">
                                            Pickup access:
                                          </strong>{' '}
                                          {formatStairsDisplay(booking.collectionStairs)}
                                        </p>
                                      )}
                                      {booking.deliveryStairs && (
                                        <p>
                                          <strong className="text-muted-foreground">
                                            Drop-off access:
                                          </strong>{' '}
                                          {formatStairsDisplay(booking.deliveryStairs)}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p>
                                    <strong className="text-muted-foreground">Contact:</strong>{' '}
                                    {booking.contactEmail} | {booking.contactPhone}
                                  </p>
                                  <p>
                                    <strong className="text-muted-foreground">Price:</strong>{' '}
                                    {formatCurrency(totalPrice)}{' '}
                                    {booking.additionalWorkPayment
                                      ? `(Base: ${formatCurrency(basePrice)})`
                                      : null}
                                  </p>
                                  {booking.additionalWorkPayment ? (
                                    <p>
                                      <strong className="text-muted-foreground">Additional:</strong>{' '}
                                      {formatCurrency(booking.additionalWorkPayment)}
                                      {booking.additionalWorkDescription
                                        ? ` — ${booking.additionalWorkDescription}`
                                        : null}
                                    </p>
                                  ) : null}
                                  {driver && (
                                    <>
                                      <div className="border-t my-2" />
                                      <p>
                                        <strong className="text-muted-foreground">Driver:</strong>{' '}
                                        {driver.name}
                                      </p>
                                      {driver.phone && (
                                        <p>
                                          <strong className="text-muted-foreground">
                                            Driver phone:
                                          </strong>{' '}
                                          {driver.phone}
                                        </p>
                                      )}
                                      {driver.vehicleRegistration && (
                                        <p>
                                          <strong className="text-muted-foreground">
                                            Vehicle number:
                                          </strong>{' '}
                                          {driver.vehicleRegistration}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {booking.driverOffers && booking.driverOffers.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Job Offers:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {booking.driverOffers.map((offer: any, idx: number) => (
                                          <div key={idx} className="flex items-center gap-1">
                                            <StatusBadge status={offer.status} kind="offer" />
                                            <span className="text-xs">
                                              {formatCurrency(offer.offeredPrice)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {booking.notes && booking.notes.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Notes ({booking.notes.length}):
                                  </p>
                                  <div className="space-y-1">
                                    {booking.notes.slice(-3).map((note: any, idx: number) => (
                                      <p key={idx} className="text-xs text-muted-foreground">
                                        <span className="font-medium">{note.type}:</span>{' '}
                                        {note.text.substring(0, 100)}
                                        {note.text.length > 100 ? '...' : ''}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 w-4/5 md:w-auto md:shrink-0">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleView(booking)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBookingToAssign(booking._id)
                                  setIsAssignDialogOpen(true)
                                }}
                                disabled={!canAssignDriver(booking)}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                {driver ? 'Change Driver' : 'Assign Driver'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBookingForOffer(booking)
                                  setIsOfferDialogOpen(true)
                                }}
                                disabled={!canOfferJob(booking)}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                Offer Job
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReofferJob(booking)}
                                disabled={!canReofferJob(booking) || reclaimBookingMutation.isLoading}
                              >
                                <RefreshCcw className="h-4 w-4 mr-1" />
                                Re-offer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBookingForOffer(booking)
                                  setIsNotesDialogOpen(true)
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Add Note
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBookingForOffer(booking)
                                  setIsAdditionalWorkDialogOpen(true)
                                }}
                              >
                                <PoundSterling className="h-4 w-4 mr-1" />
                                Add Work
                              </Button>
                              {booking.isDisputed && !booking.disputeResolved && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setBookingToDispute(booking)
                                    setIsDisputeDialogOpen(true)
                                  }}
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Dispute
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  sendReminderMutation.mutate({ id: booking._id, type: 'customer' })
                                }}
                                disabled={sendReminderMutation.isLoading}
                                title="Send email reminder to customer"
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Customer
                              </Button>
                              {driver && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    sendReminderMutation.mutate({ id: booking._id, type: 'driver' })
                                  }}
                                  disabled={sendReminderMutation.isLoading}
                                  title="Send email reminder to driver"
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Driver
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(booking)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteBooking(booking)}
                                disabled={deleteBookingMutation.isLoading}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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

        {/* Create Manual Order Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Manual Order</DialogTitle>
              <DialogDescription>
                Create a booking across general, pickup, stops, and drop-off details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <SectionShell title="General details" icon={<Package className="h-4 w-4 text-muted-foreground" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Order status</Label>
                    <Select
                      value={newManualOrder.status}
                      onValueChange={(value: 'pending' | 'survey') =>
                        setNewManualOrder({ ...newManualOrder, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newManualOrder.price || ''}
                      onChange={(e) =>
                        setNewManualOrder({
                          ...newManualOrder,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Customer name</Label>
                    <Input
                      value={newManualOrder.customer.name}
                      onChange={(e) =>
                        setNewManualOrder({
                          ...newManualOrder,
                          customer: { ...newManualOrder.customer, name: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Customer email</Label>
                    <Input
                      type="email"
                      value={newManualOrder.customer.email}
                      onChange={(e) =>
                        setNewManualOrder({
                          ...newManualOrder,
                          customer: { ...newManualOrder.customer, email: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Customer phone</Label>
                    <Input
                      value={newManualOrder.customer.phone}
                      onChange={(e) =>
                        setNewManualOrder({
                          ...newManualOrder,
                          customer: { ...newManualOrder.customer, phone: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Payment status</Label>
                    <Select
                      value={newManualOrder.paymentStatus}
                      onValueChange={(value: 'paid' | 'pending') =>
                        setNewManualOrder({ ...newManualOrder, paymentStatus: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newManualOrder.paymentStatus === 'paid' && (
                    <>
                      <div>
                        <Label>Payment method</Label>
                        <Select
                          value={newManualOrder.paymentMethod}
                          onValueChange={(value: 'bank-transfer' | 'cash' | 'card' | 'other') =>
                            setNewManualOrder({ ...newManualOrder, paymentMethod: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Payment reference</Label>
                        <Input
                          placeholder="Bank ref, receipt no..."
                          value={newManualOrder.paymentReference}
                          onChange={(e) =>
                            setNewManualOrder({
                              ...newManualOrder,
                              paymentReference: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label>Service type</Label>
                    <Select
                      value={newManualOrder.serviceType}
                      onValueChange={(value: 'local' | 'long-distance' | 'interstate') =>
                        setNewManualOrder({ ...newManualOrder, serviceType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="long-distance">Long Distance</SelectItem>
                        <SelectItem value="interstate">Interstate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Label>Vans by size</Label>
                      <span className="text-xs text-muted-foreground">
                        Total: {totalVans(newManualOrder.vanCounts)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {VAN_SIZE_FIELDS.map((field) => (
                        <div key={field.key}>
                          <Label className="text-xs">{field.label}</Label>
                          <ClearableNumberInput
                            min={0}
                            max={20}
                            value={newManualOrder.vanCounts[field.key]}
                            onValueChange={(n) =>
                              setNewManualOrder({
                                ...newManualOrder,
                                vanCounts: {
                                  ...newManualOrder.vanCounts,
                                  [field.key]: n,
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Drivers</Label>
                    <Input value={totalVans(newManualOrder.vanCounts)} disabled readOnly />
                    <p className="text-xs text-muted-foreground mt-1">Equals number of vans</p>
                  </div>
                  <div>
                    <Label>Helpers</Label>
                    <ClearableNumberInput
                      min={0}
                      max={20}
                      value={newManualOrder.helpers}
                      onValueChange={(n) =>
                        setNewManualOrder({
                          ...newManualOrder,
                          helpers: n,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2 rounded-lg border p-3">
                    <Label>Extras (hint only — total price above stays manual)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Dismantle (+£{DISMANTLE_PRICE_PER_ITEM})</Label>
                        <ClearableNumberInput
                          min={0}
                          value={newManualOrder.serviceExtras.dismantleItems}
                          onValueChange={(n) =>
                            setNewManualOrder({
                              ...newManualOrder,
                              serviceExtras: {
                                ...newManualOrder.serviceExtras,
                                dismantleItems: n,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Assembly (+£{ASSEMBLY_PRICE_PER_ITEM})</Label>
                        <ClearableNumberInput
                          min={0}
                          value={newManualOrder.serviceExtras.assemblyItems}
                          onValueChange={(n) =>
                            setNewManualOrder({
                              ...newManualOrder,
                              serviceExtras: {
                                ...newManualOrder.serviceExtras,
                                assemblyItems: n,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Packing boxes (+£{PACKING_PRICE_PER_5_BOXES}/5)</Label>
                        <Select
                          value={String(newManualOrder.serviceExtras.packingBoxes)}
                          onValueChange={(value) =>
                            setNewManualOrder({
                              ...newManualOrder,
                              serviceExtras: {
                                ...newManualOrder.serviceExtras,
                                packingBoxes: parseInt(value, 10) || 0,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PACKING_BOX_OPTIONS.map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n} boxes
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Suggested extras:{' '}
                      {formatCurrency(suggestedExtrasTotal(newManualOrder.serviceExtras))}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Special instructions</Label>
                  <Textarea
                    rows={3}
                    value={newManualOrder.specialInstructions}
                    onChange={(e) =>
                      setNewManualOrder({
                        ...newManualOrder,
                        specialInstructions: e.target.value,
                      })
                    }
                  />
                </div>
              </SectionShell>

              <SectionShell title="Pickup details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                <div>
                  <Label>Pickup address</Label>
                  <Input
                    value={newManualOrder.pickupAddress}
                    onChange={(e) =>
                      setNewManualOrder({ ...newManualOrder, pickupAddress: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Pickup city</Label>
                    <Input
                      value={newManualOrder.pickupCity}
                      onChange={(e) =>
                        setNewManualOrder({ ...newManualOrder, pickupCity: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Pickup postcode</Label>
                    <Input
                      value={newManualOrder.pickupZipCode}
                      onChange={(e) =>
                        setNewManualOrder({ ...newManualOrder, pickupZipCode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Pickup date</Label>
                    <Input
                      type="date"
                      value={newManualOrder.pickupDate}
                      onChange={(e) =>
                        setNewManualOrder({ ...newManualOrder, pickupDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Pickup time</Label>
                    <Select
                      value={newManualOrder.pickupTime || undefined}
                      onValueChange={(value) =>
                        setNewManualOrder({ ...newManualOrder, pickupTime: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup time" />
                      </SelectTrigger>
                      <SelectContent>
                        {PICKUP_TIME_OPTIONS.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pickup access</Label>
                    <Select
                      value={newManualOrder.pickupAccess}
                      onValueChange={(value: AccessType) =>
                        setNewManualOrder({ ...newManualOrder, pickupAccess: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ground">Ground floor</SelectItem>
                        <SelectItem value="lift">Lift</SelectItem>
                        <SelectItem value="stairs">Stairs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newManualOrder.pickupAccess === 'stairs' && (
                    <div>
                      <Label>Pickup stairs (flights)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={newManualOrder.pickupStairsCount}
                        onChange={(e) =>
                          setNewManualOrder({
                            ...newManualOrder,
                            pickupStairsCount: parseInt(e.target.value, 10) || 1,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </SectionShell>

              <SectionShell title="Intermediate stops" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                <div className="flex justify-end mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={newManualOrder.stops.length >= 3}
                    onClick={() =>
                      setNewManualOrder({
                        ...newManualOrder,
                        stops: [...newManualOrder.stops, emptyStop()],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add stop
                  </Button>
                </div>
                {newManualOrder.stops.length === 0 && (
                  <p className="text-sm text-muted-foreground">No intermediate stops</p>
                )}
                {newManualOrder.stops.map((stop, index) => (
                  <div key={index} className="space-y-3 rounded-md border bg-background p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Stop {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setNewManualOrder({
                            ...newManualOrder,
                            stops: newManualOrder.stops.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={stop.address}
                        onChange={(e) => {
                          const stops = [...newManualOrder.stops]
                          stops[index] = { ...stops[index], address: e.target.value }
                          setNewManualOrder({ ...newManualOrder, stops })
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>City</Label>
                        <Input
                          value={stop.city}
                          onChange={(e) => {
                            const stops = [...newManualOrder.stops]
                            stops[index] = { ...stops[index], city: e.target.value }
                            setNewManualOrder({ ...newManualOrder, stops })
                          }}
                        />
                      </div>
                      <div>
                        <Label>Postcode</Label>
                        <Input
                          value={stop.zipCode}
                          onChange={(e) => {
                            const stops = [...newManualOrder.stops]
                            stops[index] = { ...stops[index], zipCode: e.target.value }
                            setNewManualOrder({ ...newManualOrder, stops })
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Access</Label>
                        <Select
                          value={stop.access}
                          onValueChange={(value: AccessType) => {
                            const stops = [...newManualOrder.stops]
                            stops[index] = { ...stops[index], access: value }
                            setNewManualOrder({ ...newManualOrder, stops })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ground">Ground floor</SelectItem>
                            <SelectItem value="lift">Lift</SelectItem>
                            <SelectItem value="stairs">Stairs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {stop.access === 'stairs' && (
                        <div>
                          <Label>Stairs (flights)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={stop.stairsCount}
                            onChange={(e) => {
                              const stops = [...newManualOrder.stops]
                              stops[index] = {
                                ...stops[index],
                                stairsCount: parseInt(e.target.value, 10) || 1,
                              }
                              setNewManualOrder({ ...newManualOrder, stops })
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </SectionShell>

              <SectionShell title="Drop-off details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                <div>
                  <Label>Delivery address</Label>
                  <Input
                    value={newManualOrder.deliveryAddress}
                    onChange={(e) =>
                      setNewManualOrder({ ...newManualOrder, deliveryAddress: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Delivery city</Label>
                    <Input
                      value={newManualOrder.deliveryCity}
                      onChange={(e) =>
                        setNewManualOrder({ ...newManualOrder, deliveryCity: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Delivery postcode</Label>
                    <Input
                      value={newManualOrder.deliveryZipCode}
                      onChange={(e) =>
                        setNewManualOrder({ ...newManualOrder, deliveryZipCode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Delivery access</Label>
                    <Select
                      value={newManualOrder.deliveryAccess}
                      onValueChange={(value: AccessType) =>
                        setNewManualOrder({ ...newManualOrder, deliveryAccess: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ground">Ground floor</SelectItem>
                        <SelectItem value="lift">Lift</SelectItem>
                        <SelectItem value="stairs">Stairs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newManualOrder.deliveryAccess === 'stairs' && (
                    <div>
                      <Label>Delivery stairs (flights)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={newManualOrder.deliveryStairsCount}
                        onChange={(e) =>
                          setNewManualOrder({
                            ...newManualOrder,
                            deliveryStairsCount: parseInt(e.target.value, 10) || 1,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </SectionShell>
            </div>
            <div className="sticky bottom-0 z-10 -mx-6 border-t bg-background px-6 pt-3 pb-1 space-y-3">
              <div className="flex items-start gap-2 rounded-lg border bg-white p-3">
                <Checkbox
                  id="sendConfirmationEmail"
                  className="mt-0.5"
                  checked={newManualOrder.sendConfirmationEmail}
                  onCheckedChange={(checked) =>
                    setNewManualOrder({
                      ...newManualOrder,
                      sendConfirmationEmail: checked === true,
                    })
                  }
                />
                <Label htmlFor="sendConfirmationEmail" className="font-normal cursor-pointer leading-snug">
                  Send order confirmation email to customer
                </Label>
              </div>
              <DialogFooter className="sm:justify-between gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateManualOrder}
                  disabled={createBookingMutation.isLoading || !isManualOrderValid()}
                >
                  {createBookingMutation.isLoading ? 'Creating...' : 'Create Order'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open)
            if (!open) setViewingBooking(null)
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                Order details
                {viewingBooking?.orderCode && (
                  <Badge variant="outline">#{viewingBooking.orderCode}</Badge>
                )}
                {viewingBooking?.status && <StatusBadge status={viewingBooking.status} />}
              </DialogTitle>
              <DialogDescription>
                Full booking information across general, pickup, and drop-off details
              </DialogDescription>
            </DialogHeader>
            {viewingBooking && (
              <div className="space-y-4">
                <SectionShell title="General details" icon={<Package className="h-4 w-4 text-muted-foreground" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadField
                      label="Customer"
                      value={
                        typeof viewingBooking.customer === 'object'
                          ? viewingBooking.customer.name
                          : '—'
                      }
                    />
                    <ReadField label="Email" value={viewingBooking.contactEmail} />
                    <ReadField label="Phone" value={viewingBooking.contactPhone} />
                    <ReadField label="Service type" value={serviceLabel(viewingBooking.serviceType)} />
                    <ReadField
                      label="Vans"
                      value={formatVanCountsLabel(viewingBooking.vanCounts) !== '—'
                        ? formatVanCountsLabel(viewingBooking.vanCounts)
                        : vehicleLabel(viewingBooking.vehicleType)}
                    />
                    <ReadField
                      label="People"
                      value={formatPeopleSplit(
                        viewingBooking.drivers,
                        viewingBooking.helpers,
                        viewingBooking.men
                      )}
                    />
                    <ReadField
                      label="Extras"
                      value={formatServiceExtrasLabel(viewingBooking.serviceExtras)}
                    />
                    <ReadField
                      label="Price"
                      value={formatCurrency(
                        (viewingBooking.finalPrice || viewingBooking.estimatedPrice || 0) +
                          (viewingBooking.additionalWorkPayment || 0)
                      )}
                    />
                    <ReadField label="Payment status" value={viewingBooking.paymentStatus} />
                    <ReadField
                      label="Payment method"
                      value={paymentMethodLabel(viewingBooking.paymentMethod)}
                    />
                    <ReadField label="Payment reference" value={viewingBooking.paymentReference} />
                    <ReadField
                      label="Driver"
                      value={
                        typeof viewingBooking.driver === 'object'
                          ? viewingBooking.driver?.name
                          : undefined
                      }
                    />
                    <ReadField
                      label="Special instructions"
                      value={viewingBooking.specialInstructions}
                    />
                  </div>
                  {viewingBooking.additionalWorkPayment ? (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ReadField
                          label="Additional work"
                          value={formatCurrency(viewingBooking.additionalWorkPayment)}
                        />
                        <ReadField
                          label="Additional note"
                          value={viewingBooking.additionalWorkDescription}
                        />
                      </div>
                    </>
                  ) : null}
                </SectionShell>

                <SectionShell title="Pickup details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadField label="Address" value={viewingBooking.pickupAddress} />
                    <ReadField label="City" value={viewingBooking.pickupCity} />
                    <ReadField label="Postcode" value={viewingBooking.pickupZipCode} />
                    <ReadField label="Date" value={formatDate(viewingBooking.pickupDate)} />
                    <ReadField label="Time" value={viewingBooking.pickupTime} />
                    <ReadField
                      label="Access"
                      value={formatStairsDisplay(viewingBooking.collectionStairs)}
                    />
                  </div>
                </SectionShell>

                {Array.isArray(viewingBooking.stops) && viewingBooking.stops.length > 0 && (
                  <SectionShell title="Intermediate stops" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                    <div className="space-y-3">
                      {viewingBooking.stops.map((stop: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border bg-background p-3">
                          <ReadField label={`Stop ${index + 1} address`} value={stop.address} />
                          <ReadField label="City" value={stop.city} />
                          <ReadField label="Postcode" value={stop.zipCode} />
                          <ReadField
                            label="Access"
                            value={
                              stop.accessLabel
                                ? formatStairsDisplay(stop.accessLabel)
                                : stop.access || '—'
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </SectionShell>
                )}

                <SectionShell title="Drop-off details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadField label="Address" value={viewingBooking.deliveryAddress} />
                    <ReadField label="City" value={viewingBooking.deliveryCity} />
                    <ReadField label="Postcode" value={viewingBooking.deliveryZipCode} />
                    <ReadField
                      label="Access"
                      value={formatStairsDisplay(viewingBooking.deliveryStairs)}
                    />
                  </div>
                </SectionShell>

                {((viewingBooking.pickupPhotos && viewingBooking.pickupPhotos.length > 0) ||
                  (viewingBooking.dropoffPhotos && viewingBooking.dropoffPhotos.length > 0) ||
                  (viewingBooking.completionPictures &&
                    viewingBooking.completionPictures.length > 0)) && (
                  <SectionShell title="Job photos">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {viewingBooking.pickupPhotos && viewingBooking.pickupPhotos.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Pickup</p>
                          <div className="grid grid-cols-3 gap-2">
                            {viewingBooking.pickupPhotos.map((pic: string, index: number) => (
                              <img
                                key={`view-pickup-${index}`}
                                src={pic}
                                alt={`Pickup ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {((viewingBooking.dropoffPhotos &&
                        viewingBooking.dropoffPhotos.length > 0) ||
                        (viewingBooking.completionPictures &&
                          viewingBooking.completionPictures.length > 0)) && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Drop-off</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(viewingBooking.dropoffPhotos?.length
                              ? viewingBooking.dropoffPhotos
                              : viewingBooking.completionPictures || []
                            ).map((pic: string, index: number) => (
                              <img
                                key={`view-dropoff-${index}`}
                                src={pic}
                                alt={`Drop-off ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {viewingBooking.driverNotes && (
                      <p className="text-sm mt-3">
                        <span className="text-muted-foreground">Driver notes: </span>
                        {viewingBooking.driverNotes}
                      </p>
                    )}
                  </SectionShell>
                )}

                {viewingBooking.notes?.length > 0 && (
                  <SectionShell title="Notes">
                    <div className="space-y-2">
                      {viewingBooking.notes.map((note: any, idx: number) => (
                        <div key={idx} className="rounded-lg border bg-background p-3 text-sm">
                          <p className="text-xs text-muted-foreground mb-1 capitalize">
                            {note.type || 'general'}
                            {note.createdAt ? ` · ${formatDate(note.createdAt)}` : ''}
                          </p>
                          <p>{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </SectionShell>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (!viewingBooking) return
                  setIsViewDialogOpen(false)
                  handleEdit(viewingBooking)
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setEditError('')
              setEditingBooking(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Update general, pickup, and drop-off details
              </DialogDescription>
            </DialogHeader>
            {editingBooking && (
              <div className="space-y-4">
                <SectionShell title="General details" icon={<Package className="h-4 w-4 text-muted-foreground" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={editingBooking.status}
                        onValueChange={(value) =>
                          setEditingBooking({ ...editingBooking, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="survey">Survey</SelectItem>
                          <SelectItem value="offered">Offered</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="job-started">Job Started</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="disputed">Disputed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Price (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingBooking.finalPrice ?? ''}
                        onChange={(e) =>
                          setEditingBooking({
                            ...editingBooking,
                            finalPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Contact name</Label>
                      <Input
                        value={
                          typeof editingBooking.customer === 'object'
                            ? editingBooking.customer?.name || ''
                            : ''
                        }
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Contact email</Label>
                      <Input
                        type="email"
                        value={editingBooking.contactEmail || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, contactEmail: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Contact phone</Label>
                      <Input
                        value={editingBooking.contactPhone || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, contactPhone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Payment status</Label>
                      <Select
                        value={editingBooking.paymentStatus}
                        onValueChange={(value: 'paid' | 'pending') =>
                          setEditingBooking({ ...editingBooking, paymentStatus: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingBooking.paymentStatus === 'paid' && (
                      <>
                        <div>
                          <Label>Payment method</Label>
                          <Select
                            value={editingBooking.paymentMethod || 'bank-transfer'}
                            onValueChange={(value) =>
                              setEditingBooking({ ...editingBooking, paymentMethod: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Payment reference</Label>
                          <Input
                            value={editingBooking.paymentReference || ''}
                            onChange={(e) =>
                              setEditingBooking({
                                ...editingBooking,
                                paymentReference: e.target.value,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label>Service type</Label>
                      <Select
                        value={editingBooking.serviceType}
                        onValueChange={(value) =>
                          setEditingBooking({ ...editingBooking, serviceType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="long-distance">Long Distance</SelectItem>
                          <SelectItem value="interstate">Interstate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <Label>Vans by size</Label>
                        <span className="text-xs text-muted-foreground">
                          Total: {totalVans(editingBooking.vanCounts || emptyVanCounts())}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {VAN_SIZE_FIELDS.map((field) => (
                          <div key={field.key}>
                            <Label className="text-xs">{field.label}</Label>
                            <ClearableNumberInput
                              min={0}
                              max={20}
                              value={editingBooking.vanCounts?.[field.key] ?? 0}
                              onValueChange={(n) => {
                                const vanCounts = {
                                  ...(editingBooking.vanCounts || emptyVanCounts()),
                                  [field.key]: n,
                                }
                                setEditingBooking({
                                  ...editingBooking,
                                  vanCounts,
                                  drivers: totalVans(vanCounts),
                                })
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Drivers</Label>
                      <Input
                        value={totalVans(editingBooking.vanCounts || emptyVanCounts())}
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <Label>Helpers</Label>
                      <ClearableNumberInput
                        min={0}
                        max={20}
                        value={editingBooking.helpers ?? 0}
                        onValueChange={(n) =>
                          setEditingBooking({
                            ...editingBooking,
                            helpers: n,
                          })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2 rounded-lg border p-3">
                      <Label>Extras (hint only — total price above stays manual)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Dismantle (+£{DISMANTLE_PRICE_PER_ITEM})</Label>
                          <ClearableNumberInput
                            min={0}
                            value={editingBooking.serviceExtras?.dismantleItems ?? 0}
                            onValueChange={(n) =>
                              setEditingBooking({
                                ...editingBooking,
                                serviceExtras: {
                                  ...(editingBooking.serviceExtras || emptyServiceExtras()),
                                  dismantleItems: n,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Assembly (+£{ASSEMBLY_PRICE_PER_ITEM})</Label>
                          <ClearableNumberInput
                            min={0}
                            value={editingBooking.serviceExtras?.assemblyItems ?? 0}
                            onValueChange={(n) =>
                              setEditingBooking({
                                ...editingBooking,
                                serviceExtras: {
                                  ...(editingBooking.serviceExtras || emptyServiceExtras()),
                                  assemblyItems: n,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Packing boxes (+£{PACKING_PRICE_PER_5_BOXES}/5)</Label>
                          <Select
                            value={String(editingBooking.serviceExtras?.packingBoxes ?? 0)}
                            onValueChange={(value) =>
                              setEditingBooking({
                                ...editingBooking,
                                serviceExtras: {
                                  ...(editingBooking.serviceExtras || emptyServiceExtras()),
                                  packingBoxes: parseInt(value, 10) || 0,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PACKING_BOX_OPTIONS.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n} boxes
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Suggested extras:{' '}
                        {formatCurrency(
                          suggestedExtrasTotal(editingBooking.serviceExtras || emptyServiceExtras())
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Special instructions</Label>
                    <Textarea
                      rows={3}
                      value={editingBooking.specialInstructions || ''}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          specialInstructions: e.target.value,
                        })
                      }
                    />
                  </div>
                </SectionShell>

                <SectionShell title="Pickup details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                  <div>
                    <Label>Pickup address</Label>
                    <Input
                      value={editingBooking.pickupAddress || ''}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, pickupAddress: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Pickup city</Label>
                      <Input
                        value={editingBooking.pickupCity || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, pickupCity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Pickup postcode</Label>
                      <Input
                        value={editingBooking.pickupZipCode || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, pickupZipCode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Pickup date</Label>
                      <Input
                        type="date"
                        value={editingBooking.pickupDate || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, pickupDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Pickup time</Label>
                      <Select
                        value={
                          (PICKUP_TIME_OPTIONS as readonly string[]).includes(
                            editingBooking.pickupTime
                          )
                            ? editingBooking.pickupTime
                            : undefined
                        }
                        onValueChange={(value) =>
                          setEditingBooking({ ...editingBooking, pickupTime: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={editingBooking.pickupTime || 'Select pickup time'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {PICKUP_TIME_OPTIONS.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pickup access</Label>
                      <Select
                        value={editingBooking.pickupAccess || 'ground'}
                        onValueChange={(value: AccessType) =>
                          setEditingBooking({ ...editingBooking, pickupAccess: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ground">Ground floor</SelectItem>
                          <SelectItem value="lift">Lift</SelectItem>
                          <SelectItem value="stairs">Stairs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingBooking.pickupAccess === 'stairs' && (
                      <div>
                        <Label>Pickup stairs (flights)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={editingBooking.pickupStairsCount || 1}
                          onChange={(e) =>
                            setEditingBooking({
                              ...editingBooking,
                              pickupStairsCount: parseInt(e.target.value, 10) || 1,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </SectionShell>

                <SectionShell title="Intermediate stops" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                  <div className="flex justify-end mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={(editingBooking.stops || []).length >= 3}
                      onClick={() =>
                        setEditingBooking({
                          ...editingBooking,
                          stops: [...(editingBooking.stops || []), emptyStop()],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add stop
                    </Button>
                  </div>
                  {(editingBooking.stops || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No intermediate stops</p>
                  )}
                  {(editingBooking.stops || []).map((stop: BookingStopForm, index: number) => (
                    <div key={index} className="space-y-3 rounded-md border bg-background p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Stop {index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingBooking({
                              ...editingBooking,
                              stops: (editingBooking.stops || []).filter(
                                (_: BookingStopForm, i: number) => i !== index
                              ),
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={stop.address}
                          onChange={(e) => {
                            const stops = [...(editingBooking.stops || [])]
                            stops[index] = { ...stops[index], address: e.target.value }
                            setEditingBooking({ ...editingBooking, stops })
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={stop.city}
                            onChange={(e) => {
                              const stops = [...(editingBooking.stops || [])]
                              stops[index] = { ...stops[index], city: e.target.value }
                              setEditingBooking({ ...editingBooking, stops })
                            }}
                          />
                        </div>
                        <div>
                          <Label>Postcode</Label>
                          <Input
                            value={stop.zipCode}
                            onChange={(e) => {
                              const stops = [...(editingBooking.stops || [])]
                              stops[index] = { ...stops[index], zipCode: e.target.value }
                              setEditingBooking({ ...editingBooking, stops })
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Access</Label>
                          <Select
                            value={stop.access}
                            onValueChange={(value: AccessType) => {
                              const stops = [...(editingBooking.stops || [])]
                              stops[index] = { ...stops[index], access: value }
                              setEditingBooking({ ...editingBooking, stops })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ground">Ground floor</SelectItem>
                              <SelectItem value="lift">Lift</SelectItem>
                              <SelectItem value="stairs">Stairs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {stop.access === 'stairs' && (
                          <div>
                            <Label>Stairs (flights)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              value={stop.stairsCount}
                              onChange={(e) => {
                                const stops = [...(editingBooking.stops || [])]
                                stops[index] = {
                                  ...stops[index],
                                  stairsCount: parseInt(e.target.value, 10) || 1,
                                }
                                setEditingBooking({ ...editingBooking, stops })
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </SectionShell>

                <SectionShell title="Drop-off details" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                  <div>
                    <Label>Delivery address</Label>
                    <Input
                      value={editingBooking.deliveryAddress || ''}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, deliveryAddress: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Delivery city</Label>
                      <Input
                        value={editingBooking.deliveryCity || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, deliveryCity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Delivery postcode</Label>
                      <Input
                        value={editingBooking.deliveryZipCode || ''}
                        onChange={(e) =>
                          setEditingBooking({ ...editingBooking, deliveryZipCode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Delivery access</Label>
                      <Select
                        value={editingBooking.deliveryAccess || 'ground'}
                        onValueChange={(value: AccessType) =>
                          setEditingBooking({ ...editingBooking, deliveryAccess: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ground">Ground floor</SelectItem>
                          <SelectItem value="lift">Lift</SelectItem>
                          <SelectItem value="stairs">Stairs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingBooking.deliveryAccess === 'stairs' && (
                      <div>
                        <Label>Delivery stairs (flights)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={editingBooking.deliveryStairsCount || 1}
                          onChange={(e) =>
                            setEditingBooking({
                              ...editingBooking,
                              deliveryStairsCount: parseInt(e.target.value, 10) || 1,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </SectionShell>
              </div>
            )}
            <div className="sticky bottom-0 z-10 -mx-6 border-t bg-background px-6 pt-3 pb-1 space-y-3">
              {editingBooking && (
                <div className="flex items-start gap-2 rounded-lg border bg-white p-3">
                  <Checkbox
                    id="editSendConfirmationEmail"
                    className="mt-0.5"
                    checked={editingBooking.sendConfirmationEmail === true}
                    onCheckedChange={(checked) =>
                      setEditingBooking({
                        ...editingBooking,
                        sendConfirmationEmail: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="editSendConfirmationEmail"
                    className="font-normal cursor-pointer leading-snug"
                  >
                    Send order confirmation email to customer
                  </Label>
                </div>
              )}
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Could not save</AlertTitle>
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <DialogFooter className="sm:justify-between gap-2">
                <Button
                  variant="destructive"
                  onClick={() => editingBooking && handleDeleteBooking(editingBooking)}
                  disabled={!editingBooking || deleteBookingMutation.isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteBookingMutation.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={updateBookingMutation.isLoading}>
                    {updateBookingMutation.isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Driver Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
              <DialogDescription>Select a driver for this booking</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Driver</Label>
                <Select onValueChange={handleAssignDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversData?.drivers?.map((driver: any) => (
                      <SelectItem key={driver._id} value={driver._id}>
                        {driver.name} ({driver.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Offer Job to Drivers Dialog */}
        <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Offer Job to Drivers</DialogTitle>
              <DialogDescription>
                {bookingForOffer && (
                  <span>
                    Base Price: {formatCurrency(bookingForOffer.finalPrice || bookingForOffer.estimatedPrice)}
                    {bookingForOffer.status === 'pending' ? ' · Ready to re-offer' : ''}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={offerPercentage}
                  onChange={(e) => setOfferPercentage(parseInt(e.target.value))}
                />
                {bookingForOffer && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Each driver will receive: {formatCurrency(((bookingForOffer.finalPrice || bookingForOffer.estimatedPrice) * offerPercentage) / 100)}
                  </p>
                )}
              </div>
              <div>
                <Label>Select Drivers</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto border rounded p-2">
                  {driversData?.drivers?.map((driver: any) => (
                    <div key={driver._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={driver._id}
                        checked={selectedDrivers.includes(driver._id)}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedDrivers([...selectedDrivers, driver._id])
                          } else {
                            setSelectedDrivers(selectedDrivers.filter(id => id !== driver._id))
                          }
                        }}
                      />
                      <Label htmlFor={driver._id} className="cursor-pointer">
                        {driver.name} ({driver.email})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsOfferDialogOpen(false)
                setSelectedDrivers([])
                setOfferPercentage(50)
              }}>
                Cancel
              </Button>
              <Button onClick={handleOfferJob} disabled={selectedDrivers.length === 0 || offerJobMutation.isLoading}>
                {offerJobMutation.isLoading ? 'Sending...' : 'Send Offers'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>Add a note to this booking</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Note Type</Label>
                <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Note</Label>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter note details..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsNotesDialogOpen(false)
                setNoteText('')
                setNoteType('general')
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!noteText.trim() || addNoteMutation.isLoading}>
                {addNoteMutation.isLoading ? 'Adding...' : 'Add Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Additional Work Payment Dialog */}
        <Dialog open={isAdditionalWorkDialogOpen} onOpenChange={setIsAdditionalWorkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Additional Work Payment</DialogTitle>
              <DialogDescription>
                Add an extra amount with a note explaining why (shown on the booking card and details).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalWorkAmount || ''}
                  onChange={(e) => setAdditionalWorkAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Note *</Label>
                <Textarea
                  value={additionalWorkDescription}
                  onChange={(e) => setAdditionalWorkDescription(e.target.value)}
                  placeholder="e.g. Extra flight of stairs, waiting time, additional boxes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAdditionalWorkDialogOpen(false)
                setAdditionalWorkAmount(0)
                setAdditionalWorkDescription('')
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleRecordAdditionalWork}
                disabled={
                  additionalWorkAmount <= 0 ||
                  !additionalWorkDescription.trim() ||
                  recordPaymentMutation.isLoading
                }
              >
                {recordPaymentMutation.isLoading ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Handle Dispute Dialog */}
        <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Handle Dispute</DialogTitle>
              <DialogDescription>
                {bookingToDispute && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Dispute Reason:</p>
                    <p className="text-sm text-muted-foreground">{bookingToDispute.disputeReason}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resolution Status</Label>
                <Select
                  onValueChange={(value) => {
                    if (bookingToDispute) {
                      handleDisputeMutation.mutate({
                        id: bookingToDispute._id,
                        data: {
                          resolved: value === 'resolved',
                          status: value === 'resolved' ? 'completed' : undefined,
                        },
                      })
                      setIsDisputeDialogOpen(false)
                      setBookingToDispute(null)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolved">Mark as Resolved</SelectItem>
                    <SelectItem value="pending">Keep as Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDisputeDialogOpen(false)
                setBookingToDispute(null)
              }}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default BookingsPage
