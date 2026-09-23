import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import { authApi, DriverApplicationData } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LocalFilePicker } from '@/components/ui/local-file-picker'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STEPS = ['Personal', 'Documents', 'Vehicle', 'Bank & Video', 'Submit']
const BRAND_LOGO_URL = 'https://local-van.com/oobevyhe/2025/10/local-van-footer-logo.png'

type ApplicationFiles = {
  drivingLicence?: File | null
  goodsInTransitInsurance?: File | null
  publicLiability?: File | null
  proofOfAddress?: File | null
  vehicleRegistrationDocument?: File | null
  vehiclePhoto?: File | null
  bankStatement?: File | null
  introductionVideo?: File | null
}

const emptyForm: DriverApplicationData = {
  name: '',
  email: '',
  phone: '',
  username: '',
  address: '',
  businessName: '',
  drivingLicence: '',
  goodsInTransitInsurance: '',
  publicLiability: '',
  proofOfAddress: '',
  vehicleRegistration: '',
  vehicleCategory: undefined,
  vehicleMake: '',
  vehicleModel: '',
  vehicleSeats: 1,
  vehicleBaseLocation: '',
  vehicleRegistrationDocumentType: undefined,
  vehicleRegistrationDocument: '',
  vehiclePhoto: '',
  vehicleType: '',
  vehicleTotalPayload: { value: undefined, unit: 'kg' },
  vehicleLoadingCapacity: { value: undefined, unit: 'm³' },
  vehicleMaxLength: { value: undefined, unit: 'm' },
  vehicleMotorbikeCapacity: 0,
  vehiclePayload: { value: undefined, unit: 'kg' },
  vehicleFuelType: 'petrol',
  vehicleTailLift: false,
  vehicleTrailer: false,
  introductionVideoUrl: '',
  bankDetails: {
    accountName: '',
    accountNumber: '',
    sortCode: '',
    bankName: '',
    bankStatement: '',
  },
}

