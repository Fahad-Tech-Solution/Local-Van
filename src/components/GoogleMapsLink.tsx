import type { MouseEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { googleMapsUrlForLocation } from '@/utils/maps'

type GoogleMapsLinkProps = {
  address?: string | null
  city?: string | null
  zipCode?: string | null
  label?: string
  className?: string
  /** Use a button when nested inside another link (e.g. job list cards). */
  asButton?: boolean
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
}

export function GoogleMapsLink({
  address,
  city,
  zipCode,
  label = 'Open in Google Maps',
  className,
  asButton = false,
  onClick,
}: GoogleMapsLinkProps) {
  const url = googleMapsUrlForLocation({ address, city, zipCode })
  if (!url) return null

  const classes = cn(
    'inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline',
    className
  )

  if (asButton) {
    return (
      <button
        type="button"
        className={classes}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClick?.(e)
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        {label}
      </button>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={classes}
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      {label}
    </a>
  )
}
