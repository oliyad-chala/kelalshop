'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database.types'
import { CampaignBannerField } from '@/components/admin/promotions/CampaignBannerField'

type Promotion = Database['public']['Tables']['promotions']['Row']

type CampaignFormProps = {
  action: (prevState: any, formData: FormData) => Promise<{ error?: string } | void>
  submitLabel: string
  campaign?: Promotion
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CampaignForm({ action, submitLabel, campaign }: CampaignFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, { error: '' })

  return (
    <div className="fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => router.back()}
        className="admin-btn admin-btn-outline"
        style={{ marginBottom: '1.5rem' }}
      >
        ← Back to Marketing Center
      </button>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title">{campaign ? 'Edit Campaign' : 'Create New Campaign'}</h1>
          <p className="section-subtitle">
            Announce a flash sale or geo-targeted promotion. Sellers will see it in their dashboard and can opt-in products.
          </p>
        </div>
      </div>

      <form action={formAction} encType="multipart/form-data">
        {state?.error && (
          <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>
            {state.error}
          </div>
        )}

        <div className="admin-card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Campaign Info</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="admin-label">Campaign Name *</label>
              <input name="name" required defaultValue={campaign?.name ?? ''} placeholder="e.g. Super Summer Flash Sale" className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Description</label>
              <textarea name="description" rows={3} defaultValue={campaign?.description ?? ''} placeholder="Tell sellers what this campaign is about…" className="admin-input" style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="admin-label">Campaign Type *</label>
              <select name="type" required defaultValue={campaign?.type ?? 'flash_sale_campaign'} className="admin-input">
                <option value="flash_sale_campaign">Flash Sale Campaign</option>
                <option value="banner">Geo-Targeted Banner</option>
                <option value="shipping">Shipping Deal</option>
              </select>
            </div>
            <CampaignBannerField
              key={campaign?.id ?? 'new-campaign'}
              defaultUrl={campaign?.banner_image_url ?? ''}
            />
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Schedule</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="admin-label">Start Date & Time *</label>
              <input name="start_date" type="datetime-local" required defaultValue={campaign ? toDatetimeLocal(campaign.start_date) : ''} className="admin-input" />
            </div>
            <div>
              <label className="admin-label">End Date & Time *</label>
              <input name="end_date" type="datetime-local" required defaultValue={campaign ? toDatetimeLocal(campaign.end_date) : ''} className="admin-input" />
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Geo Targeting</h2>
          <p className="section-subtitle" style={{ marginBottom: '1rem' }}>Optional — leave blank for global reach.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="admin-label">Country Code</label>
              <input name="target_country" defaultValue={campaign?.target_country ?? ''} placeholder="ET" maxLength={2} className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Region / State</label>
              <input name="target_region" defaultValue={campaign?.target_region ?? ''} placeholder="Addis Ababa" className="admin-input" />
            </div>
            <div>
              <label className="admin-label">City</label>
              <input name="target_city" defaultValue={campaign?.target_city ?? ''} placeholder="Bole" className="admin-input" />
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Seller Rules</h2>
          <div>
            <label className="admin-label">Minimum Discount Required (%)</label>
            <input name="min_discount_pct" type="number" min={0} max={95} defaultValue={campaign?.discount_percentage ?? 20} className="admin-input" style={{ width: '180px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
            {pending ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
