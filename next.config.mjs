/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'Next.js',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests in development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.1.230:3000',
    'http://192.168.1.230:3001'
  ],
}

export default nextConfig
