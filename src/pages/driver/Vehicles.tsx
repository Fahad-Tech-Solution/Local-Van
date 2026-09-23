import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Truck, Plus, MapPin, Fuel, Trash2, ChevronRight, Users } from 'lucide-react'
import { useDriverVehicles, useDeleteVehicle } from '@/hooks/useDriver'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { XCircle, CheckCircle2 } from 'lucide-react'

const formatCategory = (category?: string) => {
  if (!category) return 'Unknown'
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const VehiclesPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDriverVehicles()
  const deleteVehicleMutation = useDeleteVehicle()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const vehicles = data?.vehicles || []

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    setDeletingId(id)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await deleteVehicleMutation.mutateAsync(id)
      setSuccessMessage('Vehicle deleted successfully')
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to delete vehicle'
      setErrorMessage(errorMsg)
      setTimeout(() => setErrorMessage(''), 8000)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout role="driver">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    const msg =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      'Failed to load vehicles'
    return (
      <DashboardLayout role="driver">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Vehicles</h2>
          </div>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Vehicles</AlertTitle>
            <AlertDescription>{msg}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="driver">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Vehicles</h2>
            <p className="text-muted-foreground mt-1">
              Manage your vehicle fleet ({vehicles.length}{' '}
              {vehicles.length === 1 ? 'vehicle' : 'vehicles'})
            </p>
          </div>
          <Button onClick={() => navigate('/driver/vehicles/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
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

        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 py-16 flex flex-col items-center text-center px-4">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No vehicles yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Add your first vehicle so you can take jobs that match your fleet.
            </p>
            <Button onClick={() => navigate('/driver/vehicles/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle._id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/driver/vehicles/${vehicle._id}`)}
              >
                <div className="aspect-[16/9] bg-muted relative">
                  {vehicle.vehiclePhoto ? (
                    <img
                      src={vehicle.vehiclePhoto}
                      alt={`${vehicle.vehicleMake} ${vehicle.vehicleModel}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Truck className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-background/90 text-foreground hover:bg-background/90">
                    {formatCategory(vehicle.vehicleCategory)}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">
                      {vehicle.vehicleMake} {vehicle.vehicleModel}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono mt-0.5 tracking-wide">
                      {vehicle.vehicleRegistration || 'No registration'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {vehicle.vehicleBaseLocation && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {vehicle.vehicleBaseLocation}
                      </span>
                    )}
                    {vehicle.vehicleFuelType && (
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Fuel className="h-3.5 w-3.5" />
                        {vehicle.vehicleFuelType}
                      </span>
                    )}
                    {vehicle.vehicleSeats != null && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {vehicle.vehicleSeats} seats
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/driver/vehicles/${vehicle._id}`)
                      }}
                    >
                      View details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(vehicle._id!)
                      }}
                      disabled={deletingId === vehicle._id}
                    >
                      {deletingId === vehicle._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default VehiclesPage
