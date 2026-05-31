'use client'

import { useState } from 'react'
import Image from 'next/image'

type Props = {
  src: string
  alt: string
  className?: string
  fill?: boolean
  height?: number
}

function isSupabaseStorageUrl(url: string) {
  try {
    const host = new URL(url).hostname
    return host.endsWith('.supabase.co') && url.includes('/storage/v1/object/')
  } catch {
    return false
  }
}

export function CampaignBannerImage({ src, alt, className = '', fill, height }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold ${className}`}
        style={height ? { height } : undefined}
      >
        <span className="text-sm px-4 text-center drop-shadow">{alt}</span>
      </div>
    )
  }

  if (isSupabaseStorageUrl(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        unoptimized
        className={className}
        onError={() => setFailed(true)}
        style={height && !fill ? { height } : undefined}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={
        fill
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
          : height
            ? { height, width: '100%', objectFit: 'cover' }
            : undefined
      }
    />
  )
}
