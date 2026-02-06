/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@sparticuz/chromium-min');
    }
    return config;
  }
};

module.exports = nextConfig;
