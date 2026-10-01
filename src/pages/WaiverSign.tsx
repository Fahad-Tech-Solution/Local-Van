import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { customerApi } from '@/api/customer'
import { uploadApi } from '@/api/upload'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const WaiverSignPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const [signedByName, setSignedByName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const isAuthenticated = !!user

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawing.current = true
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => {
    drawing.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const getPosition = (): Promise<{ lat?: number; lng?: number }> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({})
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })

  const dataUrlToFile = async (dataUrl: string, filename: string) => {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    return new File([blob], filename, { type: blob.type || 'image/png' })
  }

  const handleSubmit = async () => {
    if (!bookingId) {
      setError('Missing booking id')
      return
    }
    if (!isAuthenticated || user?.role !== 'customer') {
      setError('Please log in as the customer to sign this waiver.')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    if (!signedByName.trim()) {
      setError('Please enter your name')
      setTimeout(() => setError(''), 3000)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const dataUrl = canvas.toDataURL('image/png')
      let signatureUrl = dataUrl
      try {
        const file = await dataUrlToFile(dataUrl, `waiver-${bookingId}.png`)
        const uploaded = await uploadApi.uploadImage(file, 'waivers')
        signatureUrl = uploaded.url
      } catch {
        // Fall back to storing the data URL if upload is unavailable
      }

      const coords = await getPosition()
      const result = await customerApi.signWaiver(bookingId, {
        signatureUrl,
        signedByName: signedByName.trim(),
        ...coords,
      })
      setMessage(result.message || 'Waiver signed successfully')
      setTimeout(() => {
        navigate(`/customer/bookings/${bookingId}`)
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign waiver')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign waiver</CardTitle>
            <CardDescription>
              Draw your signature below to confirm the job waiver
              {bookingId ? ` for booking ${bookingId}` : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {!isAuthenticated && (
              <Alert>
                <AlertTitle>Login required</AlertTitle>
                <AlertDescription>
                  Sign in as the customer, then return to this page to submit the waiver.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="signedByName">Full name</Label>
              <Input
                id="signedByName"
                className="mt-1.5"
                value={signedByName}
                onChange={(e) => setSignedByName(e.target.value)}
                placeholder="Type your name"
              />
            </div>

            <div>
              <Label>Signature</Label>
              <canvas
                ref={canvasRef}
                width={560}
                height={220}
                className="mt-1.5 w-full touch-none rounded-lg border bg-white"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
                  Clear
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !isAuthenticated}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm & sign waiver'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WaiverSignPage
