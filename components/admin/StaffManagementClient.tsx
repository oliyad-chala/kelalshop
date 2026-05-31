'use client'

import { useState, useTransition } from 'react'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import { promoteToStaff, revokeStaff, type StaffMember } from '@/lib/actions/admin-staff'

export function StaffManagementClient({ initialStaff }: { initialStaff: StaffMember[] }) {
  const [staff, setStaff] = useState(initialStaff)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<StaffMember | null>(null)
  const [pending, startTransition] = useTransition()

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await promoteToStaff(email)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      setMessage({ type: 'success', text: result.success ?? 'Staff member added.' })
      setEmail('')
      const { listStaff } = await import('@/lib/actions/admin-staff')
      const updated = await listStaff()
      setStaff(updated)
    })
  }

  const handleRevoke = () => {
    if (!revokeTarget) return
    setMessage(null)
    startTransition(async () => {
      const result = await revokeStaff(revokeTarget.id)
      setRevokeTarget(null)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      setMessage({ type: 'success', text: result.success ?? 'Staff access revoked.' })
      setStaff((prev) => prev.filter((s) => s.id !== revokeTarget.id))
    })
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Staff Management</h1>
          <p className="section-subtitle">Promote trusted users to staff or revoke their admin portal access.</p>
        </div>
      </div>

      {message && (
        <div
          className={`admin-alert ${message.type === 'error' ? 'admin-alert-error' : 'admin-alert-success'}`}
          style={{ marginBottom: '1rem' }}
        >
          {message.text}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} />
          Add staff member
        </h2>
        <form onSubmit={handlePromote} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label htmlFor="staff-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
              User email
            </label>
            <input
              id="staff-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="admin-input"
              style={{ width: '100%' }}
              disabled={pending}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
            {pending ? 'Adding…' : 'Add staff'}
          </button>
        </form>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
          The user must already have a KelalShop account. Staff can access the admin portal with limited permissions.
        </p>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} />
          Current staff ({staff.length})
        </h2>

        {staff.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No staff members yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-admin-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Added</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{member.full_name ?? '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>{member.email ?? '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger"
                        onClick={() => setRevokeTarget(member)}
                        disabled={pending}
                        title="Revoke staff access"
                      >
                        <UserMinus size={14} />
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revokeTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={() => !pending && setRevokeTarget(null)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: '420px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Revoke staff access?</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {revokeTarget.full_name ?? revokeTarget.email} will lose admin portal access and become a regular buyer.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setRevokeTarget(null)} disabled={pending}>
                Cancel
              </button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={handleRevoke} disabled={pending}>
                {pending ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
