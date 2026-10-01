import { apiClient } from './client'

export interface AdminStats {
  users: {
    total: number
    admins?: number
    drivers: number
    customers: number
  }
  bookings: {
    total: number
    pending: number
    offered?: number
    confirmed: number
    inProgress: number
    completed: number
    disputed: number
    cancelled?: number
    activeAssigned?: number
  }
  revenue: {
    total: number
    totalSpent: number
    pipeline?: number
  }
  recentTransactions?: {
    _id: string
    orderCode?: string
    customerName?: string
    pickupCity?: string
    deliveryCity?: string
    serviceType?: string
    amount: number
    completedAt?: string
    paymentStatus?: string
  }[]
}

export interface AdminNotification {
  _id: string
  type: 'offer_accepted' | 'offer_rejected' | 'driver_application' | 'job_cancelled_by_driver' | 'general'
  title: string
  message: string
  booking?: string | Booking
  driver?: User | string
  driverName?: string
  jobId?: string
  jobName?: string
  orderCode?: string
  offeredPrice?: number
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  _id: string
  email: string
  name: string
  role: 'customer' | 'driver' | 'admin'
  phone?: string
  username?: string
  address?: string
  businessName?: string
  bankDetails?: {
    accountName?: string
    accountNumber?: string
    sortCode?: string
    bankName?: string
    bankStatement?: string
  }
  notes?: {
    text: string
    createdBy: User | string
    createdAt: string
    type?: 'call' | 'issue' | 'general'
  }[]
  isActive: boolean
  applicationStatus?: 'pending' | 'approved' | 'rejected'
  passwordSetupPending?: boolean
  bookingStats?: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
  applicationSubmittedAt?: string
  applicationReviewedAt?: string
  applicationReviewNote?: string
  introductionVideoUrl?: string
  drivingLicence?: string
  goodsInTransitInsurance?: string
  publicLiability?: string
  proofOfAddress?: string
  vehicleRegistration?: string
  vehicleCategory?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleSeats?: number
  vehiclePhoto?: string
  vehicleBaseLocation?: string
  vehicleType?: string
  vehicleFuelType?: string
  vehicleRegistrationDocumentType?: string
  vehicleRegistrationDocument?: string
  vehicleTotalPayload?: { value?: number; unit?: string }
  vehicleLoadingCapacity?: { value?: number; unit?: string }
  vehicleMaxLength?: { value?: number; unit?: string }
  vehiclePayload?: { value?: number; unit?: string }
  vehicleMotorbikeCapacity?: number
  vehicleTailLift?: boolean
  vehicleTrailer?: boolean
  createdAt: string
  updatedAt: string
}

export interface DriverNoteEntry {
  text: string
  createdAt: string
  createdBy?: User | string
}

export interface BookingWaiver {
  signatureUrl: string
  signedAt: string
  lat?: number
  lng?: number
  signedByName?: string
}

