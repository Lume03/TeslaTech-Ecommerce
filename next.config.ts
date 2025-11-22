
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is required to allow requests from the Firebase Studio dev environment.
    allowedDevOrigins: [
      '6000-firebase-studio-1749664212529.cluster-m7tpz3bmgjgoqrktlvd4ykrc2m.cloudworkstations.dev',
      '9000-firebase-studio-1749664212529.cluster-m7tpz3bmgjgoqrktlvd4ykrc2m.cloudworkstations.dev',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
