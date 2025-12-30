/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds - we run it separately via npm run lint
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig


