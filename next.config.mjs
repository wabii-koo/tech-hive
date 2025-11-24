/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // bump this as high as you need, e.g. 50mb
      bodySizeLimit: '50mb',
    },
  },
  // other configurations...
};

export default nextConfig;