export interface Withdrawal {
  _id: string
  driver: User | string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  note?: string
  adminNote?: string
  processedBy?: User | string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  _id: string
  customer: User | string
  driver?: User | string
  status: 'pending' | 'offered' | 'confirmed' | 'in-progress' | 'job-started' | 'completed' | 'cancelled' | 'disputed' | 'survey'
  pickupHouseNumber?: string
  pickupHouseName?: string
  pickupStreet?: string
  pickupAddress: string
  pickupCity: string
  pickupState?: string
  pickupZipCode: string
  pickupDate: string
  pickupTime: string
  deliveryHouseNumber?: string
  deliveryHouseName?: string
  deliveryStreet?: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState?: string
  deliveryZipCode: string
  serviceType: 'local' | 'long-distance' | 'interstate'
  vehicleType: 'small' | 'medium' | 'large' | 'luton' | 'multi-van' | 'small-van' | 'medium-van' | 'large-van' | 'truck'
  vehicleName?: string
  vansLabel?: string
  vanCounts?: {
    small: number
    medium: number
    large: number
    luton: number
  }
  vans?: number
  drivers?: number
  helpers?: number
  hours?: number
  surveyType?: 'home' | 'video'
  stops?: {
    houseNumber?: string
    houseName?: string
    address: string
    city: string
    zipCode: string
    access?: 'lift' | 'stairs' | 'ground'
    stairsCount?: number
    accessLabel?: string
  }[]
  serviceExtras?: {
    dismantleItems: number
    assemblyItems: number
    packingBoxes: number
  }
  estimatedPrice: number
  finalPrice?: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentMethod?: string | null
  paymentReference?: string | null
  amountPaid?: number
  discountApplied?: boolean
  discountCode?: string
  discountPercent?: number
  orderCode?: string
  externalOrderCode?: string
  paypalInvoiceId?: string
  paypalInvoiceUrl?: string
  invoiceSentAt?: string
  miles?: number
  durationRequired?: string
  collectionStairs?: string
  deliveryStairs?: string
  helpersLabel?: string
  helpersRateTier?: number
  vanSize?: string
  manRequired?: string
  men?: number
  specialInstructions?: string
  contactEmail?: string
  contactPhone?: string
  completionPictures?: string[]
  pickupPhotos?: string[]
  dropoffPhotos?: string[]
  driverNotes?: string
  driverNoteEntries?: DriverNoteEntry[]
  detailsConfirmedAt?: string
  detailsConfirmedBy?: User | string
  feedbackCalledAt?: string
  feedbackCalledBy?: User | string
  jobStartedAt?: string
  jobStartLat?: number
  jobStartLng?: number
  jobEndedAt?: string
  jobEndLat?: number
  jobEndLng?: number
  waiver?: BookingWaiver
  additionalWorkPayment?: number
  additionalWorkDescription?: string
  notes?: {
    text: string
    createdBy: User | string
    createdAt: string
    type?: 'call' | 'issue' | 'general'
  }[]
  offeredToDrivers?: (User | string)[]
  driverOffers?: {
    driver: User | string
    offeredPrice: number
    status: 'pending' | 'accepted' | 'rejected' | 'superseded' | 'expired'
    offeredAt: string
    respondedAt?: string
  }[]
  offerExpiresAt?: string
  isDisputed?: boolean
  disputeReason?: string
  disputeResolved?: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  users?: T[]
  bookings?: T[]
  drivers?: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const adminApi = {
  // Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats')
    return response.data
  },

  // Users
  getAllUsers: async (params?: {
    role?: string
    page?: number
    limit?: number
    search?: string
    applicationStatus?: string
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data
  },

  updateUser: async (id: string, data: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await apiClient.put(`/admin/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/users/${id}`)
    return response.data
  },

  createUser: async (data: {
    name: string
    email: string
    role: 'admin' | 'driver' | 'customer'
    phone?: string
    sendInvite?: boolean
  }): Promise<{ message: string; user: User; inviteStatus?: string }> => {
    const response = await apiClient.post('/admin/users', data)
    return response.data
  },

  approveDriverApplication: async (id: string): Promise<{ message: string; inviteStatus: string }> => {
    const response = await apiClient.post(`/admin/users/${id}/approve-application`)
    return response.data
  },

  rejectDriverApplication: async (
    id: string,
    note?: string
  ): Promise<{ message: string; emailStatus: string }> => {
    const response = await apiClient.post(`/admin/users/${id}/reject-application`, { note })
    return response.data
  },

  resendDriverApprovalInvite: async (
    id: string
  ): Promise<{ message: string; inviteStatus: string }> => {
    const response = await apiClient.post(`/admin/users/${id}/resend-approval-invite`)
    return response.data
  },

  resendCustomerInvite: async (
    id: string
  ): Promise<{ message: string; inviteStatus: string }> => {
    const response = await apiClient.post(`/admin/users/${id}/resend-invite`)
    return response.data
  },

  // Drivers
  getAllDrivers: async (params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedResponse<User & { stats: { totalJobs: number; completedJobs: number; activeJobs: number } }>> => {
    const response = await apiClient.get('/admin/drivers', { params })
    return response.data
  },

  // Bookings
  getAllBookings: async (params?: {
    status?: string
    page?: number
    limit?: number
    search?: string
    pickupDate?: string
    pickupDateFrom?: string
    pickupDateTo?: string
  }): Promise<PaginatedResponse<Booking>> => {
    const response = await apiClient.get('/admin/bookings', { params })
    return response.data
  },

  getBookingsCalendar: async (
    from: string,
    to: string
  ): Promise<{ bookings: Booking[] }> => {
    const response = await apiClient.get('/admin/bookings/calendar', {
      params: { from, to },
    })
    return response.data
  },

  updateBooking: async (
    id: string,
    data: Partial<Booking> & Record<string, unknown>
  ): Promise<{ message: string; booking: Booking; emails?: { confirmation: string } }> => {
    const response = await apiClient.put(`/admin/bookings/${id}`, data)
    return response.data
  },

  deleteBooking: async (id: string): Promise<{ message: string; bookingId: string }> => {
    const response = await apiClient.delete(`/admin/bookings/${id}`)
    return response.data
  },

  createBooking: async (data: {
    customer: { name: string; email: string; phone: string }
    pickupHouseNumber?: string
    pickupHouseName?: string
    pickupAddress: string
    pickupCity: string
    pickupZipCode: string
    pickupDate: string
    pickupTime: string
    deliveryHouseNumber?: string
    deliveryHouseName?: string
    deliveryAddress: string
    deliveryCity: string
    deliveryZipCode: string
    serviceType: 'local' | 'long-distance' | 'interstate'
    vehicleType?: 'small' | 'medium' | 'large' | 'luton' | 'multi-van' | 'small-van' | 'medium-van' | 'large-van' | 'truck'
    vanCounts?: {
      small: number
      medium: number
      large: number
      luton: number
    }
    helpers?: number
    drivers?: number
    hours?: number
    stops?: {
      houseNumber?: string
      houseName?: string
      address: string
      city: string
      zipCode: string
      access?: 'lift' | 'stairs' | 'ground'
      stairsCount?: number
    }[]
    serviceExtras?: {
      dismantleItems: number
      assemblyItems: number
      packingBoxes: number
    }
    price: number
    paymentStatus: 'paid' | 'pending'
    paymentMethod?: 'bank-transfer' | 'cash' | 'card' | 'other'
    paymentReference?: string
    specialInstructions?: string
    sendConfirmationEmail?: boolean
    sendPaymentLink?: boolean
    pickupAccess?: 'lift' | 'stairs' | 'ground'
    pickupStairsCount?: number
    deliveryAccess?: 'lift' | 'stairs' | 'ground'
    deliveryStairsCount?: number
    men?: number
    status?: 'pending' | 'survey'
    surveyType?: 'home' | 'video'
  }): Promise<{
    message: string
    booking: Booking
    customerStatus: 'existing' | 'created'
    emails: {
      confirmation: 'sent' | 'failed' | 'skipped'
      onboardingInvite: 'sent' | 'failed' | 'not_required'
    }
  }> => {
    const response = await apiClient.post('/admin/bookings', data)
    return response.data
  },

  assignDriver: async (id: string, driverId: string): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/assign-driver`, { driverId })
    return response.data
  },

  reclaimBooking: async (id: string, note?: string): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/reclaim`, { note })
    return response.data
  },

