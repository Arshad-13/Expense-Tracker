/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 no longer needs experimental for server components external packages
  // Moving this to the stable config
  serverExternalPackages: ['bcryptjs'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
