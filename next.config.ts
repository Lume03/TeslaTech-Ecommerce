/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        // pathname: '/v0/b/**', // Optional: Be more specific if needed
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**', // Explicitly allowing all paths
      },
    ],
  },
};

export default nextConfig;
