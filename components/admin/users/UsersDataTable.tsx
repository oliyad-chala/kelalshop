'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, ShieldAlert, UserCheck, Shield } from 'lucide-react'
import { toggleUserSuspend } from '@/lib/actions/admin-users'

export function UsersDataTable({ initialUsers, initialCount }: { initialUsers: any[], initialCount: number }) {
  const [users, setUsers] = useState(initialUsers)
  const [pending, startTransition] = useTransition()

  const handleSuspendToggle = (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleUserSuspend(userId, !currentStatus)
        setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u))
      } catch (err) {
        console.error('Failed to update suspension status', err)
      }
    })
  }

  return (
    <div className="admin-card overflow-x-auto">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-admin-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th style={{ padding: '1rem', fontWeight: 600 }}>User</th>
            <th style={{ padding: '1rem', fontWeight: 600 }}>Role</th>
            <th style={{ padding: '1rem', fontWeight: 600 }}>Joined</th>
            <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--color-info-bg)', color: 'var(--color-accent-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.875rem'
                  }}>
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {user.full_name || 'Unnamed User'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: user.role === 'admin' ? '#f3e8ff' : user.role === 'shopper' ? '#ecfeff' : '#f1f5f9',
                  color: user.role === 'admin' ? '#7e22ce' : user.role === 'shopper' ? '#0891b2' : '#475569',
                  textTransform: 'capitalize'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '1rem' }}>
                {user.is_suspended ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                    <ShieldAlert size={14} /> Suspended
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 500 }}>
                    <UserCheck size={14} /> Active
                  </span>
                )}
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                {user.role !== 'admin' && (
                  <button
                    disabled={pending}
                    onClick={() => handleSuspendToggle(user.id, user.is_suspended)}
                    className="admin-btn"
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      fontSize: '0.75rem',
                      background: user.is_suspended ? 'var(--color-admin-bg)' : '#fff1f2',
                      color: user.is_suspended ? 'var(--color-text-primary)' : '#ef4444',
                      border: `1px solid ${user.is_suspended ? 'var(--color-admin-border)' : '#fecdd3'}`,
                    }}
                  >
                    {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
