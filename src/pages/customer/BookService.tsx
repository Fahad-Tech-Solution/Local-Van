import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { SectionShell } from '@/components/booking/SectionShell'
import { ExternalLink, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

const BOOKING_URL = 'https://local-van.com/instant-price/'

const BookService = () => {
  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Book Moving Service</h2>
          <p className="text-muted-foreground">
            Get an instant quote and book on the Local Van website. Completed bookings appear in My
            Bookings.
          </p>
        </div>

        <SectionShell
          title="Book online"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        >
          <p className="text-sm text-muted-foreground">
            Use the Local Van booking page for routes, vans, helpers, and extras. After you pay, your
            order shows up here automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button asChild className="flex-1 sm:flex-none" size="lg">
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open booking page
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1 sm:flex-none" size="lg">
              <Link to="/customer/bookings">View my bookings</Link>
            </Button>
          </div>
        </SectionShell>
      </div>
    </DashboardLayout>
  )
}

export default BookService
