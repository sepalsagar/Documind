import type {NextConfig} from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Keep Next's project boundary at this repository. A parent lockfile was
  // causing it to select C:\\Users\\ASUS as the workspace root, which meant
  // this app's .env.local was not reliably available to route handlers.
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  async headers() {
    return [{
      source: '/:path*.(svg|png|jpg|jpeg|webp|avif|woff2)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }];
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR can be disabled in constrained environments via DISABLE_HMR.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
