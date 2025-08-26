/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Spotify images
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com', // Apple Music images
      },
    ],
  },
  // External packages for server components
  serverExternalPackages: ['postgres'],
};

export default nextConfig;