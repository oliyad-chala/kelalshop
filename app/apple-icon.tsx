import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #FF6A00 0%, #f59e0b 100%)',
          borderRadius: 36,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
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
    ),
    { ...size }
  )
}
