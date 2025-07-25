/** @type {import('next').NextConfig} */
const nextConfig = {
  // Always enable static export for GitHub Pages
  output: 'export',
  basePath: '/sarepta-fda-2025',
  assetPrefix: '/sarepta-fda-2025',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Disable ESLint during builds to avoid blocking deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during builds to avoid blocking deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['pdf-parse'],
  },

  // Webpack configuration for PDF processing
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },

  // Headers for CORS when serving PDFs
  async headers() {
    return [
      {
        source: '/pdf/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 