import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        // All Supabase storage — covers production, staging, and any future project
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
      {
        // Google OAuth profile pictures
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/dashboard/products/new',
        destination: '/dashboard/listings/new',
        permanent: true,
      },
      {
        source: '/dashboard/products',
        destination: '/dashboard/listings',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
