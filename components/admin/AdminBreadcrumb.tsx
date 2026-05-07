'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, LayoutDashboard } from 'lucide-react'

// Maps raw path segments to human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  verifications: 'Verifications',
  payouts: 'Financial Monitor',
  products: 'Products',
  disputes: 'Dispute Center',
  trust: 'Trust Scores',
}

function formatSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminBreadcrumb() {
  const pathname = usePathname()

  // Split into segments, drop empty strings and 'admin' root
  const segments = pathname.split('/').filter(Boolean)

  // Build cumulative href for each segment
  const crumbs = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
    isLast: index === segments.length - 1,
  }))

  // Don't show breadcrumb on the dashboard root — it's redundant
  if (crumbs.length <= 2) return null

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        marginBottom: '1.5rem',
        padding: '0.625rem 1rem',
        background: 'var(--color-admin-elevated)',
        border: '1px solid var(--color-admin-border)',
        borderRadius: '8px',
        fontSize: '0.8125rem',
      }}
    >
      <Link
        href="/admin/dashboard"
        style={{
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
        onMouseOut={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        <LayoutDashboard size={13} />
      </Link>

      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', opacity: 0.5, flexShrink: 0 }} />
          {crumb.isLast ? (
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              style={{
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
