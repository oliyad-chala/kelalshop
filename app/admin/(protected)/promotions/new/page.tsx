'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/lib/actions/campaigns'

const initialState = { error: '', success: '' }

export default function NewCampaignPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createCampaign, initialState)

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem' }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 }}
      >
        ← Back to Marketing Center
      </button>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>Create New Campaign</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Announce a flash sale or geo-targeted promotion. Sellers will see it in their dashboard and can opt-in products.
      </p>

      <form action={formAction}>
        {state?.error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem 1rem', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {state.error}
          </div>
        )}

        {/* Basic Info */}
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
            Campaign Info
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Campaign Name *</label>
              <input name="name" required placeholder="e.g. Super Summer Flash Sale" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea name="description" rows={3} placeholder="Tell sellers what this campaign is about…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div>
              <label style={labelStyle}>Campaign Type *</label>
              <select name="type" required style={inputStyle}>
                <option value="flash_sale_campaign">⚡ Flash Sale Campaign</option>
                <option value="banner">🖼 Geo-Targeted Banner</option>
                <option value="shipping">🚚 Shipping Deal</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Banner Image URL</label>
              <input name="banner_image_url" type="url" placeholder="https://…" style={inputStyle} />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>Shown in the seller portal and on the homepage flash sale carousel.</p>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
            Schedule
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Start Date & Time *</label>
              <input name="start_date" type="datetime-local" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date & Time *</label>
              <input name="end_date" type="datetime-local" required style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Geo Targeting */}
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🌍 Geo Targeting <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#9ca3af' }}>(optional — leave blank for global)</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
            Restrict this campaign to users in a specific location. Uses 2-letter country codes (ET, US, etc.)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Country Code</label>
              <input name="target_country" placeholder="e.g. ET" maxLength={2} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Region / State</label>
              <input name="target_region" placeholder="e.g. Addis Ababa" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input name="target_city" placeholder="e.g. Bole" style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Seller Rules */}
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>
            📋 Seller Rules
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
            Set the minimum requirements sellers must meet to join this campaign.
          </p>
          <div>
            <label style={labelStyle}>Minimum Discount Required (%)</label>
            <input
              name="min_discount_pct"
              type="number"
              min={0}
              max={95}
              defaultValue={20}
              style={{ ...inputStyle, width: '180px' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>Sellers must offer at least this discount on their submitted products. Set 0 for no requirement.</p>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: '0.7rem 1.4rem', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '0.7rem 1.75rem', borderRadius: '10px', border: 'none',
              background: pending ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? 'Creating…' : '⚡ Launch Campaign'}
          </button>
        </div>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px',
  border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#0f172a',
  background: '#fafafa', outline: 'none', boxSizing: 'border-box',
}
