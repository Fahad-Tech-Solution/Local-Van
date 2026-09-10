import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoggingIn, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const role = user.role || 'customer'
      navigate(`/${role}`)
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    login(
      { email, password },
      {
        onSuccess: (data: any) => {
          const role = data?.user?.role || 'customer'
          navigate(`/${role}`)
        },
        onError: (error: any) => {
          console.error('Login failed:', error)
          setError(
            error?.response?.data?.message ||
              'Login failed. Please check your credentials.'
          )
        },
      }
    )
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-6 sm:px-6">
        <div className="flex w-full min-w-0 flex-col gap-6">
          <Card className="w-full min-w-0 overflow-hidden">
            <CardContent className="grid w-full min-w-0 grid-cols-1 p-0 md:grid-cols-2">
              <form className="min-w-0 p-5 sm:p-6 md:p-8" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Login to your Local Van account
                    </p>
                  </div>
                  {error && (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive break-words">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full min-w-0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full min-w-0"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                  </Button>

                  <div className="space-y-3 text-center text-sm">
                    <Button
                      variant="secondary"
                      className="h-auto w-full whitespace-normal px-3 py-3 text-sm leading-snug"
                      asChild
                    >
                      <Link to="/driver-application">
                        Are you a driver or interested to work with Local Van?
                      </Link>
                    </Button>
                  </div>
                </div>
              </form>
              <div className="relative hidden min-h-[320px] bg-muted md:block">
                <img
                  src="./driver.jpg"
                  alt="Local Van"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
          <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground break-words [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            By clicking continue, you agree to our{' '}
            <Link to="https://local-van.com/driver-terms-and-conditions/">Driver</Link> and{' '}
            <Link to="https://local-van.com/customer-terms-and-conditions/">Customer</Link> Terms
            of Service and{' '}
            <Link to="https://local-van.com/privacy-policy/">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
