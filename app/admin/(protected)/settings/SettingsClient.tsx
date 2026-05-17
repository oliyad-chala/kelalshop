'use client'

import { useState, useTransition } from 'react'
import {
  User, Lock, Bell, Shield, Globe, Palette,
  Save, Eye, EyeOff, CheckCircle, AlertCircle,
  Mail, Phone, Building, Clock
} from 'lucide-react'

interface SettingsClientProps {
  profile: any
  email: string
}

type Tab = 'account' | 'security' | 'notifications' | 'platform'

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-admin-border)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h3>
        {description && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0, cursor: 'pointer',
          background: checked ? 'var(--color-accent-500)' : '#d1d5db',
          position: 'relative', transition: 'background 0.2s'
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: checked ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s'
        }} />
      </div>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{label}</span>
    </label>
  )
}

export function SettingsClient({ profile, email }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Account state
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [twoFactor, setTwoFactor] = useState(false)

  // Notification state
  const [notifVerifications, setNotifVerifications] = useState(true)
  const [notifPayments, setNotifPayments] = useState(true)
  const [notifDisputes, setNotifDisputes] = useState(true)
  const [notifNewSellers, setNotifNewSellers] = useState(false)
  const [emailDigest, setEmailDigest] = useState(true)

  // Platform state
  const [platformName, setPlatformName] = useState('KelalShop')
  const [supportEmail, setSupportEmail] = useState('support@kelalshop.com')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [autoVerify, setAutoVerify] = useState(false)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'account',       label: 'Account',       icon: <User size={16} /> },
    { id: 'security',      label: 'Security',      icon: <Lock size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'platform',      label: 'Platform',      icon: <Globe size={16} /> },
  ]

  const handleSave = () => {
    setError(null)
    if (activeTab === 'security' && newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    startTransition(async () => {
      await new Promise(r => setTimeout(r, 600)) // Simulate API call
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-subtitle">Manage your admin account, security, and platform configuration</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={pending}
          style={{ gap: '0.5rem' }}
        >
          <Save size={15} />
          {pending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="admin-alert admin-alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={16} />
          Settings saved successfully.
        </div>
      )}
      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Sidebar Tabs */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--color-accent-500)' : 'var(--color-text-secondary)',
                background: activeTab === tab.id ? 'var(--color-info-bg)' : 'transparent',
                transition: 'all 0.15s',
                width: '100%',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Account Tab ── */}
          {activeTab === 'account' && (
            <>
              <SectionCard title="Profile Information" description="Update your admin account details.">
                <FormRow label="Full Name" hint="Your display name">
                  <input
                    className="admin-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Full name"
                  />
                </FormRow>
                <FormRow label="Email Address" hint="Your login email (read-only)">
                  <input
                    className="admin-input"
                    value={email}
                    readOnly
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </FormRow>
                <FormRow label="Phone Number" hint="Optional contact number">
                  <input
                    className="admin-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+251 9XX XXX XXXX"
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Avatar" description="Your admin profile avatar is generated from your initials.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-purple))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.75rem', fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {(fullName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Avatar is automatically generated from your first name initial.
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Custom avatar uploads coming soon.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <>
              <SectionCard title="Change Password" description="Update your admin account password.">
                <FormRow label="Current Password">
                  <div style={{ position: 'relative' }}>
                    <input
                      className="admin-input"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormRow>
                <FormRow label="New Password">
                  <input
                    className="admin-input"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </FormRow>
                <FormRow label="Confirm Password">
                  <input
                    className="admin-input"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Session Management" description="Control how long admin sessions remain active.">
                <FormRow label="Auto Sign-out" hint="Idle timeout in minutes">
                  <select
                    className="admin-input"
                    value={sessionTimeout}
                    onChange={e => setSessionTimeout(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </FormRow>
              </SectionCard>

              <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                <Toggle
                  checked={twoFactor}
                  onChange={setTwoFactor}
                  label="Enable two-factor authentication (coming soon)"
                />
              </SectionCard>
            </>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <>
              <SectionCard title="In-App Alerts" description="Choose which events trigger admin notifications.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Toggle checked={notifVerifications} onChange={setNotifVerifications} label="New verification requests" />
                  <Toggle checked={notifPayments} onChange={setNotifPayments} label="Pending payment requests" />
                  <Toggle checked={notifDisputes} onChange={setNotifDisputes} label="Dispute escalations" />
                  <Toggle checked={notifNewSellers} onChange={setNotifNewSellers} label="New seller registrations" />
                </div>
              </SectionCard>

              <SectionCard title="Email Notifications" description="Receive a daily digest of platform activity.">
                <Toggle checked={emailDigest} onChange={setEmailDigest} label="Receive daily email digest" />
                {emailDigest && (
                  <div style={{ marginTop: '1rem' }}>
                    <label className="admin-label">Digest Email Address</label>
                    <input
                      className="admin-input"
                      type="email"
                      defaultValue={email}
                      placeholder="admin@example.com"
                    />
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ── Platform Tab ── */}
          {activeTab === 'platform' && (
            <>
              <SectionCard title="General" description="Core platform settings.">
                <FormRow label="Platform Name">
                  <input
                    className="admin-input"
                    value={platformName}
                    onChange={e => setPlatformName(e.target.value)}
                    placeholder="KelalShop"
                  />
                </FormRow>
                <FormRow label="Support Email" hint="Shown to buyers on receipts">
                  <input
                    className="admin-input"
                    type="email"
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    placeholder="support@kelalshop.com"
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Operations" description="Control live marketplace behavior.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} label="Enable maintenance mode" />
                    {maintenanceMode && (
                      <div className="admin-alert admin-alert-error" style={{ marginTop: '0.75rem' }}>
                        <AlertCircle size={15} />
                        The marketplace will be inaccessible to buyers while maintenance mode is active.
                      </div>
                    )}
                  </div>
                  <Toggle checked={autoVerify} onChange={setAutoVerify} label="Auto-approve seller verifications" />
                </div>
              </SectionCard>

              <SectionCard title="About" description="Platform version and environment info.">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Version', value: '2.0.0' },
                    { label: 'Environment', value: process.env.NODE_ENV ?? 'production' },
                    { label: 'Database', value: 'Supabase (PostgreSQL)' },
                    { label: 'Framework', value: 'Next.js 15' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--color-admin-bg)', border: '1px solid var(--color-admin-border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.3rem' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
