/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    domains: [
      'lh3.googleusercontent.com', 
      'drive.google.com',
      'localhost',
      'kskcolle-production.up.railway.app'
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
