import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Truck,
  Package,
  Wrench,
  FileText,
} from 'lucide-react'
import { useDriverVehicleById, useUpdateVehicleById, useCreateVehicle } from '@/hooks/useDriver'
import { FileUpload } from '@/components/ui/file-upload'
import { VehicleInfo } from '@/api/driver'
import { SectionShell } from '@/components/booking/SectionShell'

const emptyForm = () => ({
  vehicleRegistration: '',
  vehicleCategory: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleSeats: '1',
  vehicleBaseLocation: '',
  vehicleRegistrationDocumentType: '',
  vehicleRegistrationDocument: '',
  vehiclePhoto: '',
  vehicleType: '',
  vehicleTotalPayload: { value: '', unit: 'kg' },
  vehicleLoadingCapacity: { value: '', unit: 'm³' },
  vehicleMaxLength: { value: '', unit: 'm' },
  vehicleMotorbikeCapacity: '0',
  vehicleTailLift: 'no',
  vehicleTrailer: 'no',
  vehiclePayload: { value: '', unit: 'kg' },
  vehicleFuelType: 'petrol',
})

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const { data: vehicleData, isLoading: isLoadingVehicle } = useDriverVehicleById(id || '', {
    enabled: !isNew && !!id && id !== 'new',
  })
  const updateVehicleMutation = useUpdateVehicleById()
  const createVehicleMutation = useCreateVehicle()

  const vehicle = vehicleData?.vehicle
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    if (vehicle && !isNew && id && id !== 'new') {
      setFormData({
        vehicleRegistration: vehicle.vehicleRegistration || '',
        vehicleCategory: vehicle.vehicleCategory || '',
        vehicleMake: vehicle.vehicleMake || '',
        vehicleModel: vehicle.vehicleModel || '',
        vehicleSeats: vehicle.vehicleSeats?.toString() || '1',
        vehicleBaseLocation: vehicle.vehicleBaseLocation || '',
        vehicleRegistrationDocumentType: vehicle.vehicleRegistrationDocumentType || '',
        vehicleRegistrationDocument: vehicle.vehicleRegistrationDocument || '',
        vehiclePhoto: vehicle.vehiclePhoto || '',
        vehicleType: vehicle.vehicleType || '',
        vehicleTotalPayload: {
          value: vehicle.vehicleTotalPayload?.value?.toString() || '',
          unit: vehicle.vehicleTotalPayload?.unit || 'kg',
        },
        vehicleLoadingCapacity: {
          value: vehicle.vehicleLoadingCapacity?.value?.toString() || '',
          unit: vehicle.vehicleLoadingCapacity?.unit || 'm³',
        },
        vehicleMaxLength: {
          value: vehicle.vehicleMaxLength?.value?.toString() || '',
          unit: vehicle.vehicleMaxLength?.unit || 'm',
        },
        vehicleMotorbikeCapacity: vehicle.vehicleMotorbikeCapacity?.toString() || '0',
        vehicleTailLift: vehicle.vehicleTailLift ? 'yes' : 'no',
        vehicleTrailer: vehicle.vehicleTrailer ? 'yes' : 'no',
        vehiclePayload: {
          value: vehicle.vehiclePayload?.value?.toString() || '',
          unit: vehicle.vehiclePayload?.unit || 'kg',
        },
        vehicleFuelType: vehicle.vehicleFuelType || 'petrol',
      })
    }
  }, [vehicle, isNew, id])

  const handleSave = async () => {
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload: Partial<VehicleInfo> = {}

      if (formData.vehicleRegistration) payload.vehicleRegistration = formData.vehicleRegistration
      if (formData.vehicleCategory) payload.vehicleCategory = formData.vehicleCategory as any
      if (formData.vehicleMake) payload.vehicleMake = formData.vehicleMake
      if (formData.vehicleModel) payload.vehicleModel = formData.vehicleModel
      if (formData.vehicleSeats) payload.vehicleSeats = parseInt(formData.vehicleSeats)
      if (formData.vehicleBaseLocation) payload.vehicleBaseLocation = formData.vehicleBaseLocation
      if (formData.vehicleRegistrationDocumentType) {
        payload.vehicleRegistrationDocumentType =
          formData.vehicleRegistrationDocumentType as any
      }
      if (formData.vehicleRegistrationDocument) {
        payload.vehicleRegistrationDocument = formData.vehicleRegistrationDocument
      }
      if (formData.vehiclePhoto) payload.vehiclePhoto = formData.vehiclePhoto
      if (formData.vehicleType) payload.vehicleType = formData.vehicleType

      if (formData.vehicleTotalPayload.value?.trim()) {
        const numValue = parseFloat(formData.vehicleTotalPayload.value)
        if (!isNaN(numValue)) {
          payload.vehicleTotalPayload = {
            value: numValue,
            unit: formData.vehicleTotalPayload.unit as 'kg' | 'tonnes',
          }
        }
      }

      if (formData.vehicleLoadingCapacity.value?.trim()) {
        const numValue = parseFloat(formData.vehicleLoadingCapacity.value)
        if (!isNaN(numValue)) {
          payload.vehicleLoadingCapacity = {
            value: numValue,
            unit: formData.vehicleLoadingCapacity.unit as 'm³' | 'ft³',
          }
        }
      }

      if (formData.vehicleMaxLength.value?.trim()) {
        const numValue = parseFloat(formData.vehicleMaxLength.value)
        if (!isNaN(numValue)) {
          payload.vehicleMaxLength = {
            value: numValue,
            unit: formData.vehicleMaxLength.unit as 'm' | 'ft',
          }
        }
      }

      if (formData.vehicleMotorbikeCapacity) {
        payload.vehicleMotorbikeCapacity = parseInt(formData.vehicleMotorbikeCapacity) || 0
      }

      payload.vehicleTailLift = formData.vehicleTailLift === 'yes'
      payload.vehicleTrailer = formData.vehicleTrailer === 'yes'

      if (formData.vehiclePayload.value?.trim()) {
        const numValue = parseFloat(formData.vehiclePayload.value)
        if (!isNaN(numValue)) {
          payload.vehiclePayload = {
            value: numValue,
            unit: formData.vehiclePayload.unit as 'kg' | 'tonnes',
          }
        }
      }

      if (formData.vehicleFuelType) payload.vehicleFuelType = formData.vehicleFuelType as any

      if (isNew) {
        const result = await createVehicleMutation.mutateAsync(payload as VehicleInfo)
        setSuccessMessage(result?.message || 'Vehicle created successfully!')
        setTimeout(() => navigate('/driver/vehicles'), 1500)
      } else {
        if (!id) throw new Error('Vehicle ID is required for update')
        const result = await updateVehicleMutation.mutateAsync({ id, data: payload })
        setSuccessMessage(result?.message || 'Vehicle updated successfully!')
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        `Failed to ${isNew ? 'create' : 'update'} vehicle. Please try again.`
      setErrorMessage(errorMsg)
      setTimeout(() => setErrorMessage(''), 8000)
    }
  }

  const isLoading = isLoadingVehicle && !isNew
  const isSaving = updateVehicleMutation.isLoading || createVehicleMutation.isLoading

  if (isLoading) {
    return (
      <DashboardLayout role="driver">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 shrink-0"
            onClick={() => navigate('/driver/vehicles')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isNew ? 'Add New Vehicle' : 'Vehicle Details'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isNew
                ? 'Enter your vehicle information in the sections below'
                : vehicle
                  ? `${vehicle.vehicleRegistration} · ${vehicle.vehicleMake} ${vehicle.vehicleModel}`
                  : 'Update vehicle information'}
            </p>
          </div>
        </div>

        {successMessage && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
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

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          className="space-y-5"
        >
          <SectionShell
            title="Basic details"
            icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="vehicleRegistration"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Vehicle registration
                </Label>
                <Input
                  id="vehicleRegistration"
                  value={formData.vehicleRegistration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicleRegistration: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., AB12 CDE"
                  maxLength={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="vehicleCategory"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Vehicle category
                </Label>
                <Select
                  value={formData.vehicleCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleCategory: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small-van">Small Van</SelectItem>
                    <SelectItem value="medium-van">Medium Van</SelectItem>
                    <SelectItem value="large-van">Large Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="vehicleMake"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Make
                </Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  placeholder="e.g., Ford, Mercedes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="vehicleModel"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Model
                </Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  placeholder="e.g., Transit, Sprinter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="vehicleType"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Type of vehicle
                </Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goods-vehicle">Goods Vehicle</SelectItem>
                    <SelectItem value="passenger-vehicle">Passenger Vehicle</SelectItem>
                    <SelectItem value="mixed-use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleSeats">Seats (including driver)</Label>
                <Select
                  value={formData.vehicleSeats}
                  onValueChange={(value) => setFormData({ ...formData, vehicleSeats: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="vehicleBaseLocation"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Where is this vehicle based predominantly?
                </Label>
                <Input
                  id="vehicleBaseLocation"
                  value={formData.vehicleBaseLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleBaseLocation: e.target.value })
                  }
                  placeholder="Enter a location"
                  required
                />
              </div>
            </div>
          </SectionShell>

          <SectionShell
            title="Capacity & specifications"
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Total payload
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.vehicleTotalPayload.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicleTotalPayload: {
                          ...formData.vehicleTotalPayload,
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="0"
                    required
                    className="flex-1"
                  />
                  <Select
                    value={formData.vehicleTotalPayload.unit}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vehicleTotalPayload: {
                          ...formData.vehicleTotalPayload,
                          unit: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="tonnes">tonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Loading capacity
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.vehicleLoadingCapacity.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicleLoadingCapacity: {
                          ...formData.vehicleLoadingCapacity,
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="0"
                    required
                    className="flex-1"
                  />
                  <Select
                    value={formData.vehicleLoadingCapacity.unit}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vehicleLoadingCapacity: {
                          ...formData.vehicleLoadingCapacity,
                          unit: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="ft³">ft³</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max length</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.vehicleMaxLength.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicleMaxLength: {
                          ...formData.vehicleMaxLength,
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="0"
                    className="flex-1"
                  />
                  <Select
                    value={formData.vehicleMaxLength.unit}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vehicleMaxLength: {
                          ...formData.vehicleMaxLength,
                          unit: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payload</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.vehiclePayload.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehiclePayload: {
                          ...formData.vehiclePayload,
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="0"
                    className="flex-1"
                  />
                  <Select
                    value={formData.vehiclePayload.unit}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vehiclePayload: {
                          ...formData.vehiclePayload,
                          unit: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="tonnes">tonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="vehicleMotorbikeCapacity"
                  className="after:content-['*'] after:ml-0.5 after:text-destructive"
                >
                  Can you carry motorbikes, and if so how many?
                </Label>
                <Select
                  value={formData.vehicleMotorbikeCapacity}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleMotorbikeCapacity: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No</SelectItem>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Fuel type
                </Label>
                <RadioGroup
                  value={formData.vehicleFuelType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleFuelType: value })
                  }
                  className="grid grid-cols-2 sm:grid-cols-5 gap-3"
                  required
                >
                  {(['petrol', 'diesel', 'lpg', 'hybrid', 'electric'] as const).map((fuel) => (
                    <div key={fuel} className="flex items-center space-x-2">
                      <RadioGroupItem value={fuel} id={fuel} />
                      <Label htmlFor={fuel} className="cursor-pointer font-normal capitalize">
                        {fuel}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            title="Equipment"
            icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label>Do you have a tail lift?</Label>
                <RadioGroup
                  value={formData.vehicleTailLift}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleTailLift: value })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="tailLiftYes" />
                    <Label htmlFor="tailLiftYes" className="cursor-pointer font-normal">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="tailLiftNo" />
                    <Label htmlFor="tailLiftNo" className="cursor-pointer font-normal">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Do you ever use a trailer to transport vehicles?
                </Label>
                <RadioGroup
                  value={formData.vehicleTrailer}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleTrailer: value })
                  }
                  className="flex gap-6"
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="trailerYes" />
                    <Label htmlFor="trailerYes" className="cursor-pointer font-normal">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="trailerNo" />
                    <Label htmlFor="trailerNo" className="cursor-pointer font-normal">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            title="Documents & photos"
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Registration document type
                </Label>
                <RadioGroup
                  value={formData.vehicleRegistrationDocumentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleRegistrationDocumentType: value })
                  }
                  className="flex flex-col sm:flex-row gap-3"
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="logbook" id="logbook" />
                    <Label htmlFor="logbook" className="cursor-pointer font-normal">
                      Copy of log book
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mot" id="mot" />
                    <Label htmlFor="mot" className="cursor-pointer font-normal">
                      Copy of MOT
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="v5" id="v5" />
                    <Label htmlFor="v5" className="cursor-pointer font-normal">
                      V5 Document
                    </Label>
                  </div>
                </RadioGroup>
                <FileUpload
                  value={formData.vehicleRegistrationDocument}
                  onChange={(url) =>
                    setFormData({ ...formData, vehicleRegistrationDocument: url })
                  }
                  accept="image/*"
                  label="Upload document"
                  description="Upload vehicle registration document (logbook, MOT, or V5)"
                  folder="vehicles/documents"
                  maxSizeMB={2}
                />
              </div>

              <div>
                <Label className="mb-2 block">Vehicle photo</Label>
                <FileUpload
                  value={formData.vehiclePhoto}
                  onChange={(url) => setFormData({ ...formData, vehiclePhoto: url })}
                  accept="image/*"
                  label="Vehicle photo"
                  description="Upload a photo of your vehicle"
                  folder="vehicles/photos"
                  maxSizeMB={2}
                />
              </div>
            </div>
          </SectionShell>

          <div className="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-xl border bg-background/95 backdrop-blur p-4 shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/driver/vehicles')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="sm:min-w-[160px]">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isNew ? 'Creating...' : 'Saving...'}
                </>
              ) : isNew ? (
                'Create Vehicle'
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default VehicleDetailPage
