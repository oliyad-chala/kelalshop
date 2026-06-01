import { ImageResponse } from 'next/og'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo/site'

export const alt = SITE_NAME
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1f36 0%, #232a45 45%, #FF6A00 100%)',
          padding: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: '#FF6A00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="20" r="1.5" fill="white" />
              <circle cx="17" cy="20" r="1.5" fill="white" />
              <path
                d="M3 4h2l2.2 11.4a2 2 0 002 1.6h8.6a2 2 0 001.9-1.5L21 7H7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: 'white', letterSpacing: -2 }}>
              Kelal<span style={{ color: '#fbbf24' }}>Shop</span>
            </span>
            <span style={{ fontSize: 28, color: '#cbd5e1', marginTop: 8 }}>
              Ethiopian Marketplace
            </span>
          </div>
        </div>
        <p
          style={{
            fontSize: 26,
            color: '#e2e8f0',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {SITE_DESCRIPTION}
        </p>
        <span style={{ fontSize: 22, color: '#fbbf24', marginTop: 28, fontWeight: 600 }}>
          kelalshop.com
        </span>
      </div>
    ),
    { ...size }
  )
}
