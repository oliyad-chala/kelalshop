'use client'

import { useRef, useState } from 'react'
import { uploadCampaignBanner } from '@/lib/actions/campaign-banner'
import { CampaignBannerImage } from '@/components/promotions/CampaignBannerImage'

type Props = {
  defaultUrl?: string | null
}

function normalizeUrl(value?: string | null): string {
  return typeof value === 'string' ? value : ''
}

export function CampaignBannerField({ defaultUrl }: Props) {
  const initialUrl = normalizeUrl(defaultUrl)
  const [mode, setMode] = useState<'upload' | 'url'>(() => (initialUrl ? 'url' : 'upload'))
  const [url, setUrl] = useState(initialUrl)
  const [preview, setPreview] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const fd = new FormData()
    fd.append('banner_file', file)
    const result = await uploadCampaignBanner(fd)

    setUploading(false)
    if (fileRef.current) {
      fileRef.current.value = ''
    }
    setFileInputKey((k) => k + 1)

    if (result.error) {
      setError(result.error)
      setPreview(url)
      return
    }
    if (result.url) {
      setUrl(result.url)
      setPreview(result.url)
    }
  }

  const bannerUrl = url

  return (
    <div>
      <label className="admin-label">Campaign Banner</label>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          className={`admin-btn ${mode === 'upload' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          onClick={() => setMode('upload')}
        >
          Upload image
        </button>
        <button
          type="button"
          className={`admin-btn ${mode === 'url' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          onClick={() => setMode('url')}
        >
          Image URL
        </button>
      </div>

      <input type="hidden" name="banner_image_url" value={bannerUrl} readOnly />

      {mode === 'upload' ? (
        <div>
          <input
            key={fileInputKey}
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="admin-input"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="section-subtitle" style={{ marginTop: '0.35rem' }}>
            JPEG, PNG, WebP or GIF · max 5 MB. Stored on KelalShop (recommended).
          </p>
        </div>
      ) : (
        <div>
          <input
            type="url"
            className="admin-input"
            placeholder="https://…"
            value={bannerUrl}
            onChange={(e) => {
              const next = e.target.value
              setUrl(next)
              setPreview(next)
              setError(null)
            }}
          />
          <p className="section-subtitle" style={{ marginTop: '0.35rem' }}>
            Some sites block hotlinking; upload is more reliable.
          </p>
        </div>
      )}

      {uploading && (
        <p className="section-subtitle" style={{ marginTop: '0.5rem', color: '#6366f1' }}>
          Uploading…
        </p>
      )}
      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginTop: '0.5rem' }}>
          {error}
        </div>
      )}

      {preview ? (
        <div
          style={{
            marginTop: '1rem',
            position: 'relative',
            height: '160px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}
        >
          <CampaignBannerImage src={preview} alt="Banner preview" fill className="object-cover" />
        </div>
      ) : null}
    </div>
  )
}
