/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // This ensures Next.js doesn't look for a lint directory
    dirs: ['.'],
  },
}

module.exports = nextConfig