export default function DriverApplication() {
  const [step, setStep] = useState(0)
  const [highestStepReached, setHighestStepReached] = useState(0)
  const [form, setForm] = useState<DriverApplicationData>(emptyForm)
  const [applicationFiles, setApplicationFiles] = useState<ApplicationFiles>({})
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const mutation = useMutation((data: DriverApplicationData) => authApi.submitDriverApplication(data))

  const update = (patch: Partial<DriverApplicationData>) => setForm((prev) => ({ ...prev, ...patch }))
  const updateBank = (patch: Partial<NonNullable<DriverApplicationData['bankDetails']>>) =>
    setForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...patch } }))
  const updateFile = (key: keyof ApplicationFiles, file: File | null) =>
    setApplicationFiles((prev) => ({ ...prev, [key]: file }))

  const validateStep = (forSubmit = false, targetStep = step): boolean => {
    setError('')
    if (targetStep === 0 || forSubmit) {
      if (!form.name.trim() || !form.email.trim() || !form.phone?.trim()) {
        setError('Name, email, and phone are required')
        return false
      }
    }
    if (targetStep === 1 || forSubmit) {
      if (!applicationFiles.drivingLicence || !applicationFiles.proofOfAddress) {
        setError('Driving licence and proof of address files are required')
        return false
      }
    }
    if (targetStep === 2 || forSubmit) {
      if (
        !form.vehicleRegistration?.trim() ||
        !form.vehicleCategory ||
        !form.vehicleMake?.trim() ||
        !form.vehicleModel?.trim() ||
        !form.vehicleType ||
        !form.vehicleBaseLocation?.trim() ||
        form.vehicleTotalPayload?.value == null ||
        form.vehicleLoadingCapacity?.value == null ||
        !form.vehicleRegistrationDocumentType ||
        !applicationFiles.vehicleRegistrationDocument ||
        !applicationFiles.vehiclePhoto
      ) {
        setError(
          'Please complete all required vehicle fields (registration, category, make, model, type, base location, payload, loading capacity, registration document, and photo)'
        )
        return false
      }
    }
    return true
  }

  const goToStep = (nextStep: number) => {
    setStep(nextStep)
    setHighestStepReached((prev) => Math.max(prev, nextStep))
    setError('')
  }

  const handleNext = () => {
    if (!validateStep()) return
    goToStep(Math.min(step + 1, STEPS.length - 1))
  }

  const handleStepClick = (index: number) => {
    if (index > highestStepReached) return
    goToStep(index)
  }

  const uploadApplicationFiles = async () => {
    const fileUploads: {
      key: keyof ApplicationFiles
      folder: string
      type?: 'image' | 'video'
      target: 'form' | 'bank' | 'video'
      formField?: keyof DriverApplicationData
      bankField?: keyof NonNullable<DriverApplicationData['bankDetails']>
    }[] = [
      { key: 'drivingLicence', folder: 'driver-applications/documents', target: 'form', formField: 'drivingLicence' },
      { key: 'goodsInTransitInsurance', folder: 'driver-applications/documents', target: 'form', formField: 'goodsInTransitInsurance' },
      { key: 'publicLiability', folder: 'driver-applications/documents', target: 'form', formField: 'publicLiability' },
      { key: 'proofOfAddress', folder: 'driver-applications/documents', target: 'form', formField: 'proofOfAddress' },
      { key: 'vehicleRegistrationDocument', folder: 'driver-applications/vehicles', target: 'form', formField: 'vehicleRegistrationDocument' },
      { key: 'vehiclePhoto', folder: 'driver-applications/vehicles', target: 'form', formField: 'vehiclePhoto' },
      { key: 'bankStatement', folder: 'driver-applications/bank', target: 'bank', bankField: 'bankStatement' },
      { key: 'introductionVideo', folder: 'driver-applications/videos', type: 'video', target: 'video' },
    ]

    const formUpdates: Partial<DriverApplicationData> = {}
    const bankUpdates: Partial<NonNullable<DriverApplicationData['bankDetails']>> = {}
    let videoUrl = form.introductionVideoUrl

    for (const item of fileUploads) {
      const file = applicationFiles[item.key]
      if (!file) continue

      const result = await authApi.uploadApplicationFile(file, {
        folder: item.folder,
        type: item.type || 'image',
      })

      if (item.target === 'form' && item.formField) {
        ;(formUpdates as Record<string, string>)[item.formField] = result.url
      } else if (item.target === 'bank' && item.bankField) {
        bankUpdates[item.bankField] = result.url
      } else if (item.target === 'video') {
        videoUrl = result.url
      }
    }

    return {
      ...formUpdates,
      introductionVideoUrl: videoUrl,
      bankDetails: { ...form.bankDetails, ...bankUpdates },
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(true)) return
    setError('')
    setIsUploading(true)
    try {
      const uploaded = await uploadApplicationFiles()
      await mutation.mutateAsync({
        ...form,
        ...uploaded,
        vehicleSeats: Number(form.vehicleSeats) || 1,
        vehicleMotorbikeCapacity: Number(form.vehicleMotorbikeCapacity) || 0,
        vehicleTailLift: Boolean(form.vehicleTailLift),
        vehicleTrailer: Boolean(form.vehicleTrailer),
        vehicleTotalPayload:
          form.vehicleTotalPayload?.value != null
            ? {
                value: Number(form.vehicleTotalPayload.value),
                unit: form.vehicleTotalPayload.unit || 'kg',
              }
            : undefined,
        vehicleLoadingCapacity:
          form.vehicleLoadingCapacity?.value != null
            ? {
                value: Number(form.vehicleLoadingCapacity.value),
                unit: form.vehicleLoadingCapacity.unit || 'm³',
              }
            : undefined,
        vehicleMaxLength:
          form.vehicleMaxLength?.value != null
            ? {
                value: Number(form.vehicleMaxLength.value),
                unit: form.vehicleMaxLength.unit || 'm',
              }
            : undefined,
        vehiclePayload:
          form.vehiclePayload?.value != null
            ? {
                value: Number(form.vehiclePayload.value),
                unit: form.vehiclePayload.unit || 'kg',
              }
            : undefined,
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit application')
    } finally {
      setIsUploading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <img
              src={BRAND_LOGO_URL}
              alt="Local Van"
              className="h-12 w-auto mx-auto object-contain"
            />
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold">Application submitted</h1>
            <p className="text-muted-foreground">
              Thank you for applying to drive with Local Van. We will review your details and email you
              once a decision has been made.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fileHint = (
    <p className="text-sm text-muted-foreground">
      Files are previewed locally and uploaded together when you submit your application.
    </p>
  )

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3">
            <img
              src={BRAND_LOGO_URL}
              alt="Local Van"
              className="h-14 w-auto max-w-[280px] object-contain"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Drive with Local Van</h1>
            <p className="text-muted-foreground">Complete this form to apply as a driver partner</p>
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {STEPS.map((label, i) => {
            const isActive = i === step
            const isReached = i <= highestStepReached
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleStepClick(i)}
                disabled={!isReached}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isReached
                      ? 'bg-background hover:bg-muted cursor-pointer'
                      : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                {i + 1}. {label}
              </button>
            )
          })}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Full name *</Label>
                  <Input value={form.name} onChange={(e) => update({ name: e.target.value })} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+44..." />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => update({ username: e.target.value.toLowerCase() })} />
                </div>
                <div>
                  <Label>Business name (if applicable)</Label>
                  <Input value={form.businessName} onChange={(e) => update({ businessName: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Textarea value={form.address} onChange={(e) => update({ address: e.target.value })} rows={3} />
                </div>
              </div>
            )}

            {step === 1 && (
              <>
                {fileHint}
                <LocalFilePicker label="Driving licence *" file={applicationFiles.drivingLicence} onChange={(f) => updateFile('drivingLicence', f)} />
                <LocalFilePicker label="Goods in transit insurance" file={applicationFiles.goodsInTransitInsurance} onChange={(f) => updateFile('goodsInTransitInsurance', f)} />
                <LocalFilePicker label="Public liability insurance" file={applicationFiles.publicLiability} onChange={(f) => updateFile('publicLiability', f)} />
                <LocalFilePicker label="Proof of address *" file={applicationFiles.proofOfAddress} onChange={(f) => updateFile('proofOfAddress', f)} />
              </>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Basic details
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Registration *</Label>
                      <Input
                        value={form.vehicleRegistration}
                        onChange={(e) =>
                          update({ vehicleRegistration: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g., AB12 CDE"
                        maxLength={8}
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select
                        value={form.vehicleCategory}
                        onValueChange={(v: any) => update({ vehicleCategory: v })}
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
                    <div>
                      <Label>Make *</Label>
                      <Input
                        value={form.vehicleMake}
                        onChange={(e) => update({ vehicleMake: e.target.value })}
                        placeholder="e.g., Ford, Mercedes"
                      />
                    </div>
                    <div>
                      <Label>Model *</Label>
                      <Input
                        value={form.vehicleModel}
                        onChange={(e) => update({ vehicleModel: e.target.value })}
                        placeholder="e.g., Transit, Sprinter"
                      />
                    </div>
                    <div>
                      <Label>Type of vehicle *</Label>
                      <Select
                        value={form.vehicleType}
                        onValueChange={(v) => update({ vehicleType: v })}
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
                    <div>
                      <Label>Seats (including driver)</Label>
                      <Select
                        value={String(form.vehicleSeats || 1)}
                        onValueChange={(v) => update({ vehicleSeats: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Where is this vehicle based predominantly? *</Label>
                      <Input
                        value={form.vehicleBaseLocation}
                        onChange={(e) => update({ vehicleBaseLocation: e.target.value })}
                        placeholder="Enter a location"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Capacity & specifications
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Total payload *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={form.vehicleTotalPayload?.value ?? ''}
                          onChange={(e) =>
                            update({
                              vehicleTotalPayload: {
                                value:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                                unit: form.vehicleTotalPayload?.unit || 'kg',
                              },
                            })
                          }
                          placeholder="0"
                          className="flex-1"
                        />
                        <Select
                          value={form.vehicleTotalPayload?.unit || 'kg'}
                          onValueChange={(unit: any) =>
                            update({
                              vehicleTotalPayload: {
                                value: form.vehicleTotalPayload?.value,
                                unit,
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
                    <div>
                      <Label>Loading capacity *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={form.vehicleLoadingCapacity?.value ?? ''}
                          onChange={(e) =>
                            update({
                              vehicleLoadingCapacity: {
                                value:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                                unit: form.vehicleLoadingCapacity?.unit || 'm³',
                              },
                            })
                          }
                          placeholder="0"
                          className="flex-1"
                        />
                        <Select
                          value={form.vehicleLoadingCapacity?.unit || 'm³'}
                          onValueChange={(unit: any) =>
                            update({
                              vehicleLoadingCapacity: {
                                value: form.vehicleLoadingCapacity?.value,
                                unit,
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
                    <div>
                      <Label>Max length</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={form.vehicleMaxLength?.value ?? ''}
                          onChange={(e) =>
                            update({
                              vehicleMaxLength: {
                                value:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                                unit: form.vehicleMaxLength?.unit || 'm',
                              },
                            })
                          }
                          placeholder="0"
                          className="flex-1"
                        />
                        <Select
                          value={form.vehicleMaxLength?.unit || 'm'}
                          onValueChange={(unit: any) =>
                            update({
                              vehicleMaxLength: {
                                value: form.vehicleMaxLength?.value,
                                unit,
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
                    <div>
                      <Label>Payload</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={form.vehiclePayload?.value ?? ''}
                          onChange={(e) =>
                            update({
                              vehiclePayload: {
                                value:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                                unit: form.vehiclePayload?.unit || 'kg',
                              },
                            })
                          }
                          placeholder="0"
                          className="flex-1"
                        />
                        <Select
                          value={form.vehiclePayload?.unit || 'kg'}
                          onValueChange={(unit: any) =>
                            update({
                              vehiclePayload: {
                                value: form.vehiclePayload?.value,
                                unit,
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
                    <div className="md:col-span-2">
                      <Label>Can you carry motorbikes, and if so how many?</Label>
                      <Select
                        value={String(form.vehicleMotorbikeCapacity ?? 0)}
                        onValueChange={(v) =>
                          update({ vehicleMotorbikeCapacity: Number(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No</SelectItem>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Fuel type *</Label>
                      <RadioGroup
                        value={form.vehicleFuelType || 'petrol'}
                        onValueChange={(v: any) => update({ vehicleFuelType: v })}
                        className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2"
                      >
                        {(['petrol', 'diesel', 'lpg', 'hybrid', 'electric'] as const).map(
                          (fuel) => (
                            <div key={fuel} className="flex items-center gap-2">
                              <RadioGroupItem value={fuel} id={`fuel-${fuel}`} />
                              <Label
                                htmlFor={`fuel-${fuel}`}
                                className="cursor-pointer font-normal capitalize"
                              >
                                {fuel}
                              </Label>
                            </div>
                          )
                        )}
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Equipment
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Do you have a tail lift?</Label>
                      <RadioGroup
                        value={form.vehicleTailLift ? 'yes' : 'no'}
                        onValueChange={(v) => update({ vehicleTailLift: v === 'yes' })}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="tail-yes" />
                          <Label htmlFor="tail-yes" className="font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="tail-no" />
                          <Label htmlFor="tail-no" className="font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label>Do you ever use a trailer to transport vehicles? *</Label>
                      <RadioGroup
                        value={form.vehicleTrailer ? 'yes' : 'no'}
                        onValueChange={(v) => update({ vehicleTrailer: v === 'yes' })}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="trailer-yes" />
                          <Label htmlFor="trailer-yes" className="font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="trailer-no" />
                          <Label htmlFor="trailer-no" className="font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Documents & photos
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Registration document type *</Label>
                      <RadioGroup
                        value={form.vehicleRegistrationDocumentType || ''}
                        onValueChange={(v: any) =>
                          update({ vehicleRegistrationDocumentType: v })
                        }
                        className="flex flex-col sm:flex-row gap-3 mt-2"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="logbook" id="doc-logbook" />
                          <Label htmlFor="doc-logbook" className="font-normal">
                            Copy of log book
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="mot" id="doc-mot" />
                          <Label htmlFor="doc-mot" className="font-normal">
                            Copy of MOT
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="v5" id="doc-v5" />
                          <Label htmlFor="doc-v5" className="font-normal">
                            V5 Document
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {fileHint}
                    <LocalFilePicker
                      label="Vehicle registration document *"
                      file={applicationFiles.vehicleRegistrationDocument}
                      onChange={(f) => updateFile('vehicleRegistrationDocument', f)}
                    />
                    <LocalFilePicker
                      label="Vehicle photo *"
                      file={applicationFiles.vehiclePhoto}
                      onChange={(f) => updateFile('vehiclePhoto', f)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Account name</Label><Input value={form.bankDetails?.accountName} onChange={(e) => updateBank({ accountName: e.target.value })} /></div>
                  <div><Label>Bank name</Label><Input value={form.bankDetails?.bankName} onChange={(e) => updateBank({ bankName: e.target.value })} /></div>
                  <div><Label>Account number</Label><Input value={form.bankDetails?.accountNumber} onChange={(e) => updateBank({ accountNumber: e.target.value.replace(/\D/g, '') })} maxLength={8} /></div>
                  <div><Label>Sort code</Label><Input value={form.bankDetails?.sortCode} onChange={(e) => updateBank({ sortCode: e.target.value })} placeholder="12-34-56" /></div>
                </div>
                {fileHint}
                <LocalFilePicker label="Bank statement" file={applicationFiles.bankStatement} onChange={(f) => updateFile('bankStatement', f)} />
                <div>
                  <Label>Introduction video URL (optional)</Label>
                  <Input
                    value={applicationFiles.introductionVideo ? '' : form.introductionVideoUrl}
                    onChange={(e) => update({ introductionVideoUrl: e.target.value })}
                    placeholder="YouTube, Vimeo, or Google Drive link"
                    disabled={!!applicationFiles.introductionVideo}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Or choose a video file below</p>
                </div>
                <LocalFilePicker
                  label="Introduction video file (optional)"
                  file={applicationFiles.introductionVideo}
                  onChange={(f) => {
                    updateFile('introductionVideo', f)
                    if (f) update({ introductionVideoUrl: '' })
                  }}
                  accept="video/mp4,video/webm,video/quicktime"
                  maxSizeMB={25}
                />
              </>
            )}

            {step === 4 && (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Review your details before submitting. All files will be uploaded now.</p>
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Email:</strong> {form.email}</p>
                <p><strong>Phone:</strong> {form.phone}</p>
                <p><strong>Vehicle:</strong> {form.vehicleMake} {form.vehicleModel} ({form.vehicleRegistration})</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => goToStep(step - 1)}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>Continue</Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={mutation.isLoading || isUploading}>
                  {mutation.isLoading || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? 'Uploading files...' : 'Submitting...'}
                    </>
                  ) : (
                    'Submit application'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