  handleDispute: async (id: string, data: { resolved: boolean; status?: string }): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/handle-dispute`, data)
    return response.data
  },

  sendEmailReminder: async (id: string, type: 'customer' | 'driver'): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/send-reminder`, { type })
    return response.data
  },

  sendInvoiceLink: async (
    id: string
  ): Promise<{ message: string; booking: Booking; invoiceUrl?: string }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/send-invoice`)
    return response.data
  },

  offerJobToDrivers: async (id: string, driverIds: string[], percentage: number): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/offer-to-drivers`, { driverIds, percentage })
    return response.data
  },

  addBookingNote: async (id: string, text: string, type?: 'call' | 'issue' | 'general'): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/notes`, { text, type })
    return response.data
  },

  recordAdditionalWorkPayment: async (id: string, amount: number, description?: string): Promise<{ message: string; booking: Booking }> => {
    const response = await apiClient.post(`/admin/bookings/${id}/additional-work-payment`, { amount, description })
    return response.data
  },

  addUserNote: async (id: string, text: string, type?: 'call' | 'issue' | 'general'): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post(`/admin/users/${id}/notes`, { text, type })
    return response.data
  },

  getNotifications: async (params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }): Promise<{
    notifications: AdminNotification[]
    unreadCount: number
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> => {
    const response = await apiClient.get('/admin/notifications', {
      params: {
        page: params?.page,
        limit: params?.limit,
        unreadOnly: params?.unreadOnly ? 'true' : undefined,
      },
    })
    return response.data
  },

  markNotificationRead: async (id: string): Promise<{ message: string; notification: AdminNotification }> => {
    const response = await apiClient.post(`/admin/notifications/${id}/read`)
    return response.data
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/admin/notifications/read-all')
    return response.data
  },

  listWithdrawals: async (params?: {
    status?: string
  }): Promise<{ withdrawals: Withdrawal[] }> => {
    const response = await apiClient.get('/admin/withdrawals', { params })
    return response.data
  },

  processWithdrawal: async (
    id: string,
    data: { status: 'approved' | 'rejected' | 'paid'; adminNote?: string }
  ): Promise<{ message: string; withdrawal: Withdrawal }> => {
    const response = await apiClient.post(`/admin/withdrawals/${id}/process`, data)
    return response.data
  },
}

