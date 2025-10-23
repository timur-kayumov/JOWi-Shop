import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jowi/ui', '@jowi/validators', '@jowi/types', '@jowi/i18n'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
