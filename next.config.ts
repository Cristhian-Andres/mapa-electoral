import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
  },
  // Allow fetching Colombia GeoJSON from external CDN
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig
