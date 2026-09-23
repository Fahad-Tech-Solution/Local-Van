import type { ReactNode } from 'react'

export function SectionShell({
  title,
  icon,
  children,
  className = '',
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border bg-white p-4 sm:p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </section>
  )
}

export function ReadField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || '—'}</p>
    </div>
  )
}
